import { Controller, Get, Param, ParseUUIDPipe, Query } from '@nestjs/common';

import { CurrentUser } from '@/common/decorators/current-user.decorator';
import type { AuthenticatedUser } from '@/common/types/authenticated-user.type';
import { CoursesService } from './courses.service';
import {
  CourseDetailDto,
  CourseSummaryDto,
  PaginatedDto,
} from './dto/course.dto';
import { ListCoursesQuery } from './dto/list-courses.query';

/**
 * Browsing courses requires an account.
 *
 * Neither route is `@Public()`: the global JwtAuthGuard applies, so a request with
 * no token gets 401 before reaching the handler. That makes `viewer` non-nullable
 * everywhere below, which is why nothing here has to reason about an anonymous case.
 */
@Controller('courses')
export class CoursesController {
  constructor(private readonly courses: CoursesService) {}

  @Get()
  list(
    @Query() query: ListCoursesQuery,
  ): Promise<PaginatedDto<CourseSummaryDto>> {
    return this.courses.list(query);
  }

  /**
   * Course page: description plus the full outline of chapters and lessons.
   *
   * The caller's own enrollment rides along on the response so the client can render
   * "Continue" instead of "Enroll" without a second request. Lesson *content* is a
   * different endpoint with a stricter rule — see LessonsService.
   */
  @Get(':courseId')
  detail(
    @Param('courseId', ParseUUIDPipe) courseId: string,
    @CurrentUser() viewer: AuthenticatedUser,
  ): Promise<CourseDetailDto> {
    return this.courses.detail(courseId, viewer);
  }
}
