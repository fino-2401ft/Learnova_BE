import { CourseLevel, LessonSectionKind } from '@prisma/client';
import { Transform, Type } from 'class-transformer';
import {
  ArrayMaxSize,
  ArrayMinSize,
  ArrayNotEmpty,
  IsArray,
  IsBoolean,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  IsUrl,
  IsUUID,
  Length,
  Max,
  MaxLength,
  Min,
  ValidateNested,
} from 'class-validator';

const trim = () =>
  Transform(({ value }): unknown =>
    typeof value === 'string' ? value.trim() : value,
  );

// ---------------------------------------------------------------------------
// Khoá học
// ---------------------------------------------------------------------------

export class CreateCourseDto {
  @trim()
  @IsString()
  @Length(3, 200)
  title: string;

  @IsOptional()
  @trim()
  @IsString()
  @MaxLength(5000)
  description?: string;

  @IsOptional()
  @IsEnum(CourseLevel)
  level?: CourseLevel;
}

export class UpdateCourseDto {
  @IsOptional()
  @trim()
  @IsString()
  @Length(3, 200)
  title?: string;

  @IsOptional()
  @trim()
  @IsString()
  @MaxLength(5000)
  description?: string;

  @IsOptional()
  @IsEnum(CourseLevel)
  level?: CourseLevel;

  /**
   * Chỉ lưu ĐƯỜNG DẪN, không lưu chính tấm ảnh — cột trong database là `TEXT`.
   * Muốn đổi sang CDN hay S3 thì chỉ cần dán URL khác vào đây.
   */
  @IsOptional()
  @trim()
  @IsUrl(
    { require_tld: false },
    { message: 'coverImageUrl phải là một URL hợp lệ' },
  )
  @MaxLength(2000)
  coverImageUrl?: string;
}

// ---------------------------------------------------------------------------
// Chương và bài
// ---------------------------------------------------------------------------

export class CreateChapterDto {
  @trim()
  @IsString()
  @Length(2, 200)
  title: string;

  @IsOptional()
  @trim()
  @IsString()
  @MaxLength(2000)
  description?: string;
}

export class UpdateChapterDto {
  @IsOptional()
  @trim()
  @IsString()
  @Length(2, 200)
  title?: string;

  @IsOptional()
  @trim()
  @IsString()
  @MaxLength(2000)
  description?: string;
}

export class CreateLessonDto {
  @trim()
  @IsString()
  @Length(2, 200)
  title: string;

  @IsOptional()
  @trim()
  @IsString()
  @MaxLength(2000)
  description?: string;

  /** Phút. Trần 600 là chốt chặn nhập nhầm, không phải giới hạn sư phạm. */
  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(600)
  durationMinutes?: number;
}

export class UpdateLessonDto extends CreateLessonDto {
  @IsOptional()
  @trim()
  @IsString()
  @Length(2, 200)
  declare title: string;

  @IsOptional()
  @trim()
  @IsUrl({ require_tld: false })
  @MaxLength(2000)
  videoUrl?: string;
}

/**
 * Sắp lại thứ tự bằng danh sách id ĐẦY ĐỦ theo thứ tự mới.
 *
 * Gửi cả danh sách chứ không gửi từng cặp "id + vị trí mới": server so được ngay
 * với thực tế và từ chối nếu thiếu hoặc thừa phần tử. Kiểu "đổi chỗ từng cái"
 * cho phép client gửi một trạng thái nửa vời mà server không phát hiện được.
 */
export class ReorderDto {
  @IsArray()
  @ArrayNotEmpty()
  @ArrayMaxSize(200)
  @IsUUID('all', { each: true })
  orderedIds: string[];
}

// ---------------------------------------------------------------------------
// Nội dung bài học
// ---------------------------------------------------------------------------

export class SectionInputDto {
  @IsEnum(LessonSectionKind)
  kind: LessonSectionKind;

  @IsOptional()
  @trim()
  @IsString()
  @MaxLength(300)
  heading?: string;

  @IsString()
  @Length(1, 50_000)
  contentMd: string;
}

export class QuizOptionInputDto {
  @IsString()
  @Length(1, 2000)
  contentMd: string;

  @IsBoolean()
  isCorrect: boolean;
}

export class QuizQuestionInputDto {
  @IsString()
  @Length(1, 5000)
  promptMd: string;

  @IsOptional()
  @IsString()
  @MaxLength(5000)
  explanationMd?: string;

  /**
   * Đúng 4 lựa chọn, và bộ kiểm tra ở service bắt buộc có đúng 1 đáp án đúng.
   * Con số 4 khớp với toàn bộ 204 câu hỏi đang có và với khuôn soạn thảo trong
   * content/AUTHORING.md.
   */
  @IsArray()
  @ArrayMinSize(4)
  @ArrayMaxSize(4)
  @ValidateNested({ each: true })
  @Type(() => QuizOptionInputDto)
  options: QuizOptionInputDto[];
}

/**
 * Ghi đè TOÀN BỘ nội dung một bài.
 *
 * Thay cả cụm thay vì vá từng mục: màn hình soạn bài lưu một lần, và ghi đè toàn
 * bộ thì không có trạng thái nửa vời nào tồn tại được — không có mục mồ côi,
 * không có `orderIndex` thủng lỗ.
 */
export class ReplaceLessonContentDto {
  @IsArray()
  @ArrayMaxSize(100)
  @ValidateNested({ each: true })
  @Type(() => SectionInputDto)
  sections: SectionInputDto[];

  @IsArray()
  @ArrayMaxSize(50)
  @ValidateNested({ each: true })
  @Type(() => QuizQuestionInputDto)
  quiz: QuizQuestionInputDto[];
}
