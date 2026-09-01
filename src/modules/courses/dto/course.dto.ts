import {
  CourseLevel,
  EnrollmentStatus,
  LessonSectionKind,
} from '@prisma/client';

// Author shown on a course card.
export interface CourseAuthorDto {
  userId: string;
  username: string;
  avatarUrl?: string | null;
}

export interface PaginatedDto<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
  /** Saves every client from recomputing `Math.ceil(total / limit)`. */
  totalPages: number;
}

export interface CourseSummaryDto {
  courseId: string;
  title: string;
  description: string | null;
  coverImageUrl: string | null;
  level: CourseLevel;
  publishedAt: Date | null;
  /**
   * Vị trí trong lộ trình "NodeJS Backend Developer", hoặc null nếu khoá nằm ngoài
   * lộ trình. Chỉ là một cột để client xếp thứ tự — luật cá nhân hoá lộ trình
   * chưa được xây.
   */
  pathOrder: number | null;
  mentor: CourseAuthorDto;
  chapterCount: number;
  lessonCount: number;
  totalMinutes: number;
  enrollmentCount: number;
}

export interface LessonOutlineDto {
  lessonId: string;
  title: string;
  description: string | null;
  durationMinutes: number;
  orderIndex: number;
  quizCount: number;
  documentCount: number;
}

export interface ChapterOutlineDto {
  chapterId: string;
  title: string;
  description: string | null;
  orderIndex: number;
  lessons: LessonOutlineDto[];
}

export interface CourseDetailDto extends CourseSummaryDto {
  chapters: ChapterOutlineDto[];
  /**
   * The caller's own enrollment, or null when signed out or not enrolled.
   *
   * Present on the course page so the client can decide between "Enroll" and
   * "Continue" without a second round trip.
   */
  enrollment: {
    enrollmentId: string;
    status: EnrollmentStatus;
    completedLessons: number;
  } | null;
}

export interface LessonSectionDto {
  sectionId: string;
  kind: LessonSectionKind;
  heading: string | null;
  contentMd: string;
  orderIndex: number;
}

/**
 * A quiz question as the learner receives it.
 *
 * There is no `isCorrect` field anywhere in this shape, and the repository does not
 * select the column. Grading happens on the server.
 */
export interface QuizQuestionDto {
  questionId: string;
  promptMd: string;
  orderIndex: number;
  options: { optionId: string; label: string; contentMd: string }[];
}

export interface LessonDocumentDto {
  documentId: string;
  fileName: string;
  fileUrl: string;
  fileType: string;
  fileSize: number;
}

export interface LessonDetailDto {
  lessonId: string;
  title: string;
  description: string | null;
  videoUrl: string | null;
  durationMinutes: number;
  orderIndex: number;
  course: { courseId: string; title: string };
  chapter: { chapterId: string; title: string; orderIndex: number };
  sections: LessonSectionDto[];
  quiz: QuizQuestionDto[];
  documents: LessonDocumentDto[];
  /** Reading-order neighbours, null at the two ends of the course. */
  previousLessonId: string | null;
  nextLessonId: string | null;
  progress: { isCompleted: boolean; lastPositionSeconds: number } | null;
}

export interface EnrollmentSummaryDto {
  enrollmentId: string;
  status: EnrollmentStatus;
  enrolledAt: Date;
  completedAt: Date | null;
  completedLessons: number;
  totalLessons: number;
  /** 0-100, rounded. Stored nowhere — derived on read so it cannot drift. */
  percentComplete: number;
  course: {
    courseId: string;
    title: string;
    coverImageUrl: string | null;
    level: CourseLevel;
    mentor: { userId: string; username: string };
  };
}

export interface LessonProgressDto {
  lessonId: string;
  isCompleted: boolean;
  lastPositionSeconds: number;
  completedAt: Date | null;
  updatedAt: Date;
}

export interface EnrollmentDetailDto {
  enrollmentId: string;
  status: EnrollmentStatus;
  enrolledAt: Date;
  completedAt: Date | null;
  completedLessons: number;
  totalLessons: number;
  percentComplete: number;
  lessons: LessonProgressDto[];
}

export function percentOf(completed: number, total: number): number {
  return total === 0 ? 0 : Math.round((completed / total) * 100);
}
