import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Post,
  Put,
} from '@nestjs/common';
import { Role } from '@prisma/client';

import { CurrentUser } from '@/common/decorators/current-user.decorator';
import { Roles } from '@/common/decorators/roles.decorator';
import { EnrollmentDetailDto, EnrollmentSummaryDto } from './dto/course.dto';
import { EnrollDto, UpdateProgressDto } from './dto/enroll.dto';
import { EnrollmentsService } from './enrollments.service';

/**
 * Everything under /me is scoped to the caller.
 *
 * No route here takes a mentee id — it comes from the access token. An endpoint that
 * accepted one would need an ownership check on every single method, and the first
 * one forgotten is a data leak.
 */
@Controller('me')
@Roles(Role.MENTEE)
export class EnrollmentsController {
  constructor(private readonly enrollments: EnrollmentsService) {}

  @Post('enrollments')
  enroll(
    @Body() dto: EnrollDto,
    @CurrentUser('userId') menteeId: string,
  ): Promise<EnrollmentSummaryDto> {
    return this.enrollments.enroll(dto.courseId, menteeId);
  }

  @Get('enrollments')
  list(
    @CurrentUser('userId') menteeId: string,
  ): Promise<EnrollmentSummaryDto[]> {
    return this.enrollments.listForMentee(menteeId);
  }

  /** Per-lesson progress for one enrolled course. */
  @Get('enrollments/:courseId')
  detail(
    @Param('courseId', ParseUUIDPipe) courseId: string,
    @CurrentUser('userId') menteeId: string,
  ): Promise<EnrollmentDetailDto> {
    return this.enrollments.detail(courseId, menteeId);
  }

  /**
   * Record progress on one lesson.
   *
   * PUT because it is idempotent — sending `{isCompleted: true}` twice leaves the
   * same state. Returns the whole enrollment so the client picks up the recomputed
   * status and percentage without asking again.
   */
  @Put('lessons/:lessonId/progress')
  updateProgress(
    @Param('lessonId', ParseUUIDPipe) lessonId: string,
    @Body() dto: UpdateProgressDto,
    @CurrentUser('userId') menteeId: string,
  ): Promise<EnrollmentDetailDto> {
    return this.enrollments.updateProgress(lessonId, dto, menteeId);
  }
}
