import {
  BadRequestException,
  Injectable,
  Logger,
  ServiceUnavailableException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { RecordingStatus } from '@prisma/client';
import {
  EgressClient,
  EgressInfo,
  EgressStatus,
  EncodedFileOutput,
  EncodedFileType,
  S3Upload,
} from 'livekit-server-sdk';

import { ErrorCode } from '@/common/constants/error-codes';
import {
  LivekitConfig,
  StorageConfig,
  SupabaseS3Config,
} from '@/config/configuration';

/** Ánh xạ trạng thái của LiveKit sang trạng thái trong database.
 *
 *  Ba trạng thái đầu là "chưa xong" và job đối chiếu còn phải quay lại; ba trạng thái
 *  sau là chung cuộc. ABORTED và LIMIT_REACHED gộp vào FAILED có chủ ý: với người dùng
 *  thì cả hai đều là "không có video để xem", và tách ra chỉ thêm một nhánh giao diện
 *  mà không đổi việc gì họ làm được. Lý do cụ thể vẫn nằm ở cột `error`. */
function toRecordingStatus(status: EgressStatus): RecordingStatus {
  switch (status) {
    case EgressStatus.EGRESS_STARTING:
    case EgressStatus.EGRESS_ACTIVE:
      return RecordingStatus.RECORDING;
    case EgressStatus.EGRESS_ENDING:
      return RecordingStatus.PROCESSING;
    case EgressStatus.EGRESS_COMPLETE:
      return RecordingStatus.READY;
    default:
      return RecordingStatus.FAILED;
  }
}

export interface StartedRecording {
  egressId: string;
  storageKey: string;
  startedAt: Date;
}

/** Những gì đọc được từ LiveKit về một lần ghi. */
export interface RecordingSnapshot {
  egressId: string;
  status: RecordingStatus;
  storageKey: string | null;
  url: string | null;
  durationSec: number | null;
  sizeBytes: bigint | null;
  endedAt: Date | null;
  error: string | null;
}

/**
 * Ghi hình buổi họp bằng LiveKit Egress.
 *
 * Byte của video KHÔNG đi qua backend này, cũng không đi qua trình duyệt. LiveKit ghép
 * hình ở phía server rồi tự tải thẳng file lên Supabase Storage qua giao thức S3. Đó
 * chính là lý do phải chọn SFU ngay từ đầu thay vì P2P — trong mô hình P2P không có
 * chỗ nào đặt được máy ghi.
 *
 * Backend chỉ làm ba việc: ra lệnh bắt đầu, ra lệnh dừng, và hỏi lại trạng thái.
 *
 * TUỲ CHỌN như mọi tích hợp khác trong dự án: thiếu LiveKit hoặc thiếu cặp khoá S3 thì
 * service nằm im và mọi lời gọi trả 503. Họp trực tuyến vẫn chạy, chỉ không ghi được.
 *
 * KHÔNG có hàm xoá file, và đó là chủ ý: xoá một buổi họp khỏi database CHỈ xoá phần
 * siêu dữ liệu, file video ở lại trên Supabase. Một buổi học đã ghi là tài sản của
 * khoá học; mất nó phải là hành động có chủ ý của con người chứ không phải hệ quả phụ
 * của một lệnh dọn dẹp. Khi nào cần nút "xoá bản ghi" thì thêm hàm xoá lúc đó.
 */
@Injectable()
export class RecordingService {
  private readonly logger = new Logger(RecordingService.name);
  private readonly livekit: LivekitConfig | null;
  /**
   * Chỉ cần địa chỉ dự án, KHÔNG cần service_role key.
   *
   * Ghi hình không đọc ghi gì qua thư viện Supabase — LiveKit tự tải file lên bằng
   * giao thức S3 với cặp khoá riêng. Địa chỉ này chỉ dùng để dựng điểm cuối S3 và URL
   * công khai của video. Đòi thêm service_role key ở đây sẽ bắt người dùng cấu hình
   * cả tính năng đính kèm file trong chat chỉ để bật ghi hình.
   */
  private readonly supabaseUrl: string | null;
  private readonly s3: SupabaseS3Config | null;

  constructor(config: ConfigService) {
    this.livekit = config.get<LivekitConfig | null>('livekit') ?? null;

    const storage = config.get<StorageConfig>('storage')!;
    this.supabaseUrl = storage.supabaseUrl;
    this.s3 = storage.supabaseS3;

    if (!this.isConfigured) {
      this.logger.log(
        `Ghi hình chưa bật — thiếu: ${this.missing().join(', ')}`,
      );
    }
  }

  get isConfigured(): boolean {
    return (
      this.livekit !== null && this.supabaseUrl !== null && this.s3 !== null
    );
  }

  /** Nói RÕ thiếu cái gì thay vì liệt kê mọi biến có thể thiếu. Một dòng log kiểu
   *  "cần LIVEKIT_*, SUPABASE_URL và SUPABASE_S3_*" bắt người đọc tự dò xem mình đã
   *  điền cái nào rồi. */
  private missing(): string[] {
    const gaps: string[] = [];

    if (!this.livekit) gaps.push('LIVEKIT_*');
    if (!this.supabaseUrl) gaps.push('SUPABASE_URL');
    if (!this.s3) gaps.push('SUPABASE_S3_* và SUPABASE_RECORDING_BUCKET');

    return gaps;
  }

  /**
   * Bắt đầu ghi cả phòng thành một file MP4.
   *
   * `RoomComposite` chứ không phải ghi từng track riêng: nó ghép sẵn mọi người và cả
   * màn hình chia sẻ vào một khung hình, ra đúng một file xem lại được ngay. Ghi theo
   * track cho ra hàng chục file rời cần dựng lại mới xem được — không phải thứ để đưa
   * vào mục "xem lại buổi học".
   *
   * Đường dẫn file gắn theo courseId và meetingRoomId: khi cần dọn kho, xoá theo khoá
   * học là một tiền tố, không phải một cuộc truy tìm.
   */
  async start(input: {
    roomName: string;
    courseId: string | null;
    meetingRoomId: string;
  }): Promise<StartedRecording> {
    const { s3 } = this.require();

    const startedAt = new Date();
    const stamp = startedAt.toISOString().replace(/[:.]/g, '-');
    const scope = input.courseId ?? 'khong-thuoc-khoa-hoc';
    const storageKey = `${scope}/${input.meetingRoomId}/${stamp}.mp4`;

    const output = new EncodedFileOutput({
      fileType: EncodedFileType.MP4,
      filepath: storageKey,
      output: {
        case: 's3',
        value: new S3Upload({
          accessKey: s3.accessKeyId,
          secret: s3.secretAccessKey,
          bucket: s3.bucket,
          region: s3.region,
          endpoint: this.s3Endpoint(),
          // BẮT BUỘC với Supabase: nó đặt bucket trong ĐƯỜNG DẪN
          // (…/s3/<bucket>/<key>) chứ không phải trong tên miền như AWS. Thiếu cờ này,
          // LiveKit gọi tới một tên miền không tồn tại và lỗi chỉ hiện ra ở phía
          // LiveKit — bản ghi im lặng thất bại.
          forcePathStyle: true,
        }),
      },
    });

    let info: EgressInfo;

    try {
      info = await this.egressClient().startRoomCompositeEgress(
        input.roomName,
        output,
        {
          // Bố cục lưới: buổi học có nhiều người nói, không phải một diễn giả duy nhất.
          layout: 'grid',
        },
      );
    } catch (error) {
      const message = (error as Error).message ?? '';

      // Phòng chưa tồn tại bên LiveKit. Đây là trạng thái BÌNH THƯỜNG chứ không phải
      // sự cố: database đánh dấu LIVE ngay khi chủ phòng xin token, còn phòng trên SFU
      // chỉ ra đời khi có trình duyệt nối vào thật. Bấm ghi hình trong khoảng giữa —
      // hoặc khi camera bị chặn nên chưa kết nối được — rơi vào đúng nhánh này.
      //
      // Không có mã lỗi riêng để so, nên phải so chuỗi. Kém, nhưng thay thế duy nhất
      // là để người dùng nhận "Something went wrong on our side" cho một tình huống
      // mà họ tự xử lý được trong ba giây.
      if (/room does not exist|not found/i.test(message)) {
        throw new BadRequestException({
          code: ErrorCode.RECORDING_ROOM_NOT_READY,
          message:
            'Chưa có ai kết nối vào phòng. Bật camera/micro và chờ vào phòng xong rồi hãy ghi hình.',
        });
      }

      throw error;
    }

    this.logger.log(
      `Bắt đầu ghi hình ${input.meetingRoomId}: egress ${info.egressId}`,
    );

    return { egressId: info.egressId, storageKey, startedAt };
  }

  /**
   * Dừng ghi. LiveKit còn phải ghép file và tải lên, nên trạng thái sau lệnh này là
   * PROCESSING chứ chưa phải READY.
   *
   * Không ném lỗi khi tiến trình ghi đã tự dừng (phòng đóng trước, hoặc đã dừng rồi):
   * lệnh dừng một thứ đã dừng là không-làm-gì, không phải sự cố.
   */
  async stop(egressId: string): Promise<void> {
    if (!this.isConfigured) return;

    try {
      await this.egressClient().stopEgress(egressId);
    } catch (error) {
      this.logger.warn(
        `Không dừng được egress ${egressId}: ${(error as Error).message}`,
      );
    }
  }

  /**
   * Hỏi LiveKit trạng thái hiện tại của mọi lần ghi trong một phòng.
   *
   * VÌ SAO HỎI LẠI thay vì chờ webhook: webhook cần một địa chỉ công khai để LiveKit
   * gọi vào, mà lúc phát triển thì backend nằm sau localhost — không webhook nào tới
   * được, và bản ghi sẽ kẹt ở PROCESSING vĩnh viễn. Hỏi lại định kỳ chạy được ở cả hai
   * môi trường mà không cần cấu hình gì thêm.
   *
   * Trả về mảng rỗng khi chưa cấu hình, để nơi gọi không phải rẽ nhánh.
   */
  async snapshot(roomName: string): Promise<RecordingSnapshot[]> {
    if (!this.isConfigured) return [];

    let items: EgressInfo[];

    try {
      items = await this.egressClient().listEgress({ roomName });
    } catch (error) {
      this.logger.warn(
        `Không đọc được trạng thái ghi hình của phòng ${roomName}: ${(error as Error).message}`,
      );
      return [];
    }

    return items.map((info) => this.toSnapshot(info));
  }

  private toSnapshot(info: EgressInfo): RecordingSnapshot {
    // HAI chỗ chứa cùng một thứ, và phải đọc cả hai.
    //
    // `fileResults` là trường hiện hành, nhưng LiveKit Cloud (đo được ở bản đang dùng)
    // trả về mảng RỖNG và đặt thông tin file vào `result` — trường oneof đã đánh dấu
    // deprecated trong protocol. Chỉ đọc `fileResults` thì bản ghi lên tới nơi đầy đủ
    // mà URL vẫn null, và mục "xem lại" vĩnh viễn không có nút bấm; đúng thứ đã xảy ra
    // ở lần ghi thử đầu tiên.
    //
    // Đọc `fileResults` trước để khi LiveKit chuyển hẳn sang trường mới thì không phải
    // sửa lại lần nữa.
    const file =
      info.fileResults.at(0) ??
      (info.result?.case === 'file' ? info.result.value : undefined);

    const status = toRecordingStatus(info.status);

    return {
      egressId: info.egressId,
      status,
      storageKey: file?.filename ?? null,
      // Chỉ dựng URL khi file thật sự đã lên xong. Dựng sớm nghĩa là giao diện có một
      // đường link 404 trong lúc LiveKit còn đang tải.
      url:
        status === RecordingStatus.READY && file?.filename
          ? this.publicUrl(file.filename)
          : null,
      // LiveKit trả nano-giây (int64). Chia ra giây và ép về Number: một buổi họp
      // dài nhất cũng chỉ vài chục nghìn giây, thừa sức nằm trong số nguyên an toàn.
      durationSec: file?.duration
        ? Math.round(Number(file.duration) / 1_000_000_000)
        : null,
      sizeBytes: file?.size ?? null,
      endedAt: info.endedAt ? new Date(Number(info.endedAt) / 1_000_000) : null,
      error: info.error || null,
    };
  }

  /** `https://<project>.supabase.co/storage/v1/s3` — điểm cuối S3 của Supabase. */
  private s3Endpoint(): string {
    const { supabaseUrl } = this.require();
    return `${supabaseUrl.replace(/\/+$/, '')}/storage/v1/s3`;
  }

  /**
   * URL công khai của một object.
   *
   * Bucket phải để PUBLIC, cùng lý do đã ghi ở supabase-storage.service.ts: URL này
   * được lưu vào database và mở lại nhiều tháng sau, trong khi mọi signed URL đều có
   * hạn. Tính khó đoán đến từ UUID của buổi họp nằm trong đường dẫn.
   */
  private publicUrl(storageKey: string): string {
    const { supabaseUrl, s3 } = this.require();
    return `${supabaseUrl.replace(/\/+$/, '')}/storage/v1/object/public/${s3.bucket}/${storageKey}`;
  }

  private egressClient(): EgressClient {
    const { livekit } = this.require();
    // REST API dùng http(s), client nối bằng ws(s) — cùng host, khác lược đồ.
    return new EgressClient(
      livekit.url.replace(/^ws/, 'http'),
      livekit.apiKey,
      livekit.apiSecret,
    );
  }

  private require(): {
    livekit: LivekitConfig;
    supabaseUrl: string;
    s3: SupabaseS3Config;
  } {
    if (!this.livekit || !this.supabaseUrl || !this.s3) {
      throw new ServiceUnavailableException({
        code: ErrorCode.SERVICE_UNAVAILABLE,
        // Nêu đích danh biến còn thiếu: người đọc thông báo này thường là chính người
        // đang sửa .env, và "cần cấu hình LiveKit và Supabase" thì không giúp gì.
        message: `Ghi hình chưa được bật trên máy chủ này. Thiếu: ${this.missing().join(', ')}`,
      });
    }

    return {
      livekit: this.livekit,
      supabaseUrl: this.supabaseUrl,
      s3: this.s3,
    };
  }
}
