import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';

import { UsersModule } from '@/modules/users/users.module';
import { LivekitService } from './livekit.service';
import { MeetingGateway } from './meeting.gateway';
import { MeetingLifecycleService } from './meeting-lifecycle.service';
import { MeetingsController } from './meetings.controller';
import { MeetingsRepository } from './meetings.repository';
import { MeetingsService } from './meetings.service';
import { RecordingService } from './recording.service';

import type { AuthConfig } from '@/config/configuration';

/**
 * Phòng họp trực tuyến.
 *
 * Ba thứ nằm ở ba nơi khác nhau, và ranh giới đó là điều đáng nhớ nhất về module này:
 *
 *   - âm thanh/hình ảnh/màn hình chia sẻ → LiveKit, trình duyệt nối THẲNG tới đó
 *   - ai được vào, khi nào mở, khi nào đóng → module này
 *   - chat trong phòng → MeetingGateway, phát rồi thôi, không ghi database
 *
 * Backend không bao giờ chạm vào luồng media. Việc của nó là ký một token nói rằng ai
 * được làm gì, và token đó là toàn bộ quyền lực — sau khi ký thì không thu hồi được
 * cho phiên đang chạy.
 */
@Module({
  imports: [
    UsersModule,
    // Gateway tự xác minh access token trong lúc bắt tay WebSocket, giống hệt
    // ChatModule. ScheduleModule đã đăng ký một lần ở AppModule cho toàn ứng dụng.
    JwtModule.registerAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        secret: config.get<AuthConfig>('auth')!.accessSecret,
      }),
    }),
  ],
  controllers: [MeetingsController],
  providers: [
    MeetingsService,
    MeetingsRepository,
    MeetingGateway,
    LivekitService,
    RecordingService,
    MeetingLifecycleService,
  ],
  exports: [MeetingsService],
})
export class MeetingsModule {}
