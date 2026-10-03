import { Inject, Logger, forwardRef } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { SkipThrottle } from '@nestjs/throttler';
import {
  ConnectedSocket,
  MessageBody,
  OnGatewayConnection,
  OnGatewayDisconnect,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';

import { Public } from '@/common/decorators/public.decorator';
import { AuthenticatedUser } from '@/common/types/authenticated-user.type';
import { AuthConfig } from '@/config/configuration';
import { JwtPayloadWithClaims } from '@/modules/auth/types/jwt-payload.type';
import { UsersService } from '@/modules/users/users.service';
import {
  MeetingChatMessage,
  MeetingEvent,
  meetingRoom,
  meetingUserRoom,
} from './meeting.events';
import { MeetingsService } from './meetings.service';
import { MeetingDto, RecordingDto } from './dto/meeting.dto';

/** Trần độ dài một tin nhắn trong phòng. Ngắn hơn messenger (4000) có chủ ý: đây là
 *  kênh trao đổi nhanh giữa lúc đang nói, không phải chỗ dán cả bài. */
const MAX_MEETING_MESSAGE = 1000;

/**
 * Chống spam trong phòng: mỗi socket tối đa 10 tin trong 5 giây.
 *
 * ThrottlerGuard của Nest chỉ chặn được request HTTP, không chạm tới sự kiện
 * WebSocket — nên nếu không có đoạn này thì gửi tin trong phòng họp là đường đi
 * KHÔNG có giới hạn nào, và một client sửa vài dòng có thể bơm hàng nghìn tin mỗi
 * giây rồi server phát lại cho cả phòng.
 *
 * Mười tin trong năm giây rộng hơn nhiều so với tốc độ gõ của người thật, kể cả khi
 * cả lớp đang sôi nổi.
 */
const CHAT_BURST = 10;
const CHAT_WINDOW_MS = 5_000;

interface MeetingSocket extends Socket {
  data: {
    user?: AuthenticatedUser;
    /** Xong khi đã xác thực xong handshake. Xem handleConnection. */
    authenticated?: Promise<void>;
    /** Mốc thời gian các tin vừa gửi, cho bộ đếm chống spam. Sống và chết cùng
     *  socket, nên không cần dọn dẹp riêng. */
    chatTimes?: number[];
  };
}

/**
 * Kênh realtime của phòng họp: chat, thông báo gõ cửa, nhắc gia hạn, báo đóng phòng.
 *
 * KHÔNG chở âm thanh và hình ảnh — việc đó là của LiveKit, trình duyệt nối thẳng tới
 * đó. Gateway này chỉ lo những thứ mà hệ thống nắm quyền quyết định.
 *
 * Namespace riêng `/meeting`, tách hẳn khỏi `/chat`. Xem meeting.events.ts để biết vì
 * sao không dùng chung.
 */
@WebSocketGateway({ namespace: '/meeting' })
export class MeetingGateway
  implements OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(MeetingGateway.name);

  constructor(
    private readonly jwt: JwtService,
    private readonly config: ConfigService,
    private readonly users: UsersService,

    @Inject(forwardRef(() => MeetingsService))
    private readonly meetings: MeetingsService,
  ) {}

  /**
   * Cùng một cái bẫy đã gặp ở ChatGateway, và cùng một cách chữa.
   *
   * Socket.IO báo `connect` cho client ngay khi transport lên, KHÔNG chờ hàm này, và
   * Nest cũng không await nó. Client emit `meeting:join` ngay trong handler `connect`
   * của mình có thể tới TRƯỚC khi xác thực xong, và khi đó handler thấy `data.user`
   * rỗng rồi từ chối một socket thực ra hoàn toàn hợp lệ.
   *
   * Promise được gán ĐỒNG BỘ ở đây, trước mọi await, nên nó chắc chắn tồn tại vào lúc
   * gói tin đầu tiên được xử lý. Mọi @SubscribeMessage đọc `data.user` phải await nó.
   */
  handleConnection(client: MeetingSocket): void {
    client.data.authenticated = this.authenticate(client);
  }

  private async authenticate(client: MeetingSocket): Promise<void> {
    try {
      const token = this.extractToken(client);

      if (!token) throw new Error('missing token');

      const payload = await this.jwt.verifyAsync<JwtPayloadWithClaims>(token, {
        secret: this.config.get<AuthConfig>('auth')!.accessSecret,
      });

      const user = await this.users.findById(payload.sub);

      if (!user || !user.isActive) throw new Error('inactive account');

      client.data.user = {
        userId: user.userId,
        email: user.email,
        role: user.role,
      };

      // Phòng cá nhân: nơi nhận "bạn đã được duyệt" và lời nhắc gia hạn. Vào ngay từ
      // lúc bắt tay, không chờ join phòng họp nào — người đang chờ duyệt thì CHƯA
      // được vào phòng họp, mà lại chính là người cần nhận thông báo nhất.
      await client.join(meetingUserRoom(user.userId));
    } catch (error) {
      this.logger.debug(
        `socket ${client.id} bị từ chối: ${(error as Error).message}`,
      );
      client.disconnect(true);
    }
  }

  handleDisconnect(client: MeetingSocket): void {
    this.logger.debug(`socket ${client.id} ngắt kết nối`);
  }

  @Public()
  @SkipThrottle()
  @SubscribeMessage(MeetingEvent.JOIN)
  async join(
    @ConnectedSocket() client: MeetingSocket,
    @MessageBody() body: { meetingRoomId?: string },
  ): Promise<{ joined: string } | { error: string }> {
    await client.data.authenticated;

    const user = client.data.user;

    if (!user || !body?.meetingRoomId) return { error: 'BAD_REQUEST' };

    // Kiểm tra quyền ở đây chứ không tin client: nếu không, ai biết meetingRoomId là
    // nghe lén được toàn bộ chat của buổi họp mà không cần vào phòng.
    const allowed = await this.meetings.canAccessRealtime(
      body.meetingRoomId,
      user,
    );

    if (!allowed) return { error: 'MEETING_ACCESS_DENIED' };

    await client.join(meetingRoom(body.meetingRoomId));
    return { joined: body.meetingRoomId };
  }

  @Public()
  @SkipThrottle()
  @SubscribeMessage(MeetingEvent.LEAVE)
  async leave(
    @ConnectedSocket() client: MeetingSocket,
    @MessageBody() body: { meetingRoomId?: string },
  ): Promise<{ left: string } | { error: string }> {
    if (!body?.meetingRoomId) return { error: 'BAD_REQUEST' };

    await client.leave(meetingRoom(body.meetingRoomId));
    return { left: body.meetingRoomId };
  }

  /**
   * Chat trong phòng: nhận rồi phát lại, KHÔNG ghi database.
   *
   * Đây là điểm khác biệt cốt lõi so với messenger, và là một quyết định đã chốt chứ
   * không phải chỗ chưa làm xong. Hệ quả cần chấp nhận, nên nói rõ trên giao diện:
   * người vào muộn không thấy tin nhắn trước đó, và đóng phòng là mất hết.
   *
   * Không kiểm tra lại quyền ở đây: `client.rooms` chỉ chứa phòng mà `join` ở trên đã
   * duyệt. Người chưa được duyệt thì emit vào hư không.
   */
  @Public()
  @SkipThrottle()
  @SubscribeMessage(MeetingEvent.MESSAGE)
  async message(
    @ConnectedSocket() client: MeetingSocket,
    @MessageBody() body: { meetingRoomId?: string; content?: string },
  ): Promise<{ sent: true } | { error: string }> {
    await client.data.authenticated;

    const user = client.data.user;

    if (!user || !body?.meetingRoomId) return { error: 'BAD_REQUEST' };

    const content = (body.content ?? '').trim();

    if (!content) return { error: 'EMPTY_MESSAGE' };
    if (content.length > MAX_MEETING_MESSAGE)
      return { error: 'MESSAGE_TOO_LONG' };

    const room = meetingRoom(body.meetingRoomId);

    // Chỉ người đã ở trong phòng mới phát được. Nếu không, một socket đã xác thực có
    // thể bắn tin vào bất kỳ phòng nào mà không cần qua bước duyệt của `join`.
    if (!client.rooms.has(room)) return { error: 'MEETING_ACCESS_DENIED' };

    if (!this.withinRateLimit(client)) return { error: 'RATE_LIMITED' };

    const profile = await this.users.findById(user.userId);

    const payload: MeetingChatMessage = {
      meetingRoomId: body.meetingRoomId,
      sender: {
        userId: user.userId,
        username: profile?.username ?? 'Người dùng',
        avatarUrl: profile?.avatarUrl ?? null,
      },
      content,
      sentAt: new Date().toISOString(),
    };

    // Gửi cho CẢ người gửi (`server.to` chứ không phải `client.to`): giao diện dựng
    // bong bóng chat từ sự kiện nhận được, nên bỏ người gửi ra khỏi danh sách sẽ làm
    // tin nhắn của chính họ không bao giờ hiện lên.
    this.server.to(room).emit(MeetingEvent.MESSAGE, payload);

    return { sent: true };
  }

  // --- Phát đi từ phía service, không phải từ client ------------------------

  /** Có người ngoài khoá gõ cửa. Chỉ chủ phòng nhận được. */
  notifyKnock(
    hostId: string,
    payload: {
      meetingRoomId: string;
      user: { userId: string; username: string; avatarUrl: string | null };
    },
  ): void {
    this.server.to(meetingUserRoom(hostId)).emit(MeetingEvent.KNOCK, payload);
  }

  /** Chủ phòng đã trả lời. Gửi tới mọi thiết bị của người xin vào. */
  notifyDecision(
    userId: string,
    admitted: boolean,
    payload: { meetingRoomId: string },
  ): void {
    this.server
      .to(meetingUserRoom(userId))
      .emit(admitted ? MeetingEvent.ADMITTED : MeetingEvent.REJECTED, payload);
  }

  /** Còn 10 phút. Gửi riêng cho chủ phòng — người duy nhất gia hạn được. */
  notifyEndingSoon(
    hostId: string,
    payload: {
      meetingRoomId: string;
      scheduledEndAt: string;
      minutesLeft: number;
    },
  ): void {
    this.server
      .to(meetingUserRoom(hostId))
      .emit(MeetingEvent.ENDING_SOON, payload);
  }

  /** Vừa gia hạn. Cả phòng chỉnh lại đồng hồ đếm ngược. */
  notifyExtended(meetingRoomId: string, meeting: MeetingDto): void {
    this.server
      .to(meetingRoom(meetingRoomId))
      .emit(MeetingEvent.EXTENDED, meeting);
  }

  /** Ghi hình vừa bắt đầu hoặc vừa dừng. Cả phòng đều nhận — người trong buổi học có
   *  quyền biết mình đang được ghi lại, đó không phải thông tin riêng của chủ phòng. */
  notifyRecording(meetingRoomId: string, recording: RecordingDto): void {
    this.server
      .to(meetingRoom(meetingRoomId))
      .emit(MeetingEvent.RECORDING, { meetingRoomId, recording });
  }

  /** Phòng đã đóng. Cả phòng rời đi. */
  notifyClosed(meetingRoomId: string, reason: 'host' | 'timeout'): void {
    this.server
      .to(meetingRoom(meetingRoomId))
      .emit(MeetingEvent.CLOSED, { meetingRoomId, reason });
  }

  /**
   * Cửa sổ trượt trên chính socket đó.
   *
   * Gắn vào `client.data` chứ không phải một Map ở cấp service: bộ đếm sống và chết
   * cùng socket, nên không có gì phải dọn khi người dùng rời đi — một Map toàn cục sẽ
   * phình dần theo mọi kết nối từng đi qua, và đó là kiểu rò rỉ chỉ lộ ra sau nhiều
   * ngày chạy liên tục.
   */
  private withinRateLimit(client: MeetingSocket): boolean {
    const now = Date.now();
    const times = (client.data.chatTimes ??= []);

    while (times.length > 0 && now - times[0] > CHAT_WINDOW_MS) times.shift();

    if (times.length >= CHAT_BURST) return false;

    times.push(now);
    return true;
  }

  private extractToken(client: Socket): string | undefined {
    const fromAuth = (client.handshake.auth as { token?: unknown })?.token;

    if (typeof fromAuth === 'string' && fromAuth.length > 0) return fromAuth;

    const fromQuery = client.handshake.query?.token;

    return typeof fromQuery === 'string' && fromQuery.length > 0
      ? fromQuery
      : undefined;
  }
}
