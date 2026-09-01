import { Injectable } from '@nestjs/common';
import { CourseStatus, Prisma, PrismaClient } from '@prisma/client';

import { PrismaService } from '@/database/prisma/prisma.service';
import type { ReplaceLessonContentDto } from './dto/authoring.dto';

/** Chữ cái hiển thị của lựa chọn. Vị trí trong mảng quyết định, không phải client. */
const LABELS = ['A', 'B', 'C', 'D'] as const;

@Injectable()
export class AuthoringRepository {
  constructor(private readonly prisma: PrismaService) {}

  // -------------------------------------------------------------------------
  // Tra cứu quyền sở hữu
  // -------------------------------------------------------------------------

  /**
   * Khoá cùng chủ sở hữu và trạng thái — ba thứ mọi lệnh ghi đều phải biết trước.
   *
   * Trả về `null` khi không tìm thấy; tầng service quyết định đó là 404 hay 403.
   */
  findCourseOwner(courseId: string) {
    return this.prisma.course.findUnique({
      where: { courseId },
      select: { courseId: true, mentorId: true, status: true, title: true },
    });
  }

  /** Từ chapterId ngược lên khoá — cần cho mọi thao tác trên chương. */
  findChapterOwner(chapterId: string) {
    return this.prisma.chapter.findUnique({
      where: { chapterId },
      select: {
        chapterId: true,
        courseId: true,
        course: { select: { mentorId: true, status: true } },
      },
    });
  }

  /** Từ lessonId ngược lên khoá — cần cho mọi thao tác trên bài. */
  findLessonOwner(lessonId: string) {
    return this.prisma.lesson.findUnique({
      where: { lessonId },
      select: {
        lessonId: true,
        chapterId: true,
        chapter: {
          select: {
            courseId: true,
            course: { select: { mentorId: true, status: true } },
          },
        },
      },
    });
  }

  isMentorApproved(userId: string): Promise<boolean> {
    return this.prisma.mentor
      .findUnique({ where: { userId }, select: { isApproved: true } })
      .then((row) => row?.isApproved ?? false);
  }

  // -------------------------------------------------------------------------
  // Khoá học
  // -------------------------------------------------------------------------

  /** Khoá của một giảng viên, MỌI trạng thái. Đây là thứ danh mục chung không trả. */
  listOwnedBy(mentorId: string) {
    return this.prisma.course.findMany({
      where: { mentorId },
      // Nháp và bị từ chối lên đầu: đó là những khoá đang cần giảng viên làm gì đó.
      orderBy: [{ status: 'asc' }, { updatedAt: 'desc' }],
      select: {
        courseId: true,
        title: true,
        description: true,
        coverImageUrl: true,
        level: true,
        status: true,
        pathOrder: true,
        rejectionReason: true,
        reviewedAt: true,
        publishedAt: true,
        createdAt: true,
        updatedAt: true,
        _count: { select: { chapters: true, enrollments: true } },
      },
    });
  }

  createCourse(data: {
    mentorId: string;
    title: string;
    description?: string;
    level?: Prisma.CourseCreateInput['level'];
  }) {
    return this.prisma.course.create({
      data: {
        mentorId: data.mentorId,
        title: data.title,
        description: data.description ?? null,
        ...(data.level ? { level: data.level } : {}),
        status: CourseStatus.DRAFT,
      },
      select: { courseId: true },
    });
  }

  updateCourse(courseId: string, data: Prisma.CourseUpdateInput) {
    return this.prisma.course.update({ where: { courseId }, data });
  }

  /**
   * Nộp duyệt.
   *
   * Xoá `rejectionReason` cùng lúc: giữ lại lý do của lần từ chối trước sẽ hiện
   * ra trên màn hình một khoá vừa được nộp lại, trông như vừa bị từ chối tiếp.
   */
  submitCourse(courseId: string) {
    return this.prisma.course.update({
      where: { courseId },
      data: {
        status: CourseStatus.PENDING_APPROVAL,
        rejectionReason: null,
        reviewedById: null,
        reviewedAt: null,
      },
      select: { courseId: true, status: true },
    });
  }

  deleteCourse(courseId: string) {
    return this.prisma.course.delete({ where: { courseId } });
  }

