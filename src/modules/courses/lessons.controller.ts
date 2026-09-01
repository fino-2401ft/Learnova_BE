import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Post,
} from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';

import { CurrentUser } from '@/common/decorators/current-user.decorator';
import type { AuthenticatedUser } from '@/common/types/authenticated-user.type';
import { LessonDetailDto } from './dto/course.dto';
import { SubmitQuizDto } from './dto/enroll.dto';
import { LessonsService, QuizResultDto } from './lessons.service';

@Controller('lessons')
export class LessonsController {
  constructor(private readonly lessons: LessonsService) {}

  /** Full lesson content. Requires an enrollment; see LessonsService. */
  @Get(':lessonId')
  detail(
    @Param('lessonId', ParseUUIDPipe) lessonId: string,
    @CurrentUser() viewer: AuthenticatedUser,
  ): Promise<LessonDetailDto> {
    return this.lessons.detail(lessonId, viewer);
  }

  /**
   * Submit quiz answers and get them graded.
   *
   * POST and 200 rather than 201: this creates no resource, it returns a verdict.
   *
   * Throttled below the global limit because the response contains the correct
   * answers. Without a cap, a client could submit repeatedly with different guesses
   * and read the answer key straight out of the results.
   */
  @Post(':lessonId/quiz')
  @HttpCode(HttpStatus.OK)
  @Throttle({ default: { limit: 10, ttl: 60_000 } })
  submitQuiz(
    @Param('lessonId', ParseUUIDPipe) lessonId: string,
    @Body() dto: SubmitQuizDto,
    @CurrentUser() viewer: AuthenticatedUser,
  ): Promise<QuizResultDto> {
    return this.lessons.gradeQuiz(lessonId, dto, viewer);
  }
}
