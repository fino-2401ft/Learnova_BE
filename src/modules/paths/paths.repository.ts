import { Injectable } from '@nestjs/common';
import { CourseStatus, Prisma } from '@prisma/client';

import { PrismaService } from '@/database/prisma/prisma.service';

/**
 * Chỉ lấy bài học của khoá ĐÃ XUẤT BẢN khi đếm.
 *
 * Một khoá bị gỡ xuất bản giữa chừng vẫn nằm trong lộ trình (bảng nối không tự dọn),
 * và đếm bài của nó sẽ khiến lộ trình quảng cáo nhiều nội dung hơn thứ người học thật
 * sự vào được.
 */
const PUBLISHED = {
  status: CourseStatus.PUBLISHED,
} satisfies Prisma.CourseWhereInput;

const PATH_SELECT = {
  learningPathId: true,
  slug: true,
  title: true,
  description: true,
  icon: true,
  orderIndex: true,
  courses: {
    orderBy: { orderIndex: 'asc' },
    select: {
      orderIndex: true,
      course: {
        select: {
          courseId: true,
          title: true,
          description: true,
          coverImageUrl: true,
          level: true,
          status: true,
          chapters: {
            orderBy: { orderIndex: 'asc' },
            select: {
              chapterId: true,
              title: true,
              orderIndex: true,
              lessons: { select: { lessonId: true, durationMinutes: true } },
            },
          },
        },
      },
    },
  },
} satisfies Prisma.LearningPathSelect;

export type PathRow = Prisma.LearningPathGetPayload<{
  select: typeof PATH_SELECT;
}>;

@Injectable()
export class PathsRepository {
  constructor(private readonly prisma: PrismaService) {}

  listAll(): Promise<PathRow[]> {
    return this.prisma.learningPath.findMany({
      where: {
        // Lộ trình không còn khoá nào xuất bản thì không có gì để học — ẩn đi thay vì
        // hiện một thẻ bấm vào là trang trống.
        courses: { some: { course: PUBLISHED } },
      },
      select: PATH_SELECT,
      orderBy: { orderIndex: 'asc' },
    });
  }

  findBySlug(slug: string): Promise<PathRow | null> {
    return this.prisma.learningPath.findUnique({
      where: { slug },
      select: PATH_SELECT,
    });
  }

  findById(learningPathId: string): Promise<PathRow | null> {
    return this.prisma.learningPath.findUnique({
      where: { learningPathId },
      select: PATH_SELECT,
    });
  }

  /**
   * Ghi danh của một người trong một tập khoá.
   *
   * Một truy vấn cho cả lộ trình thay vì một truy vấn mỗi khoá: lộ trình React có
   * mười khoá, và mười vòng đi về database để vẽ một trang là lãng phí thấy rõ.
   */
  async enrollmentsFor(userId: string, courseIds: string[]) {
    if (courseIds.length === 0) return new Map<string, EnrollmentRow>();

    const rows = await this.prisma.enrollment.findMany({
      where: { menteeId: userId, courseId: { in: courseIds } },
      select: {
        courseId: true,
        status: true,
        progress: { select: { isCompleted: true } },
      },
    });

    return new Map(rows.map((row) => [row.courseId, row]));
  }
}

export type EnrollmentRow = {
  courseId: string;
  status: import('@prisma/client').EnrollmentStatus;
  progress: { isCompleted: boolean }[];
};
