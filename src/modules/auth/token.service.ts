import { Injectable, Logger, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { User } from '@prisma/client';
import { createHash, randomBytes } from 'node:crypto';

import { AuthConfig } from '@/config/configuration';
import { SessionRepository } from './session.repository';
import { JwtPayload } from './types/jwt-payload.type';

export interface RequestContext {
  ipAddress?: string | null;
  userAgent?: string | null;
}

export interface TokenPair {
  accessToken: string;
  expiresIn: number;
  /** Raw token. Only the controller may see it — it goes straight into the cookie. */
  refreshToken: string;
  refreshExpiresAt: Date;
}

/**
 * Window in which reusing the previous token counts as a duplicate request rather
 * than theft. Two refreshes fire together on React StrictMode double-effects and on
 * multiple open tabs; without this, dev would log users out constantly.
 */
const REUSE_GRACE_MS = 10_000;

@Injectable()
export class TokenService {
  private readonly logger = new Logger(TokenService.name);
  private readonly auth: AuthConfig;

  constructor(
    private readonly sessions: SessionRepository,
    private readonly jwt: JwtService,
    config: ConfigService,
  ) {
    this.auth = config.get<AuthConfig>('auth')!;
  }

  /** Starts a new session. Used by register and login, never by refresh. */
  async issueForUser(user: User, ctx: RequestContext): Promise<TokenPair> {
    const refreshToken = this.generateOpaqueToken();
    const refreshExpiresAt = new Date(Date.now() + this.auth.refreshTtl * 1000);

    await this.sessions.create({
      userId: user.userId,
      refreshTokenHash: this.sha256(refreshToken),
      expiresAt: refreshExpiresAt,
      ipAddress: ctx.ipAddress ?? null,
      userAgent: ctx.userAgent ?? null,
    });

    return {
      ...(await this.signAccessToken(user)),
      refreshToken,
      refreshExpiresAt,
    };
  }

  async signAccessToken(
    user: User,
  ): Promise<{ accessToken: string; expiresIn: number }> {
    const payload: JwtPayload = {
      sub: user.userId,
      email: user.email,
      role: user.role,
    };

    return {
      accessToken: await this.jwt.signAsync(payload),
      expiresIn: this.auth.accessTtl,
    };
  }

  /**
   * Validates the token, rotates it, and returns who the session belongs to.
   * Does not touch the User table — the caller loads the user and signs the token.
   */
  async rotate(
    rawToken: string,
  ): Promise<{ userId: string; refreshToken: string; refreshExpiresAt: Date }> {
    const hash = this.sha256(rawToken);
    const session = await this.sessions.findByAnyTokenHash(hash);

    if (!session || session.revokedAt || session.expiresAt <= new Date()) {
      throw this.invalidToken();
    }

    if (session.previousTokenHash === hash) {
      if (Date.now() - session.lastUsedAt.getTime() <= REUSE_GRACE_MS) {
        // Duplicate in-flight request. Reject it, but leave the session alone —
        // the caller already holds the new token from the request that won.
        throw this.invalidToken();
      }

      await this.sessions.revoke(session.sessionId);
      this.logger.warn(
        `Refresh token reuse detected, session ${session.sessionId} revoked`,
      );

      throw new UnauthorizedException({
        code: 'TOKEN_REUSE_DETECTED',
        message: 'Session revoked. Please sign in again.',
      });
    }

    const refreshToken = this.generateOpaqueToken();
    const rotated = await this.sessions.rotate(
      session.sessionId,
      hash,
      this.sha256(refreshToken),
    );

    if (!rotated) throw this.invalidToken();

    return {
      userId: session.userId,
      refreshToken,
      // Not extended. A session that keeps refreshing would otherwise live forever,
      // and so would a stolen token.
      refreshExpiresAt: session.expiresAt,
    };
  }

  async revoke(rawToken: string): Promise<void> {
    const session = await this.sessions.findByAnyTokenHash(
      this.sha256(rawToken),
    );
    if (session) await this.sessions.revoke(session.sessionId);
  }

  private generateOpaqueToken(): string {
    return randomBytes(32).toString('base64url');
  }

  // SHA-256, not bcrypt: the token is 256 random bits so there is nothing to brute
  // force, and bcrypt salts every call so it could not be looked up by index.
  private sha256(value: string): string {
    return createHash('sha256').update(value).digest('hex');
  }

  private invalidToken(): UnauthorizedException {
    return new UnauthorizedException({
      code: 'INVALID_REFRESH_TOKEN',
      message: 'Refresh token is missing, expired or already used',
    });
  }
}
