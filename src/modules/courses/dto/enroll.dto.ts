import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  ArrayMinSize,
  IsArray,
  IsBoolean,
  IsInt,
  IsOptional,
  IsUUID,
  Max,
  Min,
  ValidateNested,
} from 'class-validator';

export class EnrollDto {
  @IsUUID()
  courseId: string;
}

export class UpdateProgressDto {
  @IsOptional()
  @IsBoolean()
  isCompleted?: boolean;

  /**
   * Playback position in seconds.
   *
   * Upper bound is 24 hours. Not a real lesson length — it is a sanity guard so a
   * malformed client cannot store a number that later overflows an `Int` column
   * after some arithmetic.
   */
  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(86_400)
  lastPositionSeconds?: number;
}

export class QuizAnswerDto {
  @IsUUID()
  questionId: string;

  /**
   * The chosen option, or omitted for "no answer".
   *
   * Distinguishing "skipped" from "answered wrongly" costs nothing here and is the
   * difference between a learner who ran out of time and one who misunderstood.
   */
  @IsOptional()
  @IsUUID()
  optionId?: string;
}

export class SubmitQuizDto {
  @IsArray()
  @ArrayMinSize(1)
  // A lesson has 2 questions today. The cap is deliberately loose so authoring a
  // longer quiz never requires a code change, while still bounding the payload.
  @ArrayMaxSize(50)
  @ValidateNested({ each: true })
  @Type(() => QuizAnswerDto)
  answers: QuizAnswerDto[];
}
