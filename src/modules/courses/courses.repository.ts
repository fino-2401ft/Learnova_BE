import { Injectable } from '@nestjs/common';
import { CourseLevel, CourseStatus, Prisma } from '@prisma/client';

import { PrismaService } from '@/database/prisma/prisma.service';

export interface ListCoursesFilter {
  search?: string;
  level?: CourseLevel;
  skip: number;
  take: number;
}

/**
 * A course row plus the two numbers every catalogue card shows.
 *
 * `lessonCount` and `totalMinutes` are aggregates over chapters -> lessons, which no
 * single Prisma include can produce. They come from one grouped query per page
 * rather than one query per course.
 */
export interface CourseListRow {
  courseId: string;
  title: string;
  description: string | null;
  coverImageUrl: string | null;
  level: CourseLevel;
  publishedAt: Date | null;
  pathOrder: number | null;
  mentor: { userId: string; username: string; avatarUrl: string | null };
  chapterCount: number;
  enrollmentCount: number;
}

const MENTOR_SELECT = {
  user: { select: { userId: true, username: true, avatarUrl: true } },
} satisfies Prisma.MentorSelect;

@Injectable()
export class CoursesRepository {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Only PUBLISHED courses are ever listed.
   *
   * Search runs as `title ILIKE '%term%'`, which is exactly what the GIN trigram
   * index in migration 20260821000001_raw_indexes exists for. A leading `%` makes a
   * B-tree index useless, so without that index this degrades to a sequential scan
   * the moment the catalogue grows.
   */
  async list(
    filter: ListCoursesFilter,
  ): Promise<{ rows: CourseListRow[]; total: number }> {
    const where: Prisma.CourseWhereInput = {
      status: CourseStatus.PUBLISHED,
      ...(filter.search
        ? { title: { contains: filter.search, mode: 'insensitive' } }
        : {}),
      ...(filter.level ? { level: filter.level } : {}),
    };

    const [courses, total] = await this.prisma.$transaction([
      this.prisma.course.findMany({
        where,
        // Newest first, but `publishedAt` can be null on a row published by hand, and
        // Postgres sorts NULL first on DESC. `courseId` is a UUIDv7 so it is
        // chronological by construction and breaks ties in the same direction.
        orderBy: [{ publishedAt: 'desc' }, { courseId: 'desc' }],
        skip: filter.skip,
        take: filter.take,
        select: {
          courseId: true,
          title: true,
          description: true,
          coverImageUrl: true,
          level: true,
          publishedAt: true,
          pathOrder: true,
          mentor: { select: MENTOR_SELECT },
          _count: { select: { chapters: true, enrollments: true } },
        },
      }),
      this.prisma.course.count({ where }),
    ]);

    return {
      rows: courses.map((course) => ({
        courseId: course.courseId,
        title: course.title,
        description: course.description,
        coverImageUrl: course.coverImageUrl,
        level: course.level,
        publishedAt: course.publishedAt,
        pathOrder: course.pathOrder,
        mentor: course.mentor.user,
        chapterCount: course._count.chapters,
        enrollmentCount: course._count.enrollments,
      })),
      total,
    };
  }

  /**
   * Total lesson count and total minutes per course, for a page of course ids.
   *
   * Lessons hang off chapters, so there is no `courseId` on `lessons` to group by.
   * Grouping by `chapterId` and folding up in memory keeps this to one round trip
   * for the whole page.
   */
  async statsByCourse(
    courseIds: string[],
  ): Promise<Map<string, { lessonCount: number; totalMinutes: number }>> {
    const stats = new Map<
      string,
      { lessonCount: number; totalMinutes: number }
    >();

    if (courseIds.length === 0) return stats;

    const chapters = await this.prisma.chapter.findMany({
      where: { courseId: { in: courseIds } },
      select: { chapterId: true, courseId: true },
    });

    const courseIdByChapter = new Map(
      chapters.map((c) => [c.chapterId, c.courseId]),
    );

    const grouped = await this.prisma.lesson.groupBy({
      by: ['chapterId'],
      where: { chapterId: { in: [...courseIdByChapter.keys()] } },
      _count: { lessonId: true },
      _sum: { durationMinutes: true },
    });

    for (const courseId of courseIds)
      stats.set(courseId, { lessonCount: 0, totalMinutes: 0 });

    for (const row of grouped) {
      const courseId = courseIdByChapter.get(row.chapterId);
      if (!courseId) continue;

      const entry = stats.get(courseId)!;
      entry.lessonCount += row._count.lessonId;
      entry.totalMinutes += row._sum.durationMinutes ?? 0;
    }

    return stats;
  }

