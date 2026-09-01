import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CourseStatus } from '@prisma/client';

import { ErrorCode } from '@/common/constants/error-codes';
import { AuthoringRepository } from './authoring.repository';
import {
  LOCK_REASON,
  canDelete,
  canEditContent,
  canEditMetadata,
  canEditStructure,
  canSubmit,
} from './authoring.policy';
import type {
  CreateChapterDto,
  CreateCourseDto,
  CreateLessonDto,
  ReorderDto,
  ReplaceLessonContentDto,
  UpdateChapterDto,
  UpdateCourseDto,
  UpdateLessonDto,
} from './dto/authoring.dto';

/**
 * Soạn thảo khoá học.
 *
 * Mọi phương thức ghi đi qua đúng một cửa: `requireCourse`, `requireChapter` hoặc
 * `requireLesson`. Ba hàm đó kiểm tra ba thứ theo đúng thứ tự — tồn tại, thuộc về
 * người gọi, trạng thái cho phép — nên không endpoint nào phải tự nhớ.
 */
@Injectable()
export class AuthoringService {
  constructor(private readonly repo: AuthoringRepository) {}

  // -------------------------------------------------------------------------
  // Cổng kiểm tra
  // -------------------------------------------------------------------------

  /**
   * Giảng viên chưa được duyệt thì không soạn được gì.
   *
   * `RolesGuard` chỉ biết vai trò là MENTOR. Cờ `Mentor.isApproved` là thứ nói
   * người này đã được quản trị viên chấp nhận hay chưa — schema đã ghi rõ "Having
   * a mentor profile is not the same as being allowed to publish courses".
   */
  private async requireApproved(mentorId: string): Promise<void> {
    if (!(await this.repo.isMentorApproved(mentorId))) {
      throw new ForbiddenException({
        code: ErrorCode.MENTOR_NOT_APPROVED,
        message:
          'Hồ sơ giảng viên của bạn đang chờ duyệt nên chưa thể soạn khoá học',
      });
    }
  }

  private async requireCourse(
    courseId: string,
    mentorId: string,
    need: 'metadata' | 'content' | 'structure' | 'submit' | 'delete' | 'read',
  ): Promise<{ courseId: string; status: CourseStatus }> {
    const course = await this.repo.findCourseOwner(courseId);

    if (!course)
      throw new NotFoundException({ message: 'Không tìm thấy khoá học' });

    // 404 chứ không phải 403 khi không phải chủ sở hữu: trả 403 là xác nhận
    // courseId đó có thật và thuộc về ai đó — thông tin người gọi không có quyền
    // biết. Chủ sở hữu thật thì không bao giờ gặp nhánh này.
    if (course.mentorId !== mentorId) {
      throw new NotFoundException({ message: 'Không tìm thấy khoá học' });
    }

    this.assertAllowed(course.status, need);
    return { courseId: course.courseId, status: course.status };
  }

  private assertAllowed(status: CourseStatus, need: string): void {
    const ok =
      need === 'read' ||
      (need === 'metadata' && canEditMetadata(status)) ||
      (need === 'content' && canEditContent(status)) ||
      (need === 'structure' && canEditStructure(status)) ||
      (need === 'submit' && canSubmit(status)) ||
      (need === 'delete' && canDelete(status));

    if (ok) return;

    throw new ConflictException({
      code: ErrorCode.COURSE_LOCKED,
      message:
        LOCK_REASON[status] ||
        'Khoá học đang ở trạng thái không cho phép thao tác này',
    });
  }

  private async requireChapter(
    chapterId: string,
    mentorId: string,
    need: 'content' | 'structure' = 'structure',
  ) {
    const chapter = await this.repo.findChapterOwner(chapterId);

    if (!chapter || chapter.course.mentorId !== mentorId) {
      throw new NotFoundException({ message: 'Không tìm thấy chương' });
    }

    this.assertAllowed(chapter.course.status, need);
    return chapter;
  }