  // -------------------------------------------------------------------------
  // Chương
  // -------------------------------------------------------------------------

  /**
   * Thêm chương vào cuối.
   *
   * Đếm số chương hiện có rồi +1, trong một transaction: hai lần thêm gần như
   * đồng thời mà đọc `count` ngoài transaction sẽ cùng ra một số và đụng ràng
   * buộc `@@unique([courseId, orderIndex])`.
   */
  createChapter(
    courseId: string,
    data: { title: string; description?: string },
  ) {
    return this.prisma.$transaction(async (tx) => {
      const last = await tx.chapter.findFirst({
        where: { courseId },
        orderBy: { orderIndex: 'desc' },
        select: { orderIndex: true },
      });

      return tx.chapter.create({
        data: {
          courseId,
          title: data.title,
          description: data.description ?? null,
          orderIndex: (last?.orderIndex ?? 0) + 1,
        },
        select: { chapterId: true },
      });
    });
  }

  updateChapter(chapterId: string, data: Prisma.ChapterUpdateInput) {
    return this.prisma.chapter.update({ where: { chapterId }, data });
  }

  deleteChapter(chapterId: string) {
    return this.prisma.chapter.delete({ where: { chapterId } });
  }

  chapterIdsOf(courseId: string): Promise<string[]> {
    return this.prisma.chapter
      .findMany({ where: { courseId }, select: { chapterId: true } })
      .then((rows) => rows.map((r) => r.chapterId));
  }

  // -------------------------------------------------------------------------
  // Bài học
  // -------------------------------------------------------------------------

  createLesson(
    chapterId: string,
    data: { title: string; description?: string; durationMinutes?: number },
  ) {
    return this.prisma.$transaction(async (tx) => {
      const last = await tx.lesson.findFirst({
        where: { chapterId },
        orderBy: { orderIndex: 'desc' },
        select: { orderIndex: true },
      });

      return tx.lesson.create({
        data: {
          chapterId,
          title: data.title,
          description: data.description ?? null,
          durationMinutes: data.durationMinutes ?? 0,
          orderIndex: (last?.orderIndex ?? 0) + 1,
        },
        select: { lessonId: true },
      });
    });
  }

  updateLesson(lessonId: string, data: Prisma.LessonUpdateInput) {
    return this.prisma.lesson.update({ where: { lessonId }, data });
  }

  deleteLesson(lessonId: string) {
    return this.prisma.lesson.delete({ where: { lessonId } });
  }

  lessonIdsOf(chapterId: string): Promise<string[]> {
    return this.prisma.lesson
      .findMany({ where: { chapterId }, select: { lessonId: true } })
      .then((rows) => rows.map((r) => r.lessonId));
  }

  // -------------------------------------------------------------------------
  // Sắp thứ tự
  // -------------------------------------------------------------------------

  /**
   * Đánh lại `orderIndex` thành 1…N theo đúng thứ tự `orderedIds`.
   *
   * Hai lượt, và lượt đầu là bắt buộc: `@@unique([courseId, orderIndex])` được
   * Postgres kiểm ngay sau MỖI câu lệnh, không hoãn tới cuối transaction. Nên khi
   * đổi chỗ hai chương cho nhau, câu UPDATE đầu tiên đã đụng ngay số mà chương kia
   * còn đang giữ — dù trạng thái cuối cùng hoàn toàn hợp lệ.
   *
   * Phép `-x - 1` biến mọi số không âm phân biệt thành số âm phân biệt, nên bước
   * dọn chỗ không bao giờ tự đụng chính nó.
   */
  reorder(
    table: 'chapters' | 'lessons',
    parentColumn: 'course_id' | 'chapter_id',
    parentId: string,
    orderedIds: string[],
  ): Promise<void> {
    const idColumn = table === 'chapters' ? 'chapter_id' : 'lesson_id';

    return this.prisma.$transaction(async (tx) => {
      await this.park(tx, table, parentColumn, parentId);

      for (const [index, id] of orderedIds.entries()) {
        // Tên bảng và tên cột không truyền được dạng tham số nên phải nội suy,
        // nhưng cả hai đến từ hằng số trong file này chứ không từ request.
        await tx.$executeRawUnsafe(
          `UPDATE "${table}" SET "order_index" = $1 WHERE "${idColumn}" = $2::uuid`,
          index + 1,
          id,
        );
      }
    });
  }

