import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';

import { MeetingRow, MeetingsRepository } from './meetings.repository';
import { MeetingsService } from './meetings.service';

/** Còn bao nhiêu phút thì nhắc chủ phòng gia hạn. */
const WARN_BEFORE_MINUTES = 10;

/** Job chạy mỗi phút, nên cửa sổ quét rộng đúng một phút. */
const TICK_MINUTES = 1;

@Injectable()
export class MeetingLifecycleService {
  private readonly logger = new Logger(MeetingLifecycleService.name);

  /**
   * Những phòng đã được nhắc rồi.
   *
   * Cần thiết vì cửa sổ quét và nhịp chạy không bao giờ khớp tuyệt đối: một phòng nằm
   * gần mép cửa sổ có thể lọt vào hai lần quét liên tiếp, và chủ phòng nhận hai lần
   * nhắc cho cùng một buổi.
   *
   * Nằm trong bộ nhớ chứ không phải database, và điều đó có hệ quả thật, nên nói rõ:
   * khởi động lại server thì tập này rỗng, nên một phòng đang trong khoảng 10 phút
   * cuối sẽ bị nhắc lại. Một lời nhắc thừa sau khi deploy là cái giá rẻ hơn nhiều so
   * với thêm một cột vào bảng, và gia hạn vốn là hành động có chủ ý của con người chứ
   * không tự động.
   *
   * Nếu chạy nhiều instance thì mỗi instance nhắc một lần — xem ghi chú Redis trong
   * docs/class-diagram-v2.md.
   */
  private readonly warned = new Set<string>();

  constructor(
    private readonly repo: MeetingsRepository,
    private readonly meetings: MeetingsService,
  ) {}

  /**
   * Mỗi phút: nhắc phòng sắp hết giờ, rồi đóng phòng đã quá giờ.
   *
   * Một job làm cả hai việc chứ không tách đôi: chúng đọc cùng một bảng theo cùng một
   * index, và chạy nối tiếp trong một nhịp thì không bao giờ có cảnh job đóng phòng
   * chạy trước job nhắc và đóng mất một phòng vừa mới được nhắc.
   */
  @Cron(CronExpression.EVERY_MINUTE)
  async tick(): Promise<void> {
    await this.warnEndingSoon();
    await this.closeOverdue();
    await this.syncRecordings();
  }

  /**
   * Hỏi LiveKit xem các bản ghi còn dang dở đã xong chưa.
   *
   * Đây là thứ đưa một bản ghi từ PROCESSING sang READY. Không có bước này thì sau khi
   * dừng ghi, mục Meeting History sẽ mãi hiện "đang xử lý" — file đã nằm trên kho lưu
   * trữ nhưng không ai biết.
   *
   * Chạy sau `closeOverdue` có chủ ý: phòng vừa bị đóng ở bước trên cũng vừa dừng ghi,
   * nên nhịp này bắt luôn được trạng thái mới của nó thay vì phải chờ thêm một phút.
   */
  private async syncRecordings(): Promise<void> {
    let pending: Awaited<
      ReturnType<MeetingsRepository['findUnsettledRecordings']>
    >;

    try {
      pending = await this.repo.findUnsettledRecordings();
    } catch (error) {
      this.logger.error(
        `Không quét được bản ghi dang dở: ${(error as Error).message}`,
      );
      return;
    }

    // Gộp theo phòng: một lời gọi LiveKit trả về mọi bản ghi của phòng đó, nên hỏi
    // riêng từng bản ghi là gọi thừa.
    const rooms = new Set(pending.map((r) => r.meetingRoom.meetingCode));

    for (const roomName of rooms) {
      try {
        await this.meetings.syncRecordings(roomName);
      } catch (error) {
        this.logger.error(
          `Không đồng bộ được bản ghi của phòng ${roomName}: ${(error as Error).message}`,
        );
      }
    }
  }

  private async warnEndingSoon(): Promise<void> {
    const now = Date.now();

    // Cửa sổ [còn 10 phút, còn 9 phút): so bằng "đúng 10 phút" sẽ không bao giờ khớp
    // vì job không chạy đúng vào giây thứ 0.
    const from = new Date(now + (WARN_BEFORE_MINUTES - TICK_MINUTES) * 60_000);
    const to = new Date(now + WARN_BEFORE_MINUTES * 60_000);

    let rows: MeetingRow[];

    try {
      rows = await this.repo.findEndingSoon(from, to);
    } catch (error) {
      // Một lần lỗi database không được phép giết cron job — Nest không tự khởi động
      // lại nó, và triệu chứng sẽ là phòng họp vĩnh viễn không bao giờ tự đóng nữa.
      this.logger.error(
        `Không quét được phòng sắp hết giờ: ${(error as Error).message}`,
      );
      return;
    }

    for (const row of rows) {
      if (this.warned.has(row.meetingRoomId)) continue;

      this.warned.add(row.meetingRoomId);

      const minutesLeft = Math.max(
        1,
        Math.round((row.scheduledEndAt.getTime() - now) / 60_000),
      );

      this.meetings.notifyEndingSoon(row, minutesLeft);
      this.logger.debug(
        `Nhắc gia hạn: ${row.meetingRoomId} còn ${minutesLeft} phút`,
      );
    }
  }

  private async closeOverdue(): Promise<void> {
    let rows: MeetingRow[];

    try {
      rows = await this.repo.findOverdue(new Date());
    } catch (error) {
      this.logger.error(
        `Không quét được phòng quá giờ: ${(error as Error).message}`,
      );
      return;
    }

    for (const row of rows) {
      try {
        await this.meetings.closeExpired(row);
        // Chỉ quên sau khi đã đóng xong: quên sớm thì một lỗi ở giữa sẽ khiến phòng
        // được nhắc lại ở nhịp sau như thể chưa từng nhắc.
        this.warned.delete(row.meetingRoomId);

        this.logger.log(`Đã tự đóng phòng quá giờ: ${row.meetingRoomId}`);
      } catch (error) {
        // Đóng từng phòng độc lập: một phòng hỏng không được kéo theo các phòng còn
        // lại trong cùng nhịp.
        this.logger.error(
          `Không đóng được ${row.meetingRoomId}: ${(error as Error).message}`,
        );
      }
    }
  }
}
