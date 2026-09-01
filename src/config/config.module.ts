import { Module } from '@nestjs/common';
import { ConfigModule as NestConfigModule } from '@nestjs/config';

import { configuration } from './configuration';
import { validateEnv } from './env.validation';

/** Wraps Nest's ConfigModule. Global because config is needed everywhere and
 *  re-importing it in each feature module says nothing about the architecture. */
@Module({
  imports: [
    NestConfigModule.forRoot({
      isGlobal: true,
      load: [configuration],
      validate: validateEnv,
      // Read .env once at boot. Without this every lookup hits process.env.
      cache: true,
      // Real OS environment wins over .env, which is how deployments supply config.
      ignoreEnvFile: process.env.NODE_ENV === 'production',
    }),
  ],
})
export class ConfigModule {}
