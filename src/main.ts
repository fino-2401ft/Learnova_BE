import { Logger, ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { HttpAdapterHost, NestFactory } from '@nestjs/core';
import type { NestExpressApplication } from '@nestjs/platform-express';
import cookieParser from 'cookie-parser';
import { existsSync } from 'node:fs';
import { join } from 'node:path';

import { AppModule } from './app.module';
import { AllExceptionsFilter } from './common/filters/all-exceptions.filter';
import { PrismaExceptionFilter } from './common/filters/prisma-exception.filter';
import { TransformInterceptor } from './common/interceptors/transform.interceptor';
import { ChatIoAdapter } from './modules/chat/chat-io.adapter';
import type { AppConfig } from './config/configuration';

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create<NestExpressApplication>(AppModule, {
    logger:
      process.env.NODE_ENV === 'production'
        ? ['error', 'warn', 'log']
        : ['error', 'warn', 'log', 'debug', 'verbose'],
  });

  const config = app.get(ConfigService);
  const appConfig = config.get<AppConfig>('app')!;

  // Version prefix from day one, so adding v2 later does not break running clients.
  app.setGlobalPrefix('api/v1');

  // Course cover images live on disk under public/ and are served at /static.
  //
  // Deliberately outside the api/v1 prefix: these are assets, not API resources, and
  // versioning them alongside endpoints would mean every stored image URL breaks the
  // day v2 ships. __dirname is dist/ at runtime, hence the climb to the project root.
  //
  // This is the stand-in for object storage. Swapping in S3 or Cloudinary later means
  // changing PUBLIC_BASE_URL and re-running the seed — no schema change, because the
  // database only ever stores the URL.
  const publicDir = join(__dirname, '..', 'public');

  app.useStaticAssets(publicDir, {
    prefix: '/static',
    // Assets are content-addressed by course slug and change only when the course
    // does, so a long cache is safe.
    maxAge: '7d',
  });

  // Fail loudly rather than serving 404s.
  //
  // The climb above depends on main.js landing directly in dist/, which in turn
  // depends on every compiled file living under src/. Adding a .ts file anywhere
  // else that the build includes moves the output down a level and silently breaks
  // every cover image — the only symptom is a broken <img>, which nobody traces
  // back to tsconfig. This check turns that into a line in the startup log.
  if (!existsSync(join(publicDir, 'covers'))) {
    new Logger('Bootstrap').error(
      `Static assets not found at ${publicDir}. Cover images will 404. ` +
        'Check that tsconfig.build.json still excludes everything outside src/.',
    );
  }

  // The refresh token travels in an httpOnly cookie.
  app.use(cookieParser());

  app.enableCors({
    origin: appConfig.corsOrigin,
    // Required for the browser to send the cookie cross-origin. It also forces a
    // concrete origin: browsers reject credentials paired with a "*" wildcard.
    credentials: true,
  });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      // Reject unknown fields rather than dropping them silently. An unexpected
      // field usually means the two sides disagree about the contract, and hiding
      // that makes the mismatch surface much later.
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: {
        // Query and path params arrive as strings; without this `@IsInt() page`
        // never passes.
        enableImplicitConversion: true,
      },
    }),
  );

  app.useGlobalInterceptors(new TransformInterceptor());

  // Socket.IO runs its own HTTP server and ignores app.enableCors() above, so the
  // chat gateway gets its CORS settings through this adapter. It reads them from the
  // loaded config, which a `cors` option on @WebSocketGateway could not do — that
  // decorator runs before .env is read.
  app.useWebSocketAdapter(new ChatIoAdapter(app));

  // Nest walks the filter list in REVERSE registration order, so the narrowest
  // filter must be registered LAST. Swap these two and AllExceptionsFilter swallows
  // every Prisma error, turning unique violations into 500s.
  const httpAdapterHost = app.get(HttpAdapterHost);
  app.useGlobalFilters(
    new AllExceptionsFilter(httpAdapterHost),
    new PrismaExceptionFilter(httpAdapterHost),
  );

  // Without this, onModuleDestroy never runs on SIGTERM/SIGINT and the Prisma
  // connection is left dangling on every restart.
  app.enableShutdownHooks();

  await app.listen(appConfig.port);

  const logger = new Logger('Bootstrap');
  logger.log(`API listening on http://localhost:${appConfig.port}/api/v1`);
  logger.log(`Static assets served from ${appConfig.publicBaseUrl}/static`);
  logger.log(`Chat gateway on ws://localhost:${appConfig.port}/chat`);
}

void bootstrap();
