import { AssessmentStatus } from '@prisma/client';
import {
  ArrayNotEmpty,
  IsArray,
  IsUUID,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

/** Một lựa chọn hiển thị cho người làm bài. KHÔNG có `isCorrect` — đáp án đúng không
 *  bao giờ rời khỏi server trước khi nộp bài. */
export interface AssessmentOptionDto {
  optionId: string;
  label: string;
  contentMd: string;
}

export interface AssessmentQuestionDto {
  questionId: string;
  orderIndex: number;
  promptMd: string;
  /** Tên kỹ năng câu này chấm cho. Hiện lên để người làm bài biết mình đang được đo
   *  cái gì — và để phần kết quả sau đó không phải là một bất ngờ. */
  skillName: string;
  options: AssessmentOptionDto[];
  /** Lựa chọn đã chọn, `null` nếu chưa trả lời. Cho phép làm dở rồi quay lại. */
  selectedOptionId: string | null;
}

/** Bài kiểm tra đang làm dở. Không kèm đáp án đúng, không kèm giải thích. */
export interface AssessmentDto {
  assessmentId: string;
  learningPathSlug: string;
  learningPathTitle: string;
  status: AssessmentStatus;
  startedAt: Date;
  questions: AssessmentQuestionDto[];
}

/** Điểm một kỹ năng sau khi nộp. */
export interface SkillScoreDto {
  skillCode: string;
  skillName: string;
  domain: string;
  correct: number;
  total: number;
  /** 0…100, làm tròn. */
  percent: number;
  /** Đạt ngưỡng thì các chương của kỹ năng này được bỏ qua. */
  mastered: boolean;
}

/** Kết quả sau khi nộp bài. */
export interface AssessmentResultDto {
  assessmentId: string;
  learningPathSlug: string;
  submittedAt: Date;
  correct: number;
  total: number;
  skillScores: SkillScoreDto[];
  /** Số chương được bỏ qua nhờ kết quả này, trên tổng số chương của lộ trình. */
  skippedChapters: number;
  totalChapters: number;
  /** Số phút học tiết kiệm được. Đây là con số nói lên giá trị của bài test rõ hơn
   *  bất kỳ tỷ lệ phần trăm nào. */
  savedMinutes: number;
}

class AnswerInput {
  @IsUUID()
  questionId: string;

  /** Lựa chọn đã chọn. Câu không gửi lên tính là bỏ trống, và bỏ trống là sai. */
  @IsUUID()
  optionId: string;
}

export class SubmitAssessmentDto {
  /**
   * Toàn bộ câu trả lời, gửi một lần lúc nộp.
   *
   * Không có endpoint lưu từng câu: bài chỉ dài vài chục câu và làm trong một lượt,
   * nên ghi từng câu một chỉ tạo thêm hàng chục request mà không cứu được gì — đóng
   * tab giữa chừng thì bài vẫn dang dở dù đã lưu tới câu nào.
   */
  @IsArray()
  @ArrayNotEmpty()
  @ValidateNested({ each: true })
  @Type(() => AnswerInput)
  answers: AnswerInput[];
}