  private park(
    tx: Prisma.TransactionClient | PrismaClient,
    table: 'chapters' | 'lessons',
    parentColumn: 'course_id' | 'chapter_id',
    parentId: string,
  ): Promise<number> {
    return tx.$executeRawUnsafe(
      `UPDATE "${table}" SET "order_index" = -"order_index" - 1
         WHERE "${parentColumn}" = $1::uuid AND "order_index" >= 0`,
      parentId,
    );
  }

  // -------------------------------------------------------------------------
  // Nội dung bài học
  // -------------------------------------------------------------------------

  /**
   * Ghi đè toàn bộ mục nội dung và quiz của một bài.
   *
   * Xoá sạch rồi tạo lại, trong một transaction. An toàn ở thời điểm hiện tại vì
   * KHÔNG bảng nào tham chiếu tới `quiz_questions`.
   *
   * ⚠ Điều đó sẽ hết đúng khi có `LessonQuizAttempt` (xem content/path.md, giai
   * đoạn 7): lúc ấy xoá câu hỏi là xoá theo cả lịch sử làm bài của học viên. Khi
   * thêm bảng đó, hàm này phải đổi sang upsert + đánh dấu `isRetired`.
   */
  replaceContent(
    lessonId: string,
    dto: ReplaceLessonContentDto,
  ): Promise<void> {
    return this.prisma.$transaction(async (tx) => {
      await tx.lessonSection.deleteMany({ where: { lessonId } });
      // quiz_options đi theo nhờ onDelete: Cascade.
      await tx.quizQuestion.deleteMany({ where: { lessonId } });

      if (dto.sections.length > 0) {
        await tx.lessonSection.createMany({
          data: dto.sections.map((section, index) => ({
            lessonId,
            kind: section.kind,
            heading: section.heading?.trim() || null,
            contentMd: section.contentMd,
            orderIndex: index + 1,
          })),
        });
      }

      for (const [index, question] of dto.quiz.entries()) {
        await tx.quizQuestion.create({
          data: {
            lessonId,
            promptMd: question.promptMd,
            explanationMd: question.explanationMd?.trim() || null,
            orderIndex: index + 1,
            options: {
              create: question.options.map((option, i) => ({
                // Nhãn suy từ vị trí, không nhận từ client: để client tự đặt nhãn
                // là mở đường cho hai lựa chọn cùng chữ "B", và cột này nằm dưới
                // ràng buộc @@unique([questionId, label]).
                label: LABELS[i] ?? 'A',
                contentMd: option.contentMd,
                isCorrect: option.isCorrect,
              })),
            },
          },
        });
      }
    });
  }

