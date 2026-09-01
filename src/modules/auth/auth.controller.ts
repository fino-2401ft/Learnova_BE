import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  Req,
  Res,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Throttle } from '@nestjs/throttler';
import type { CookieOptions, Request, Response } from 'express';

import { CurrentUser } from '@/common/decorators/current-user.decorator';
import { Public } from '@/common/decorators/public.decorator';
import type { AuthenticatedUser } from '@/common/types/authenticated-user.type';
import type { AppConfig, AuthConfig } from '@/config/configuration';
import { AuthResult, AuthService } from './auth.service';
import { AuthResponseDto } from './dto/auth-response.dto';
import { toAuthUserDto } from './dto/auth-user.dto';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { RequestContext } from './token.service';

@Controller('auth')
export class AuthController {
  private readonly app: AppConfig;
  private readonly auth: AuthConfig;

  constructor(
    private readonly authService: AuthService,
    config: ConfigService,
  ) {
    this.app = config.get<AppConfig>('app')!;
    this.auth = config.get<AuthConfig>('auth')!;
  }

  @Public()
  @Post('register')
  async register(
    @Body() dto: RegisterDto,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ): Promise<AuthResponseDto> {
    return this.respond(
      await this.authService.register(dto, this.context(req)),
      res,
    );
  }

  @Public()
  @Post('login')
  @HttpCode(HttpStatus.OK)
  // Tighter than the global limit: this is the endpoint worth guessing against.
  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  async login(
    @Body() dto: LoginDto,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ): Promise<AuthResponseDto> {
    return this.respond(
      await this.authService.login(dto, this.context(req)),
      res,
    );
  }

  @Public()
  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  // Takes no body: the refresh token travels in an httpOnly cookie.
  async refresh(
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ): Promise<AuthResponseDto> {
    const raw = req.cookies?.[this.auth.refreshCookieName] as
      string | undefined;
    return this.respond(await this.authService.refresh(raw), res);
  }

  @Public()
  @Post('logout')
  @HttpCode(HttpStatus.NO_CONTENT)
  async logout(
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ): Promise<void> {
    await this.authService.logout(
      req.cookies?.[this.auth.refreshCookieName] as string | undefined,
    );
    res.clearCookie(this.auth.refreshCookieName, this.cookieOptions());
  }

  @Get('me')
  me(@CurrentUser() user: AuthenticatedUser): AuthenticatedUser {
    return user;
  }

  private respond(result: AuthResult, res: Response): AuthResponseDto {
    res.cookie(
      this.auth.refreshCookieName,
      result.refreshToken,
      this.cookieOptions(result.refreshExpiresAt),
    );

    return {
      accessToken: result.accessToken,
      expiresIn: result.expiresIn,
      user: toAuthUserDto(result.user),
    };
  }

  /**
   * Shared by set and clear. A browser only drops a cookie when path, sameSite and
   * secure match what was set, so these must never drift apart.
   */
  private cookieOptions(expiresAt?: Date): CookieOptions {
    return {
      httpOnly: true,
      secure: this.app.isProduction,
      // Dev keeps the frontend and API both on localhost, which counts as same-site.
      // A deployed frontend on another domain needs 'none', and 'none' requires HTTPS.
      sameSite: this.app.isProduction ? 'none' : 'lax',
      // Never sent to any route that has no business reading it.
      path: '/api/v1/auth',
      ...(expiresAt ? { expires: expiresAt } : {}),
    };
  }

  private context(req: Request): RequestContext {
    return {
      ipAddress: req.ip ?? null,
      userAgent: req.get('user-agent')?.slice(0, 255) ?? null,
    };
  }
}
