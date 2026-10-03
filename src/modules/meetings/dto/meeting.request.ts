import { Transform } from 'class-transformer';
import {
  IsDateString,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
} from 'class-validator';

/** Buổi họp ngắn nhất và dài nhất mà lịch chấp nhận, tính bằng phút.
 *
 *  Trần 8 tiếng không phải để chặn ai — nó chặn lỗi gõ nhầm năm (2027 thay vì 2026)
 *  tạo ra một phòng chiếm chỗ suốt 365 ngày trong danh sách của cả lớp. */
export const MIN_MEETING_MINUTES = 15;
export const MAX_MEETING_MINUTES = 8 * 60;

/** Được đặt lịch trước tối đa bao xa. Cùng lý do như trên. */
export const MAX_SCHEDULE_AHEAD_DAYS = 90;

/** Mỗi lần bấm "gia hạn" thì cộng thêm bao nhiêu phút. */
export const MIN_EXTEND_MINUTES = 5;
export const MAX_EXTEND_MINUTES = 120;

export class CreateMeetingDto {
  @Transform(({ value }): unknown =>
    typeof value === 'string' ? value.trim() : value,
  )
  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  title: string;

  @IsOptional()
  @Transform(({ value }): unknown =>
    typeof value === 'string' ? value.trim() : value,
  )
  @IsString()
  @MaxLength(2000)
  description?: string;

  /**
   * Chuỗi ISO 8601, ví dụ `2026-09-05T07:00:00+07:00`.
   *
   * Nhận chuỗi rồi tự `new Date` ở service chứ không để `@Type(() => Date)` làm: một
   * chuỗi ngày sai cú pháp qua `@Type` sẽ trở thành `Invalid Date` và lọt xuống tận
   * database, còn `@IsDateString` chặn ngay ở tầng validate với thông báo đọc được.
   *
   * PHẢI có offset múi giờ hoặc hậu tố Z. Chuỗi trần như `2026-09-05T07:00:00` được
   * Node hiểu theo giờ máy CHỦ, nên một mentor ở Việt Nam đặt lịch 7h sáng sẽ thành
   * 7h theo giờ của server đặt ở đâu đó bên Mỹ. Frontend gửi `toISOString()` là đúng.
   */
  @IsDateString({ strict: true })
  scheduledStartAt: string;

  @IsDateString({ strict: true })
  scheduledEndAt: string;
}

export class UpdateMeetingDto {
  @IsOptional()
  @Transform(({ value }): unknown =>
    typeof value === 'string' ? value.trim() : value,
  )
  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  title?: string;

  @IsOptional()
  @Transform(({ value }): unknown =>
    typeof value === 'string' ? value.trim() : value,
  )
  @IsString()
  @MaxLength(2000)
  description?: string;

  @IsOptional()
  @IsDateString({ strict: true })
  scheduledStartAt?: string;

  @IsOptional()
  @IsDateString({ strict: true })
  scheduledEndAt?: string;
}

/**
 * Gia hạn phòng đang họp.
 *
 * Theo thiết kế (docs/class-diagram-v2.md): gia hạn nghĩa là GHI ĐÈ `scheduledEndAt`,
 * không sinh thêm cột hay bảng nào. Job tự đóng phòng chỉ quét
 * `status = LIVE AND scheduledEndAt < now()` nên nó tự khắc tôn trọng lần gia hạn.
 */
export class ExtendMeetingDto {
  @IsInt()
  @Min(MIN_EXTEND_MINUTES)
  @Max(MAX_EXTEND_MINUTES)
  minutes: number;
}
