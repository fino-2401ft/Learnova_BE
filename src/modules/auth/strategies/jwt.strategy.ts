import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';

import { ErrorCode } from '@/common/constants/error-codes';
import { AuthenticatedUser } from '@/common/types/authenticated-user.type';
import { AuthConfig } from '@/config/configuration';
import { UsersService } from '@/modules/users/users.service';
import { JwtPayloadWithClaims } from '../types/jwt-payload.type';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'jwt') {
  constructor(
    config: ConfigService,
    private readonly users: UsersService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: config.get<AuthConfig>('auth')!.accessSecret,
    });
  }

  async validate(payload: JwtPayloadWithClaims): Promise<AuthenticatedUser> {
    const user = await this.users.findById(payload.sub);

    if (!user || !user.isActive) {
      throw new UnauthorizedException({
        code: ErrorCode.UNAUTHORIZED,
        message: 'Account is no longer active',
      });
    }

    return { userId: user.userId, email: user.email, role: user.role };
  }
}