  /** Nội dung hiện tại của một bài, để mở màn hình soạn thảo. */
  findLessonContent(lessonId: string) {
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
            kind: true,
            heading: true,
            contentMd: true,
            orderIndex: true,
          },
        },
        quiz: {
          orderBy: { orderIndex: 'asc' },
          select: {
            promptMd: true,
            explanationMd: true,
            orderIndex: true,
            // Ở màn hình soạn thảo, `isCorrect` LÀ thứ cần hiện — giảng viên phải
            // thấy mình đã chọn đáp án nào. Khác hẳn màn hình học viên.
            options: {
              orderBy: { label: 'asc' },
              select: { label: true, contentMd: true, isCorrect: true },
            },
          },
        },
      },
    });
  }

  // -------------------------------------------------------------------------
  // Bảo vệ tiến độ học viên
  // -------------------------------------------------------------------------

  /**
   * Số dòng tiến độ sẽ MẤT nếu xoá bài này.
   *
   * `LessonProgress.lesson` là `onDelete: Cascade`, nên xoá một bài là xoá luôn
   * mọi dấu vết học viên đã học nó — im lặng, không lỗi, không hoàn tác được.
   * Đây là con số duy nhất đáng hỏi trước khi cho xoá.
   */
  progressCountForLesson(lessonId: string): Promise<number> {
    return this.prisma.lessonProgress.count({ where: { lessonId } });
  }

  /** Cùng câu hỏi, cho cả một chương. */
  progressCountForChapter(chapterId: string): Promise<number> {
    return this.prisma.lessonProgress.count({
      where: { lesson: { chapterId } },
    });
  }

  enrollmentCount(courseId: string): Promise<number> {
    return this.prisma.enrollment.count({ where: { courseId } });
  }

  // -------------------------------------------------------------------------
  // Học viên
  // -------------------------------------------------------------------------

  /** Ghi danh trong một khoá, kèm thông tin người học. */
  enrollmentsOf(courseId: string) {
    return this.prisma.enrollment.findMany({
      where: { courseId },
      orderBy: { enrolledAt: 'desc' },
      select: {
        enrollmentId: true,
        status: true,
        enrolledAt: true,
        completedAt: true,
        mentee: {
          select: {
            skillLevel: true,
            user: { select: { userId: true, username: true, avatarUrl: true } },
          },
        },
      },
    });
  }

  /**
   * Số bài đã hoàn thành và lần học gần nhất, cho cả danh sách trong hai truy vấn.
   *
   * `groupBy` chứ không lặp từng ghi danh: một khoá đông học viên mà đọc từng dòng
   * là đúng bài toán N+1 mà bảng này sinh ra để tránh.
   */
  async progressSummary(
    enrollmentIds: string[],
  ): Promise<Map<string, { completed: number; lastActivityAt: Date | null }>> {
    const summary = new Map<
      string,
      { completed: number; lastActivityAt: Date | null }
    >();

    if (enrollmentIds.length === 0) return summary;

    const [completed, latest] = await Promise.all([
      this.prisma.lessonProgress.groupBy({
        by: ['enrollmentId'],
        where: { enrollmentId: { in: enrollmentIds }, isCompleted: true },
        _count: { progressId: true },
      }),
      this.prisma.lessonProgress.groupBy({
        by: ['enrollmentId'],
        where: { enrollmentId: { in: enrollmentIds } },
        _max: { updatedAt: true },
      }),
    ]);

    for (const id of enrollmentIds)
      summary.set(id, { completed: 0, lastActivityAt: null });

    for (const row of completed) {
      summary.get(row.enrollmentId)!.completed = row._count.progressId;
    }

    for (const row of latest) {
      summary.get(row.enrollmentId)!.lastActivityAt = row._max.updatedAt;
    }

    return summary;
  }

  /**
   * Số học viên đã hoàn thành từng bài.
   *
   * Đây là con số nói lên chỗ người học bỏ dở: bài 1 có 12 người xong mà bài 2 chỉ
   * còn 3 thì vấn đề nằm ở bài 2. Không tổng số nào ở mức khoá thay thế được nó.
   */
  async completionByLesson(courseId: string): Promise<Map<string, number>> {
    const rows = await this.prisma.lessonProgress.groupBy({
      by: ['lessonId'],
      where: { isCompleted: true, enrollment: { courseId } },
      _count: { progressId: true },
    });

    return new Map(rows.map((r) => [r.lessonId, r._count.progressId]));
  }

  /** Bài học theo đúng thứ tự đọc, để ghép với số liệu hoàn thành. */
  lessonsInReadingOrder(courseId: string) {
    return this.prisma.lesson.findMany({
      where: { chapter: { courseId } },
      orderBy: [{ chapter: { orderIndex: 'asc' } }, { orderIndex: 'asc' }],
      select: {
        lessonId: true,
        title: true,
        orderIndex: true,
        chapter: { select: { title: true, orderIndex: true } },
      },
    });
  }

  /** Đề cương đầy đủ để dựng cây chương/bài trong màn hình soạn thảo. */
  findCourseTree(courseId: string) {
    return this.prisma.course.findUnique({
      where: { courseId },
      select: {
        courseId: true,
        title: true,
        description: true,
        coverImageUrl: true,
        level: true,
        status: true,
        rejectionReason: true,
        mentorId: true,
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
                _count: { select: { sections: true, quiz: true } },
              },
            },
          },
        },
      },
    });
  }
}
