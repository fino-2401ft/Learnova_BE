import { CourseLevel, EnrollmentStatus } from '@prisma/client';

/** Thẻ lộ trình trên trang chọn lộ trình. */
export interface LearningPathSummaryDto {
  learningPathId: string;
  /** Đi vào URL: /lo-trinh/<slug>. */
  slug: string;
  title: string;
  description: string;
  /** TÊN icon, frontend tra sang component. Không phải URL. */
  icon: string;
  courseCount: number;
  lessonCount: number;
  /** Tổng thời lượng ước tính, tính bằng phút — cộng từ `estimatedMinutes` của mọi
   *  bài trong lộ trình. Frontend đổi sang "khoảng 32 giờ" khi hiển thị. */
  estimatedMinutes: number;
  /** Số khoá trong lộ trình mà người xem đã ghi danh. Cho phép thẻ hiện "đang học
   *  3/7" thay vì trông giống hệt một lộ trình chưa động tới. */
  enrolledCount: number;
}

/** Một chương, kèm việc nó có được bỏ qua sau bài kiểm tra đầu vào hay không. */
export interface PathChapterDto {
  chapterId: string;
  title: string;
  orderIndex: number;
  lessonCount: number;
  estimatedMinutes: number;
  /** `true` khi mọi kỹ năng của chương này đều đạt ngưỡng ở lần kiểm tra gần nhất.
   *  Luôn `false` khi người học chưa làm bài — không có bằng chứng thì phải học. */
  skipped: boolean;
}

/** Một khoá học tại một bước của lộ trình. */
export interface PathCourseDto {
  courseId: string;
  /** Vị trí trong lộ trình, đếm từ 1. */
  orderIndex: number;
  title: string;
  description: string | null;
  coverImageUrl: string | null;
  level: CourseLevel;
  chapterCount: number;
  lessonCount: number;
  estimatedMinutes: number;
  /** `null` khi người xem chưa ghi danh khoá này. */
  enrollment: {
    status: EnrollmentStatus;
    percentComplete: number;
  } | null;
  chapters: PathChapterDto[];
  /** Số chương của khoá này được bỏ qua. Cho phép thẻ khoá hiện "bỏ qua 2/4 chương"
   *  mà không phải tự đếm lại từ mảng `chapters`. */
  skippedChapters: number;
}

/** Trạng thái cá nhân hoá của lộ trình với người đang xem. */
export interface PathPersonalisationDto {
  /** `null` khi chưa làm bài kiểm tra đầu vào lần nào. Giao diện dựa vào đây để hiện
   *  lời mời làm bài, thay vì hiện một lộ trình đã rút gọn mà không giải thích. */
  assessedAt: Date | null;
  skippedChapters: number;
  totalChapters: number;
  /** Số phút học tiết kiệm được nhờ bỏ qua. */
  savedMinutes: number;
}

export interface LearningPathDetailDto extends LearningPathSummaryDto {
  courses: PathCourseDto[];
  personalisation: PathPersonalisationDto;
}
