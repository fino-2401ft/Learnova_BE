import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';

import { UsersModule } from '@/modules/users/users.module';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { SessionRepository } from './session.repository';
import { JwtStrategy } from './strategies/jwt.strategy';
import { TokenService } from './token.service';

import type { AuthConfig } from '@/config/configuration';

@Module({
  imports: [
    UsersModule,
    PassportModule,
    JwtModule.registerAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => {
        const auth = config.get<AuthConfig>('auth')!;
        return {
          secret: auth.accessSecret,
          signOptions: { expiresIn: auth.accessTtl },
        };
      },
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService, TokenService, SessionRepository, JwtStrategy],
})
export class AuthModule {}