  private async requireLesson(
    lessonId: string,
    mentorId: string,
    need: 'content' | 'structure' = 'structure',
  ) {
    const lesson = await this.repo.findLessonOwner(lessonId);

    if (!lesson || lesson.chapter.course.mentorId !== mentorId) {
      throw new NotFoundException({ message: 'Không tìm thấy bài học' });
    }

    this.assertAllowed(lesson.chapter.course.status, need);
    return lesson;
  }

  /**
   * Chặn xoá thứ đang giữ tiến độ học viên.
   *
   * Kiểm theo DỮ LIỆU chứ không theo trạng thái khoá: một khoá đã xuất bản mà chưa
   * ai học thì xoá bài trong đó hoàn toàn vô hại, còn một khoá vừa bị từ chối
   * nhưng từng có học viên thì không.
   *
   * Không có cách hoàn tác: `LessonProgress.lesson` là `onDelete: Cascade`, nên
   * lệnh xoá đi qua là dữ liệu biến mất, không báo lỗi gì.
   */
  private assertNoLearnerProgress(count: number, noun: string): void {
    if (count === 0) return;

    throw new ConflictException({
      code: ErrorCode.HAS_LEARNER_PROGRESS,
      message: `Không xoá được ${noun}: ${count} lượt học của học viên sẽ mất theo. Hãy sửa nội dung thay vì xoá.`,
    });
  }

  // -------------------------------------------------------------------------
  // Khoá học
  // -------------------------------------------------------------------------

  listMine(mentorId: string) {
    return this.repo.listOwnedBy(mentorId);
  }

  async getTree(courseId: string, mentorId: string) {
    await this.requireCourse(courseId, mentorId, 'read');
    return this.repo.findCourseTree(courseId);
  }

  async createCourse(dto: CreateCourseDto, mentorId: string) {
    await this.requireApproved(mentorId);

    const created = await this.repo.createCourse({ mentorId, ...dto });
    return this.repo.findCourseTree(created.courseId);
  }

  async updateCourse(courseId: string, dto: UpdateCourseDto, mentorId: string) {
    if (Object.keys(dto).length === 0) {
      throw new BadRequestException({
        code: ErrorCode.VALIDATION_FAILED,
        message: 'Không có trường nào để cập nhật',
      });
    }

    await this.requireCourse(courseId, mentorId, 'metadata');
    await this.repo.updateCourse(courseId, dto);
    return this.repo.findCourseTree(courseId);
  }

  /**
   * Nộp duyệt.
   *
   * Chặn nộp khoá rỗng: một khoá không có bài nào thì người duyệt chẳng có gì để
   * đọc, và từ chối nó chỉ tốn một vòng qua lại.
   */
  async submitCourse(courseId: string, mentorId: string) {
    await this.requireApproved(mentorId);
    await this.requireCourse(courseId, mentorId, 'submit');

    const tree = await this.repo.findCourseTree(courseId);
    const lessons = tree?.chapters.flatMap((c) => c.lessons) ?? [];

    if (lessons.length === 0) {
      throw new BadRequestException({
        code: ErrorCode.COURSE_EMPTY,
        message:
          'Khoá học chưa có bài nào. Thêm ít nhất một bài trước khi nộp duyệt.',
      });
    }

    const empty = lessons.filter((lesson) => lesson._count.sections === 0);

    if (empty.length > 0) {
      throw new BadRequestException({
        code: ErrorCode.COURSE_EMPTY,
        message: `${empty.length} bài chưa có nội dung: ${empty
          .slice(0, 3)
          .map((l) => `"${l.title}"`)
          .join(', ')}${empty.length > 3 ? '…' : ''}`,
      });
    }

    return this.repo.submitCourse(courseId);
  }

  async deleteCourse(courseId: string, mentorId: string): Promise<void> {
    await this.requireCourse(courseId, mentorId, 'delete');

    // `Enrollment.course` là `onDelete: Restrict`, nên Postgres cũng chặn — nhưng
    // nó chặn bằng một lỗi khoá ngoại khó hiểu. Kiểm ở đây để câu trả lời nói
    // đúng chuyện gì đang xảy ra.
    const enrolled = await this.repo.enrollmentCount(courseId);

    if (enrolled > 0) {
      throw new ConflictException({
        code: ErrorCode.HAS_LEARNER_PROGRESS,
        message: `Không xoá được khoá học: đã có ${enrolled} học viên ghi danh.`,
      });
    }

    await this.repo.deleteCourse(courseId);
  }

