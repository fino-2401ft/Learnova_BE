import {
  ConflictException,
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Prisma, User } from '@prisma/client';

import {
  DUMMY_HASH,
  hashPassword,
  verifyPassword,
} from '@/common/utils/password.util';
import { UsersService } from '@/modules/users/users.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { RequestContext, TokenService } from './token.service';

export interface AuthResult {
  user: User;
  accessToken: string;
  expiresIn: number;
  refreshToken: string;
  refreshExpiresAt: Date;
}

@Injectable()
export class AuthService {
  constructor(
    private readonly users: UsersService,
    private readonly tokens: TokenService,
  ) {}

  async register(dto: RegisterDto, ctx: RequestContext): Promise<AuthResult> {
    const passwordHash = await hashPassword(dto.password);

    let user: User;
    try {
      user = await this.users.createMentee({
        email: dto.email,
        username: dto.username,
        passwordHash,
      });
    } catch (error) {
      throw this.mapUniqueViolation(error);
    }

    return this.issue(user, ctx);
  }

  async login(dto: LoginDto, ctx: RequestContext): Promise<AuthResult> {
    const user = await this.users.findByEmail(dto.email);

    const passwordMatches = await verifyPassword(
      dto.password,
      user?.passwordHash ?? DUMMY_HASH,
    );

    if (!user || !passwordMatches) {
      throw new UnauthorizedException({
        code: 'INVALID_CREDENTIALS',
        message: 'Email or password is incorrect',
      });
    }

    this.assertActive(user);

    return this.issue(user, ctx);
  }

  async refresh(rawToken: string | undefined): Promise<AuthResult> {
    if (!rawToken) {
      throw new UnauthorizedException({
        code: 'INVALID_REFRESH_TOKEN',
        message: 'Refresh token is missing, expired or already used',
      });
    }

    const rotated = await this.tokens.rotate(rawToken);
    const user = await this.users.findById(rotated.userId);

    if (!user) {
      throw new UnauthorizedException({
        code: 'INVALID_REFRESH_TOKEN',
        message: 'Refresh token is missing, expired or already used',
      });
    }

    this.assertActive(user);

    return {
      user,
      ...(await this.tokens.signAccessToken(user)),
      refreshToken: rotated.refreshToken,
      refreshExpiresAt: rotated.refreshExpiresAt,
    };
  }

  // Idempotent on purpose: calling it without a valid cookie is not an error.
  async logout(rawToken: string | undefined): Promise<void> {
    if (rawToken) await this.tokens.revoke(rawToken);
  }

  private async issue(user: User, ctx: RequestContext): Promise<AuthResult> {
    return { user, ...(await this.tokens.issueForUser(user, ctx)) };
  }

  private assertActive(user: User): void {
    if (!user.isActive) {
      throw new ForbiddenException({
        code: 'ACCOUNT_DISABLED',
        message: 'This account has been disabled',
      });
    }
  }

  private mapUniqueViolation(error: unknown): unknown {
    if (
      !(error instanceof Prisma.PrismaClientKnownRequestError) ||
      error.code !== 'P2002'
    ) {
      return error;
    }

    // target is the column list for schema-level constraints, or the index name for
    // the hand-written one on LOWER(email).
    const target = String(error.meta?.target ?? '');

    if (target.includes('email')) {
      return new ConflictException({
        code: 'EMAIL_TAKEN',
        message: 'This email is already registered',
      });
    }

    if (target.includes('username')) {
      return new ConflictException({
        code: 'USERNAME_TAKEN',
        message: 'This username is already taken',
      });
    }

    return error;
  }
}
