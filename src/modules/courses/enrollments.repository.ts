import { Injectable } from '@nestjs/common';
import { Enrollment, EnrollmentStatus, Prisma } from '@prisma/client';

import { PrismaService } from '@/database/prisma/prisma.service';

export interface ProgressWrite {
  enrollmentId: string;
  lessonId: string;
  isCompleted?: boolean;
  lastPositionSeconds?: number;
}

@Injectable()
export class EnrollmentsRepository {
  constructor(private readonly prisma: PrismaService) {}

  find(courseId: string, menteeId: string): Promise<Enrollment | null> {
    return this.prisma.enrollment.findUnique({
      where: { courseId_menteeId: { courseId, menteeId } },
    });
  }

  create(courseId: string, menteeId: string): Promise<Enrollment> {
    return this.prisma.enrollment.create({ data: { courseId, menteeId } });
  }

  listForMentee(menteeId: string) {
    return this.prisma.enrollment.findMany({
      where: { menteeId },
      orderBy: { enrolledAt: 'desc' },
      select: {
        enrollmentId: true,
        status: true,
        enrolledAt: true,
        completedAt: true,
        course: {
          select: {
            courseId: true,
            title: true,
            coverImageUrl: true,
            level: true,
            mentor: {
              select: { user: { select: { userId: true, username: true } } },
            },
          },
        },
      },
    });
  }

  /** Completed-lesson count per enrollment, in one query for the whole list. */
  async completedCounts(enrollmentIds: string[]): Promise<Map<string, number>> {
    if (enrollmentIds.length === 0) return new Map();

    const grouped = await this.prisma.lessonProgress.groupBy({
      by: ['enrollmentId'],
      where: { enrollmentId: { in: enrollmentIds }, isCompleted: true },
      _count: { progressId: true },
    });

    return new Map(
      grouped.map((row) => [row.enrollmentId, row._count.progressId]),
    );
  }

  progressForEnrollment(enrollmentId: string) {
    return this.prisma.lessonProgress.findMany({
      where: { enrollmentId },
      select: {
        lessonId: true,
        isCompleted: true,
        lastPositionSeconds: true,
        completedAt: true,
        updatedAt: true,
      },
    });
  }

  /** Is this lesson part of the course the enrollment is for? */
  async lessonBelongsToCourse(
    lessonId: string,
    courseId: string,
  ): Promise<boolean> {
    const count = await this.prisma.lesson.count({
      where: { lessonId, chapter: { courseId } },
    });

    return count > 0;
  }

  countLessonsInCourse(courseId: string): Promise<number> {
    return this.prisma.lesson.count({ where: { chapter: { courseId } } });
  }

  /**
   * Write one lesson's progress and recompute the enrollment status from it.
   *
   * Both happen in one transaction because `Enrollment.status` is derived from
   * `LessonProgress`, and the schema says so explicitly. Writing the row and
   * recomputing the summary as two separate statements leaves a window where a
   * concurrent read sees a finished course still marked IN_PROGRESS — and if the
   * second statement fails, that state is permanent.
   *
   * `totalLessons` is passed in rather than counted here so the caller can validate
   * the lesson against the course before any write happens.
   */
  writeProgress(
    write: ProgressWrite,
    totalLessons: number,
  ): Promise<{ enrollment: Enrollment; completedLessons: number }> {
    return this.prisma.$transaction(async (tx) => {
      const now = new Date();

      const data: Prisma.LessonProgressUncheckedCreateInput = {
        enrollmentId: write.enrollmentId,
        lessonId: write.lessonId,
        isCompleted: write.isCompleted ?? false,
        lastPositionSeconds: write.lastPositionSeconds ?? 0,
        completedAt: write.isCompleted ? now : null,
      };

      await tx.lessonProgress.upsert({
        where: {
          enrollmentId_lessonId: {
            enrollmentId: write.enrollmentId,
            lessonId: write.lessonId,
          },
        },
        create: data,
        update: {
          // Only overwrite what the caller actually sent. A PATCH that carries just
          // `lastPositionSeconds` must not silently un-complete the lesson.
          ...(write.isCompleted === undefined
            ? {}
            : {
                isCompleted: write.isCompleted,
                completedAt: write.isCompleted ? now : null,
              }),
          ...(write.lastPositionSeconds === undefined
            ? {}
            : { lastPositionSeconds: write.lastPositionSeconds }),
        },
      });

      const [touchedLessons, completedLessons] = await Promise.all([
        tx.lessonProgress.count({
          where: { enrollmentId: write.enrollmentId },
        }),
        tx.lessonProgress.count({
          where: { enrollmentId: write.enrollmentId, isCompleted: true },
        }),
      ]);

      // ENROLLED means "has not opened anything yet", so any progress row at all —
      // even a saved video position — moves it on. This keeps the invariant the seed
      // data already relies on: an ENROLLED enrollment has zero progress rows.
      //
      // `totalLessons > 0` guards a course whose lessons were all deleted: without
      // it, `0 >= 0` would mark an empty course COMPLETED.
      const status =
        touchedLessons === 0
          ? EnrollmentStatus.ENROLLED
          : totalLessons > 0 && completedLessons >= totalLessons
            ? EnrollmentStatus.COMPLETED
            : EnrollmentStatus.IN_PROGRESS;

      const enrollment = await tx.enrollment.update({
        where: { enrollmentId: write.enrollmentId },
        data: {
          status,
          // Non-null exactly when status is COMPLETED. Letting the date outlive the
          // status would make "when did they finish?" return a date for a course
          // that is once again unfinished.
          completedAt: status === EnrollmentStatus.COMPLETED ? now : null,
        },
      });

      return { enrollment, completedLessons };
    });
  }
}