  // -------------------------------------------------------------------------
  // Học viên
  // -------------------------------------------------------------------------

  /**
   * Ai đang học khoá này, và tới đâu.
   *
   * Trả về hai góc nhìn vì chúng trả lời hai câu hỏi khác nhau:
   *   `learners`    ai đang tụt lại  -> nhắn riêng cho người đó
   *   `lessonStats` bài nào chặn người ta -> sửa chính bài đó
   *
   * Con số thứ hai là thứ tổng-số-ở-mức-khoá không bao giờ nói ra được: tiến độ
   * trung bình 40% có thể là ai cũng học đều tới giữa, mà cũng có thể là phần lớn
   * đứng lại ở đúng một bài.
   */
  async listLearners(courseId: string, mentorId: string) {
    await this.requireCourse(courseId, mentorId, 'read');

    const enrollments = await this.repo.enrollmentsOf(courseId);
    const [summary, byLesson, lessons] = await Promise.all([
      this.repo.progressSummary(enrollments.map((e) => e.enrollmentId)),
      this.repo.completionByLesson(courseId),
      this.repo.lessonsInReadingOrder(courseId),
    ]);

    const totalLessons = lessons.length;

    return {
      totalLessons,
      totalLearners: enrollments.length,
      learners: enrollments.map((enrollment) => {
        const progress = summary.get(enrollment.enrollmentId) ?? {
          completed: 0,
          lastActivityAt: null,
        };

        return {
          enrollmentId: enrollment.enrollmentId,
          userId: enrollment.mentee.user.userId,
          username: enrollment.mentee.user.username,
          avatarUrl: enrollment.mentee.user.avatarUrl,
          skillLevel: enrollment.mentee.skillLevel,
          status: enrollment.status,
          enrolledAt: enrollment.enrolledAt,
          completedAt: enrollment.completedAt,
          completedLessons: progress.completed,
          totalLessons,
          percentComplete:
            totalLessons === 0
              ? 0
              : Math.round((progress.completed / totalLessons) * 100),
          lastActivityAt: progress.lastActivityAt,
        };
      }),
      lessonStats: lessons.map((lesson) => ({
        lessonId: lesson.lessonId,
        title: lesson.title,
        chapterTitle: lesson.chapter.title,
        chapterOrder: lesson.chapter.orderIndex,
        orderIndex: lesson.orderIndex,
        completedCount: byLesson.get(lesson.lessonId) ?? 0,
      })),
    };
  }

  // -------------------------------------------------------------------------
  // Chương
  // -------------------------------------------------------------------------

  async createChapter(
    courseId: string,
    dto: CreateChapterDto,
    mentorId: string,
  ) {
    await this.requireCourse(courseId, mentorId, 'content');
    await this.repo.createChapter(courseId, dto);
    return this.repo.findCourseTree(courseId);
  }

  async updateChapter(
    chapterId: string,
    dto: UpdateChapterDto,
    mentorId: string,
  ) {
    const chapter = await this.requireChapter(chapterId, mentorId);
    await this.repo.updateChapter(chapterId, dto);
    return this.repo.findCourseTree(chapter.courseId);
  }

  async deleteChapter(chapterId: string, mentorId: string) {
    const chapter = await this.requireChapter(chapterId, mentorId);
    this.assertNoLearnerProgress(
      await this.repo.progressCountForChapter(chapterId),
      'chương này',
    );
    await this.repo.deleteChapter(chapterId);
    // Xoá chương giữa chừng để lại lỗ thủng trong `orderIndex`. Đánh lại ngay để
    // giao diện không hiện "Chương 1, Chương 3".
    await this.repo.reorder(
      'chapters',
      'course_id',
      chapter.courseId,
      await this.repo.chapterIdsOf(chapter.courseId),
    );
    return this.repo.findCourseTree(chapter.courseId);
  }

