import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CourseStatus, Role } from '@prisma/client';

import { ErrorCode } from '@/common/constants/error-codes';
import type { AuthenticatedUser } from '@/common/types/authenticated-user.type';
import { CoursesRepository } from './courses.repository';
import { EnrollmentsRepository } from './enrollments.repository';
import {
  ChapterOutlineDto,
  CourseDetailDto,
  CourseSummaryDto,
  PaginatedDto,
} from './dto/course.dto';
import { DEFAULT_PAGE_SIZE, ListCoursesQuery } from './dto/list-courses.query';

@Injectable()
export class CoursesService {
  constructor(
    private readonly courses: CoursesRepository,
    private readonly enrollments: EnrollmentsRepository,
  ) {}

  async list(query: ListCoursesQuery): Promise<PaginatedDto<CourseSummaryDto>> {
    const page = query.page ?? 1;
    const limit = query.limit ?? DEFAULT_PAGE_SIZE;

    const { rows, total } = await this.courses.list({
      search: query.search,
      level: query.level,
      skip: (page - 1) * limit,
      take: limit,
    });

    const stats = await this.courses.statsByCourse(
      rows.map((row) => row.courseId),
    );

    return {
      items: rows.map((row) => ({
        ...row,
        lessonCount: stats.get(row.courseId)?.lessonCount ?? 0,
        totalMinutes: stats.get(row.courseId)?.totalMinutes ?? 0,
      })),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  /**
   * @param viewer always present — the route is behind the global auth guard. A
   *               mentee gets their own enrollment folded into the response; a
   *               mentor or admin gets `enrollment: null`, since neither enrols.
   */
  async detail(
    courseId: string,
    viewer: AuthenticatedUser,
  ): Promise<CourseDetailDto> {
    const course = await this.courses.findDetail(courseId);

    if (!course) throw new NotFoundException({ message: 'Course not found' });

    this.assertVisible(course.status, course.mentorId, viewer);

    const chapters: ChapterOutlineDto[] = course.chapters.map((chapter) => ({
      chapterId: chapter.chapterId,
      title: chapter.title,
      description: chapter.description,
      orderIndex: chapter.orderIndex,
      lessons: chapter.lessons.map((lesson) => ({
        lessonId: lesson.lessonId,
        title: lesson.title,
        description: lesson.description,
        durationMinutes: lesson.durationMinutes,
        orderIndex: lesson.orderIndex,
        quizCount: lesson._count.quiz,
        documentCount: lesson._count.documents,
      })),
    }));

    const lessons = chapters.flatMap((chapter) => chapter.lessons);

    let enrollment: CourseDetailDto['enrollment'] = null;

    if (viewer.role === Role.MENTEE) {
      const row = await this.enrollments.find(courseId, viewer.userId);

      if (row) {
        const completed = await this.enrollments.completedCounts([
          row.enrollmentId,
        ]);

        enrollment = {
          enrollmentId: row.enrollmentId,
          status: row.status,
          completedLessons: completed.get(row.enrollmentId) ?? 0,
        };
      }
    }

    return {
      courseId: course.courseId,
      title: course.title,
      description: course.description,
      coverImageUrl: course.coverImageUrl,
      level: course.level,
      publishedAt: course.publishedAt,
      pathOrder: course.pathOrder,
      mentor: course.mentor.user,
      chapterCount: chapters.length,
      lessonCount: lessons.length,
      totalMinutes: lessons.reduce(
        (sum, lesson) => sum + lesson.durationMinutes,
        0,
      ),
      enrollmentCount: course._count.enrollments,
      chapters,
      enrollment,
    };
  }

  /**
   * An unpublished course is visible only to the mentor who owns it and to admins.
   *
   * Answering 403 rather than 404 is a deliberate choice: course ids are UUIDv7 and
   * are not guessable, so confirming that one exists leaks nothing, while a 404 for a
   * course the mentor is actively editing would look like data loss.
   */
  assertVisible(
    status: CourseStatus,
    mentorId: string,
    viewer: AuthenticatedUser,
  ): void {
    if (status === CourseStatus.PUBLISHED) return;

    const isOwner = viewer.role === Role.MENTOR && viewer.userId === mentorId;
    const isAdmin = viewer.role === Role.ADMIN;

    if (isOwner || isAdmin) return;

    throw new ForbiddenException({
      code: ErrorCode.COURSE_NOT_PUBLISHED,
      message: 'This course is not published',
    });
  }
}
