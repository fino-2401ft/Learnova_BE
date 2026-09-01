import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CourseStatus } from '@prisma/client';

import { ErrorCode } from '@/common/constants/error-codes';
import { PrismaService } from '@/database/prisma/prisma.service';
import { CoursesRepository } from './courses.repository';
import { EnrollmentsRepository } from './enrollments.repository';
import {
  EnrollmentDetailDto,
  EnrollmentSummaryDto,
  percentOf,
} from './dto/course.dto';
import { UpdateProgressDto } from './dto/enroll.dto';

@Injectable()
export class EnrollmentsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly courses: CoursesRepository,
    private readonly enrollments: EnrollmentsRepository,
  ) {}

  /**
   * Enrol a mentee in a published course.
   *
   * Only PUBLISHED courses can be joined, even by the mentor who wrote the draft:
   * an enrollment in a course that later gets rejected has nowhere sensible to go.
   */
  async enroll(
    courseId: string,
    menteeId: string,
  ): Promise<EnrollmentSummaryDto> {
    const course = await this.prisma.course.findUnique({
      where: { courseId },
      select: { courseId: true, status: true },
    });

    if (!course) throw new NotFoundException({ message: 'Course not found' });

    if (course.status !== CourseStatus.PUBLISHED) {
      throw new ForbiddenException({
        code: ErrorCode.COURSE_NOT_PUBLISHED,
        message: 'This course is not open for enrollment',
      });
    }

    const existing = await this.enrollments.find(courseId, menteeId);

    if (existing) {
      // 409 rather than quietly returning the existing row: the client asked to
      // create something, and "it already exists" is information it should act on.
      throw new ConflictException({
        code: ErrorCode.ALREADY_ENROLLED,
        message: 'Already enrolled in this course',
      });
    }

    await this.enrollments.create(courseId, menteeId);

    const list = await this.listForMentee(menteeId);
    return list.find((item) => item.course.courseId === courseId)!;
  }

  /**
   * Every enrollment of one mentee, with completion figures.
   *
   * Three queries regardless of how many enrollments there are: the rows, the total
   * lesson count per course, and the completed count per enrollment. Reading those
   * per row would be the classic N+1.
   */
  async listForMentee(menteeId: string): Promise<EnrollmentSummaryDto[]> {
    const rows = await this.enrollments.listForMentee(menteeId);

    if (rows.length === 0) return [];

    const [stats, completed] = await Promise.all([
      this.courses.statsByCourse(rows.map((row) => row.course.courseId)),
      this.enrollments.completedCounts(rows.map((row) => row.enrollmentId)),
    ]);

    return rows.map((row) => {
      const totalLessons = stats.get(row.course.courseId)?.lessonCount ?? 0;
      const completedLessons = completed.get(row.enrollmentId) ?? 0;

      return {
        enrollmentId: row.enrollmentId,
        status: row.status,
        enrolledAt: row.enrolledAt,
        completedAt: row.completedAt,
        completedLessons,
        totalLessons,
        percentComplete: percentOf(completedLessons, totalLessons),
        course: {
          courseId: row.course.courseId,
          title: row.course.title,
          coverImageUrl: row.course.coverImageUrl,
          level: row.course.level,
          mentor: row.course.mentor.user,
        },
      };
    });
  }

  async detail(
    courseId: string,
    menteeId: string,
  ): Promise<EnrollmentDetailDto> {
    const enrollment = await this.requireEnrollment(courseId, menteeId);

    const [lessons, totalLessons] = await Promise.all([
      this.enrollments.progressForEnrollment(enrollment.enrollmentId),
      this.enrollments.countLessonsInCourse(courseId),
    ]);

    const completedLessons = lessons.filter(
      (lesson) => lesson.isCompleted,
    ).length;

    return {
      enrollmentId: enrollment.enrollmentId,
      status: enrollment.status,
      enrolledAt: enrollment.enrolledAt,
      completedAt: enrollment.completedAt,
      completedLessons,
      totalLessons,
      percentComplete: percentOf(completedLessons, totalLessons),
      lessons,
    };
  }

  /**
   * Record progress on one lesson.
   *
   * The lesson is checked against the enrollment's course before anything is
   * written. Skipping that check would let a mentee post progress for a lesson of a
   * course they never joined — the unique constraint is on
   * (enrollmentId, lessonId), which does not care that the two are unrelated.
   */
  async updateProgress(
    lessonId: string,
    dto: UpdateProgressDto,
    menteeId: string,
  ): Promise<EnrollmentDetailDto> {
    // An empty body would still upsert a row and shift the enrollment status, so it
    // is rejected rather than treated as a no-op.
    if (
      dto.isCompleted === undefined &&
      dto.lastPositionSeconds === undefined
    ) {
      throw new BadRequestException({
        code: ErrorCode.VALIDATION_FAILED,
        message: 'Send at least one of isCompleted or lastPositionSeconds',
      });
    }

    const lesson = await this.prisma.lesson.findUnique({
      where: { lessonId },
      select: { chapter: { select: { courseId: true } } },
    });

    if (!lesson) throw new NotFoundException({ message: 'Lesson not found' });

    const courseId = lesson.chapter.courseId;
    const enrollment = await this.requireEnrollment(courseId, menteeId);
    const totalLessons = await this.enrollments.countLessonsInCourse(courseId);

    await this.enrollments.writeProgress(
      {
        enrollmentId: enrollment.enrollmentId,
        lessonId,
        isCompleted: dto.isCompleted,
        lastPositionSeconds: dto.lastPositionSeconds,
      },
      totalLessons,
    );

    return this.detail(courseId, menteeId);
  }

  private async requireEnrollment(courseId: string, menteeId: string) {
    const enrollment = await this.enrollments.find(courseId, menteeId);

    if (!enrollment) {
      throw new ForbiddenException({
        code: ErrorCode.NOT_ENROLLED,
        message: 'Not enrolled in this course',
      });
    }

    return enrollment;
  }
}