  async reorderChapters(courseId: string, dto: ReorderDto, mentorId: string) {
    await this.requireCourse(courseId, mentorId, 'content');

    const actual = await this.repo.chapterIdsOf(courseId);
    this.assertSameSet(actual, dto.orderedIds, 'chương');

    await this.repo.reorder('chapters', 'course_id', courseId, dto.orderedIds);
    return this.repo.findCourseTree(courseId);
  }

  // -------------------------------------------------------------------------
  // Bài học
  // -------------------------------------------------------------------------

  async createLesson(
    chapterId: string,
    dto: CreateLessonDto,
    mentorId: string,
  ) {
    const chapter = await this.requireChapter(chapterId, mentorId);
    await this.repo.createLesson(chapterId, dto);
    return this.repo.findCourseTree(chapter.courseId);
  }

  async updateLesson(lessonId: string, dto: UpdateLessonDto, mentorId: string) {
    const lesson = await this.requireLesson(lessonId, mentorId);
    await this.repo.updateLesson(lessonId, dto);
    return this.repo.findCourseTree(lesson.chapter.courseId);
  }

  async deleteLesson(lessonId: string, mentorId: string) {
    const lesson = await this.requireLesson(lessonId, mentorId);
    this.assertNoLearnerProgress(
      await this.repo.progressCountForLesson(lessonId),
      'bài học này',
    );
    await this.repo.deleteLesson(lessonId);
    await this.repo.reorder(
      'lessons',
      'chapter_id',
      lesson.chapterId,
      await this.repo.lessonIdsOf(lesson.chapterId),
    );
    return this.repo.findCourseTree(lesson.chapter.courseId);
  }

  async reorderLessons(chapterId: string, dto: ReorderDto, mentorId: string) {
    const chapter = await this.requireChapter(chapterId, mentorId);

    const actual = await this.repo.lessonIdsOf(chapterId);
    this.assertSameSet(actual, dto.orderedIds, 'bài');

    await this.repo.reorder('lessons', 'chapter_id', chapterId, dto.orderedIds);
    return this.repo.findCourseTree(chapter.courseId);
  }

  // -------------------------------------------------------------------------
  // Nội dung
  // -------------------------------------------------------------------------

  async getLessonContent(lessonId: string, mentorId: string) {
    const lesson = await this.repo.findLessonContent(lessonId);

    if (!lesson || lesson.chapter.course.mentorId !== mentorId) {
      throw new NotFoundException({ message: 'Không tìm thấy bài học' });
    }

    return lesson;
  }

  async replaceContent(
    lessonId: string,
    dto: ReplaceLessonContentDto,
    mentorId: string,
  ) {
    await this.requireLesson(lessonId, mentorId);

    // Đúng một đáp án đúng cho mỗi câu. `class-validator` kiểm được số lựa chọn
    // nhưng không kiểm được quan hệ giữa chúng, và một câu hỏi không có đáp án
    // đúng sẽ chấm mọi bài làm thành sai — trông như lỗi của học viên.
    for (const [index, question] of dto.quiz.entries()) {
      const correct = question.options.filter((o) => o.isCorrect).length;

      if (correct !== 1) {
        throw new BadRequestException({
          code: ErrorCode.QUIZ_ANSWER_INVALID,
          message: `Câu ${index + 1} phải có đúng 1 đáp án đúng (đang có ${correct})`,
        });
      }
    }

    await this.repo.replaceContent(lessonId, dto);
    return this.getLessonContent(lessonId, mentorId);
  }

  /**
   * Danh sách gửi lên phải trùng KHỚP HOÀN TOÀN với thực tế.
   *
   * Thiếu một phần tử nghĩa là client đang nhìn một bản cũ — có người vừa thêm
   * hoặc xoá ở tab khác. Ghi đè theo danh sách thiếu sẽ để lại phần tử không được
   * đánh số, và `orderIndex` của nó nằm lại vùng âm sau bước dọn chỗ.
   */
  private assertSameSet(actual: string[], given: string[], noun: string): void {
    const same =
      actual.length === given.length &&
      new Set([...actual, ...given]).size === actual.length;

    if (!same) {
      throw new ConflictException({
        code: ErrorCode.REORDER_STALE,
        message: `Danh sách ${noun} không khớp với thực tế. Tải lại trang rồi sắp lại.`,
      });
    }
  }
}
