import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { ScheduleModule } from '@nestjs/schedule';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';

import { ConfigModule } from './config/config.module';
import { PrismaModule } from './database/prisma/prisma.module';
import { JwtAuthGuard } from './common/guards/jwt-auth.guard';
import { RolesGuard } from './common/guards/roles.guard';
import { AuthModule } from './modules/auth/auth.module';
import { AuthoringModule } from './modules/authoring/authoring.module';
import { ChatModule } from './modules/chat/chat.module';
import { CoursesModule } from './modules/courses/courses.module';
import { HealthModule } from './modules/health/health.module';
import { MeetingsModule } from './modules/meetings/meetings.module';
import { PathsModule } from './modules/paths/paths.module';

@Module({
  imports: [
    ConfigModule,
    PrismaModule,

    ThrottlerModule.forRoot([
      {
        name: 'default',
        ttl: 60_000,
        limit: 120,
      },
    ]),

    // Đăng ký MỘT LẦN cho toàn ứng dụng, không đặt trong MeetingsModule: gọi
    // forRoot() ở hai nơi sẽ dựng hai bộ đếm giờ, và mọi @Cron chạy hai lần —
    // nghĩa là phòng họp bị nhắc gia hạn hai lần cho mỗi lần đáng ra một.
    ScheduleModule.forRoot(),

    AuthModule,
    AuthoringModule,
    ChatModule,
    CoursesModule,
    HealthModule,
    MeetingsModule,
    PathsModule,
  ],
  providers: [
    // Order here is execution order. RolesGuard reads req.user, which only exists
    // after JwtAuthGuard has run.
    { provide: APP_GUARD, useClass: ThrottlerGuard },
    { provide: APP_GUARD, useClass: JwtAuthGuard },
    { provide: APP_GUARD, useClass: RolesGuard },
  ],
})
export class AppModule {}
