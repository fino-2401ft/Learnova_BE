import { Injectable, NotFoundException } from '@nestjs/common';
import { CourseStatus } from '@prisma/client';

import { AuthenticatedUser } from '@/common/types/authenticated-user.type';
import {
  LearningPathDetailDto,
  LearningPathSummaryDto,
  PathCourseDto,
} from './dto/path.dto';
import { AssessmentService } from './assessment.service';
import { EnrollmentRow, PathRow, PathsRepository } from './paths.repository';

/** Một bước của lộ trình sau khi đã lọc bỏ khoá chưa xuất bản. */
type Step = PathRow['courses'][number];

@Injectable()
export class PathsService {
  constructor(
    private readonly repo: PathsRepository,
    private readonly assessments: AssessmentService,
  ) {}

  async list(viewer: AuthenticatedUser): Promise<LearningPathSummaryDto[]> {
    const rows = await this.repo.listAll();

    // Một truy vấn ghi danh cho TẤT CẢ lộ trình, không phải mỗi lộ trình một lần:
    // trang chọn lộ trình vẽ vài thẻ cùng lúc, và mỗi thẻ hỏi riêng là mỗi thẻ một
    // vòng đi về database.
    const courseIds = rows.flatMap((row) =>
      this.publishedSteps(row).map((step) => step.course.courseId),
    );
    const enrollments = await this.repo.enrollmentsFor(
      viewer.userId,
      courseIds,
    );

    return rows.map((row) => this.toSummary(row, enrollments));
  }

  async detail(
    slug: string,
    viewer: AuthenticatedUser,
  ): Promise<LearningPathDetailDto> {
    const row = await this.repo.findBySlug(slug);

    if (!row)
      throw new NotFoundException({ message: 'Learning path not found' });

    const steps = this.publishedSteps(row);
    const enrollments = await this.repo.enrollmentsFor(
      viewer.userId,
      steps.map((step) => step.course.courseId),
    );

    // Cá nhân hoá đọc từ lần nộp bài GẦN NHẤT. Chưa làm bài thì tập rỗng, và mọi
    // chương hiện ra đầy đủ — mặc định là học hết, không phải bỏ hết.
    const personal = await this.assessments.personalise(
      viewer.userId,
      row.learningPathId,
    );

    return {
      ...this.toSummary(row, enrollments),
      courses: steps.map((step) =>
        this.toCourse(step, enrollments, personal.skippedChapterIds),
      ),
      personalisation: {
        assessedAt: personal.submittedAt,
        skippedChapters: personal.skippedChapterIds.size,
        totalChapters: personal.totalChapters,
        savedMinutes: personal.savedMinutes,
      },
    };
  }

  /**
   * Bỏ khoá chưa xuất bản khỏi lộ trình.
   *
   * Bảng nối không tự dọn khi một khoá bị gỡ xuất bản, nên lọc phải nằm ở đây. Thứ tự
   * `orderIndex` giữ nguyên số cũ chứ KHÔNG đánh lại: người học đã thấy "bước 5" ở
   * lần trước, và đổi nó thành "bước 4" chỉ vì một khoá khác tạm ẩn sẽ làm mọi ghi
   * chú, mọi ảnh chụp màn hình họ có trở nên sai.
   */
  private publishedSteps(row: PathRow): Step[] {
    return row.courses.filter(
      (step) => step.course.status === CourseStatus.PUBLISHED,
    );
  }

  private toSummary(
    row: PathRow,
    enrollments: Map<string, EnrollmentRow>,
  ): LearningPathSummaryDto {
    const steps = this.publishedSteps(row);
    const lessons = steps.flatMap((step) =>
      step.course.chapters.flatMap((chapter) => chapter.lessons),
    );

    return {
      learningPathId: row.learningPathId,
      slug: row.slug,
      title: row.title,
      description: row.description,
      icon: row.icon,
      courseCount: steps.length,
      lessonCount: lessons.length,
      estimatedMinutes: lessons.reduce((sum, l) => sum + l.durationMinutes, 0),
      enrolledCount: steps.filter((step) =>
        enrollments.has(step.course.courseId),
      ).length,
    };
  }

  private toCourse(
    step: Step,
    enrollments: Map<string, EnrollmentRow>,
    skipped: Set<string>,
  ): PathCourseDto {
    const course = step.course;
    const lessons = course.chapters.flatMap((chapter) => chapter.lessons);
    const enrollment = enrollments.get(course.courseId);

    const chapters = course.chapters.map((chapter) => ({
      chapterId: chapter.chapterId,
      title: chapter.title,
      orderIndex: chapter.orderIndex,
      lessonCount: chapter.lessons.length,
      estimatedMinutes: chapter.lessons.reduce(
        (sum, l) => sum + l.durationMinutes,
        0,
      ),
      skipped: skipped.has(chapter.chapterId),
    }));

    return {
      chapters,
      skippedChapters: chapters.filter((c) => c.skipped).length,
      courseId: course.courseId,
      orderIndex: step.orderIndex,
      title: course.title,
      description: course.description,
      coverImageUrl: course.coverImageUrl,
      level: course.level,
      chapterCount: course.chapters.length,
      lessonCount: lessons.length,
      estimatedMinutes: lessons.reduce((sum, l) => sum + l.durationMinutes, 0),
      enrollment: enrollment
        ? {
            status: enrollment.status,
            // Tính từ số bài đã hoàn thành trên tổng số bài của khoá, không đọc một
            // cột phần trăm có sẵn: cột đó chỉ đúng nếu mọi lệnh ghi tiến độ đều nhớ
            // cập nhật nó, còn phép chia này thì luôn đúng.
            percentComplete:
              lessons.length === 0
                ? 0
                : Math.round(
                    (enrollment.progress.filter((p) => p.isCompleted).length /
                      lessons.length) *
                      100,
                  ),
          }
        : null,
    };
  }
}
