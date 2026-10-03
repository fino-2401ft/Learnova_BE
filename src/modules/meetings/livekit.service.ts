import {
  Injectable,
  Logger,
  ServiceUnavailableException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AccessToken, RoomServiceClient } from 'livekit-server-sdk';

import { ErrorCode } from '@/common/constants/error-codes';
import { LivekitConfig } from '@/config/configuration';

/** Bao lâu một access token còn dùng được để VÀO phòng.
 *
 *  Chỉ tính cho lúc bắt tay: LiveKit không đá người ra khi token hết hạn giữa buổi
 *  họp, nên hai tiếng ở đây không phải là trần thời lượng cuộc họp. Nó chỉ giới hạn
 *  cửa sổ mà một token bị sao chép ra ngoài còn dùng được. */
const TOKEN_TTL = '2h';

/**
 * Mọi thứ liên quan tới LiveKit — SFU chở âm thanh, hình ảnh và màn hình chia sẻ.
 *
 * Backend KHÔNG chạm vào luồng media. Việc duy nhất của nó ở đây là ký một access
 * token nói rằng "người này được vào phòng này, với những quyền này", rồi trình duyệt
 * cầm token đó nối thẳng tới LiveKit. Đây chính là chỗ mọi quyết định về quyền được
 * đóng dấu: sau khi token rời khỏi server thì không còn cách nào thu hồi quyền trong
 * phiên đó nữa, nên mọi kiểm tra phải xong TRƯỚC lúc ký.
 *
 * TUỲ CHỌN như Supabase: chưa cấu hình LIVEKIT_* thì service nằm im và mọi lời gọi
 * trả 503. Phần chat, khoá học, đính kèm ảnh không bị ảnh hưởng.
 */
@Injectable()
export class LivekitService {
  private readonly logger = new Logger(LivekitService.name);
  private readonly config: LivekitConfig | null;

  constructor(config: ConfigService) {
    this.config = config.get<LivekitConfig | null>('livekit') ?? null;

    if (!this.config) {
      this.logger.log(
        'LiveKit chưa cấu hình — mọi thứ khác vẫn chạy, chỉ vào phòng họp sẽ báo 503',
      );
    }
  }

  get isConfigured(): boolean {
    return this.config !== null;
  }

  /** Địa chỉ client dùng để nối tới SFU. Trả cùng token vì frontend cần cả hai. */
  get url(): string {
    return this.require().url;
  }

  /**
   * Ký một access token cho một người vào một phòng.
   *
   * `canPublish` là công tắc quan trọng nhất ở đây: nó quyết định người này được bật
   * mic/camera/chia sẻ màn hình hay chỉ ngồi xem. LiveKit ép quyền này ở phía server,
   * nên một client bị sửa cũng không tự bật mic được nếu token nói không.
   *
   * `identity` phải là userId của hệ thống, không phải username: nó là khoá mà mọi sự
   * kiện từ LiveKit (ai vào, ai ra, ai đang nói) tham chiếu ngược về, và username thì
   * đổi được.
   */
  async createAccessToken(input: {
    roomName: string;
    userId: string;
    displayName: string;
    /** Chủ phòng được thêm quyền quản trị phòng — xem `roomAdmin` bên dưới. */
    isHost: boolean;
  }): Promise<string> {
    const config = this.require();

    const token = new AccessToken(config.apiKey, config.apiSecret, {
      identity: input.userId,
      name: input.displayName,
      ttl: TOKEN_TTL,
    });

    token.addGrant({
      room: input.roomName,
      roomJoin: true,
      canPublish: true,
      canSubscribe: true,
      // Kênh dữ liệu của LiveKit. Không dùng cho chat — chat đi qua gateway riêng của
      // hệ thống (xem meeting.gateway.ts) — nhưng các component dựng sẵn cần nó cho
      // những việc như giơ tay, trạng thái đang gõ.
      canPublishData: true,
      // Chủ phòng được quyền tắt mic hoặc mời người khác ra khỏi phòng. Người thường
      // KHÔNG được, nếu không thì ai cũng đuổi được ai.
      roomAdmin: input.isHost,
    });

    return token.toJwt();
  }

  /**
   * Đóng phòng ở phía LiveKit, đá mọi người đang ở trong ra.
   *
   * Cần thiết vì đánh dấu `status = ENDED` trong database KHÔNG đuổi ai cả: những
   * người đang kết nối vẫn nói chuyện với nhau bình thường trong một căn phòng mà hệ
   * thống tưởng là đã đóng. Đây là bước làm cho việc đóng phòng có thật.
   *
   * Không ném lỗi: phòng có thể chưa từng được tạo ở LiveKit (không ai bấm vào), và
   * lúc đó "đóng" là một việc không cần làm chứ không phải một sự cố.
   */
  async closeRoom(roomName: string): Promise<void> {
    if (!this.config) return;

    try {
      await this.roomClient().deleteRoom(roomName);
    } catch (error) {
      this.logger.warn(
        `Không đóng được phòng ${roomName} trên LiveKit: ${(error as Error).message}`,
      );
    }
  }

  /** Mời một người ra khỏi phòng — dùng khi chủ phòng từ chối người đã vào. */
  async removeParticipant(roomName: string, userId: string): Promise<void> {
    if (!this.config) return;

    try {
      await this.roomClient().removeParticipant(roomName, userId);
    } catch (error) {
      // Người đó có thể đã tự thoát rồi. Không phải lỗi.
      this.logger.debug(
        `Không gỡ được ${userId} khỏi ${roomName}: ${(error as Error).message}`,
      );
    }
  }

  private roomClient(): RoomServiceClient {
    const config = this.require();

    // LiveKit REST API dùng http(s), còn client nối bằng ws(s) — cùng host, khác lược
    // đồ. Đổi chuỗi là cách chính thức, không phải mẹo.
    const httpUrl = config.url.replace(/^ws/, 'http');

    return new RoomServiceClient(httpUrl, config.apiKey, config.apiSecret);
  }

  private require(): LivekitConfig {
    if (!this.config) {
      throw new ServiceUnavailableException({
        code: ErrorCode.SERVICE_UNAVAILABLE,
        message:
          'Phòng họp chưa được bật trên máy chủ này. Cần cấu hình LiveKit trong .env.',
      });
    }

    return this.config;
  }
}