  /**
   * Course with its full outline: chapters, and each chapter's lessons.
   *
   * Deliberately does NOT reach into `LessonSection` or `QuizQuestion`. The outline
   * is what a browsing visitor sees, and pulling 1114 section rows to render a table
   * of contents would be a lot of bytes for a page that shows none of them.
   */
  findDetail(courseId: string) {
    return this.prisma.course.findUnique({
      where: { courseId },
      select: {
        courseId: true,
        title: true,
        description: true,
        coverImageUrl: true,
        level: true,
        status: true,
        publishedAt: true,
        pathOrder: true,
        mentorId: true,
        mentor: { select: MENTOR_SELECT },
        _count: { select: { enrollments: true } },
        chapters: {
          orderBy: { orderIndex: 'asc' },
          select: {
            chapterId: true,
            title: true,
            description: true,
            orderIndex: true,
            lessons: {
              orderBy: { orderIndex: 'asc' },
              select: {
                lessonId: true,
                title: true,
                description: true,
                durationMinutes: true,
                orderIndex: true,
                _count: { select: { quiz: true, documents: true } },
              },
            },
          },
        },
      },
    });
  }

  /**
   * A lesson with everything needed to render it.
   *
   * `QuizOption.isCorrect` is NOT selected. Leaving it out here rather than stripping
   * it in the service means the value never enters the process at all, so no future
   * refactor of the DTO layer can leak it by accident.
   */
  findLesson(lessonId: string) {
    return this.prisma.lesson.findUnique({
      where: { lessonId },
      select: {
        lessonId: true,
        title: true,
        description: true,
        videoUrl: true,
        durationMinutes: true,
        orderIndex: true,
        chapter: {
          select: {
            chapterId: true,
            title: true,
            orderIndex: true,
            course: {
              select: {
                courseId: true,
                title: true,
                status: true,
                mentorId: true,
              },
            },
          },
        },
        sections: {
          orderBy: { orderIndex: 'asc' },
          select: {
            sectionId: true,
            kind: true,
            heading: true,
            contentMd: true,
            orderIndex: true,
          },
        },
        quiz: {
          orderBy: { orderIndex: 'asc' },
          select: {
            questionId: true,
            promptMd: true,
            orderIndex: true,
            options: {
              orderBy: { label: 'asc' },
              select: { optionId: true, label: true, contentMd: true },
            },
          },
        },
        documents: {
          orderBy: { createdAt: 'asc' },
          select: {
            documentId: true,
            fileName: true,
            fileUrl: true,
            fileType: true,
            fileSize: true,
          },
        },
      },
    });
  }

  /**
   * Neighbouring lessons in reading order, for prev/next links.
   *
   * Ordering is (chapter.orderIndex, lesson.orderIndex), so this cannot be done with
   * a single comparison on one column.
   */
  async lessonSequence(
    courseId: string,
  ): Promise<
    { lessonId: string; chapterOrder: number; lessonOrder: number }[]
  > {
    const chapters = await this.prisma.chapter.findMany({
      where: { courseId },
      orderBy: { orderIndex: 'asc' },
      select: {
        orderIndex: true,
        lessons: {
          orderBy: { orderIndex: 'asc' },
          select: { lessonId: true, orderIndex: true },
        },
      },
    });

    return chapters.flatMap((chapter) =>
      chapter.lessons.map((lesson) => ({
        lessonId: lesson.lessonId,
        chapterOrder: chapter.orderIndex,
        lessonOrder: lesson.orderIndex,
      })),
    );
  }

  /** Correct answers for one lesson's quiz. Server-side grading only. */
  answerKey(lessonId: string) {
    return this.prisma.quizQuestion.findMany({
      where: { lessonId },
      orderBy: { orderIndex: 'asc' },
      select: {
        questionId: true,
        explanationMd: true,
        orderIndex: true,
        options: { select: { optionId: true, label: true, isCorrect: true } },
      },
    });
  }
}
