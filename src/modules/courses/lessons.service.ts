import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Role } from '@prisma/client';

import { ErrorCode } from '@/common/constants/error-codes';
import type { AuthenticatedUser } from '@/common/types/authenticated-user.type';
import { CoursesRepository } from './courses.repository';
import { CoursesService } from './courses.service';
import { EnrollmentsRepository } from './enrollments.repository';
import { LessonDetailDto } from './dto/course.dto';
import { SubmitQuizDto } from './dto/enroll.dto';

/**
 * One graded question, returned only after the learner has submitted.
 *
 * `correctOptionId` and `explanationMd` appear here and nowhere else — in particular
 * not in `LessonDetailDto`, which is what the learner receives before answering.
 */
export interface QuizQuestionResultDto {
  questionId: string;
  orderIndex: number;
  selectedOptionId: string | null;
  correctOptionId: string;
  isCorrect: boolean;
  explanationMd: string | null;
}

export interface QuizResultDto {
  lessonId: string;
  correct: number;
  total: number;
  /** 0-100, rounded. */
  score: number;
  questions: QuizQuestionResultDto[];
}

@Injectable()
export class LessonsService {
  constructor(
    private readonly courses: CoursesRepository,
    private readonly coursesService: CoursesService,
    private readonly enrollments: EnrollmentsRepository,
  ) {}

  /**
   * Full lesson content.
   *
   * Two gates, in this order: the course must be visible to the viewer at all, and
   * the viewer must have a reason to read the content. Browsing the outline is open;
   * reading the lessons is not.
   */
  async detail(
    lessonId: string,
    viewer: AuthenticatedUser,
  ): Promise<LessonDetailDto> {
    const lesson = await this.courses.findLesson(lessonId);

    if (!lesson) throw new NotFoundException({ message: 'Lesson not found' });

    const course = lesson.chapter.course;

    this.coursesService.assertVisible(course.status, course.mentorId, viewer);

    const enrollment = await this.requireReadAccess(
      course.courseId,
      course.mentorId,
      viewer,
    );

    // Prev/next need the whole course in reading order — (chapter.orderIndex,
    // lesson.orderIndex) is a composite ordering, so no single WHERE clause finds a
    // neighbour.
    const sequence = await this.courses.lessonSequence(course.courseId);
    const at = sequence.findIndex((item) => item.lessonId === lessonId);

    let progress: LessonDetailDto['progress'] = null;

    if (enrollment) {
      const rows = await this.enrollments.progressForEnrollment(
        enrollment.enrollmentId,
      );
      const row = rows.find((item) => item.lessonId === lessonId);

      progress = row
        ? {
            isCompleted: row.isCompleted,
            lastPositionSeconds: row.lastPositionSeconds,
          }
        : { isCompleted: false, lastPositionSeconds: 0 };
    }

    return {
      lessonId: lesson.lessonId,
      title: lesson.title,
      description: lesson.description,
      videoUrl: lesson.videoUrl,
      durationMinutes: lesson.durationMinutes,
      orderIndex: lesson.orderIndex,
      course: { courseId: course.courseId, title: course.title },
      chapter: {
        chapterId: lesson.chapter.chapterId,
        title: lesson.chapter.title,
        orderIndex: lesson.chapter.orderIndex,
      },
      sections: lesson.sections,
      quiz: lesson.quiz,
      documents: lesson.documents,
      previousLessonId: at > 0 ? sequence[at - 1].lessonId : null,
      nextLessonId:
        at >= 0 && at < sequence.length - 1 ? sequence[at + 1].lessonId : null,
      progress,
    };
  }

  /**
   * Grade a quiz submission.
   *
   * Entirely server-side: the client sends option ids and gets back a verdict. The
   * correct answers are read here, compared here, and only the outcome leaves.
   *
   * Nothing is persisted yet — a submission gives immediate feedback and is then
   * forgotten. Recording attempts needs a `LessonQuizAttempt` table (see
   * content/path.md, phase 7); adding it later does not change this response shape.
   */
  async gradeQuiz(
    lessonId: string,
    dto: SubmitQuizDto,
    viewer: AuthenticatedUser,
  ): Promise<QuizResultDto> {
    const lesson = await this.courses.findLesson(lessonId);

    if (!lesson) throw new NotFoundException({ message: 'Lesson not found' });

    const course = lesson.chapter.course;

    this.coursesService.assertVisible(course.status, course.mentorId, viewer);
    await this.requireReadAccess(course.courseId, course.mentorId, viewer);

    const key = await this.courses.answerKey(lessonId);

    if (key.length === 0) {
      throw new BadRequestException({
        code: ErrorCode.QUIZ_ANSWER_INVALID,
        message: 'This lesson has no quiz',
      });
    }

    const selected = new Map<string, string | undefined>();

    for (const answer of dto.answers) {
      // A repeated questionId means the client built the payload wrong. Silently
      // keeping the last one would grade something the learner never saw as their
      // final choice.
      if (selected.has(answer.questionId)) {
        throw new BadRequestException({
          code: ErrorCode.QUIZ_ANSWER_INVALID,
          message: `Duplicate answer for question ${answer.questionId}`,
        });
      }

      selected.set(answer.questionId, answer.optionId);
    }

    const questions: QuizQuestionResultDto[] = key.map((question) => {
      const correctOption = question.options.find((option) => option.isCorrect);

      // Authored content is validated by scripts/check-course.ts, but a lesson with
      // no correct option would otherwise grade every answer as wrong and look like
      // a learner problem rather than a content bug.
      if (!correctOption) {
        throw new BadRequestException({
          code: ErrorCode.QUIZ_ANSWER_INVALID,
          message: `Question ${question.questionId} has no correct option`,
        });
      }

      const chosen = selected.get(question.questionId) ?? null;

      // An option id from a different question is not a wrong answer, it is a
      // malformed request — and accepting it would let a client probe ids.
      if (
        chosen &&
        !question.options.some((option) => option.optionId === chosen)
      ) {
        throw new BadRequestException({
          code: ErrorCode.QUIZ_ANSWER_INVALID,
          message: `Option ${chosen} does not belong to question ${question.questionId}`,
        });
      }

      return {
        questionId: question.questionId,
        orderIndex: question.orderIndex,
        selectedOptionId: chosen,
        correctOptionId: correctOption.optionId,
        isCorrect: chosen === correctOption.optionId,
        explanationMd: question.explanationMd,
      };
    });

    const answeredIds = new Set(key.map((question) => question.questionId));
    const stray = [...selected.keys()].find((id) => !answeredIds.has(id));

    if (stray) {
      throw new BadRequestException({
        code: ErrorCode.QUIZ_ANSWER_INVALID,
        message: `Question ${stray} does not belong to this lesson`,
      });
    }

    const correct = questions.filter((question) => question.isCorrect).length;

    return {
      lessonId,
      correct,
      total: questions.length,
      score: Math.round((correct / questions.length) * 100),
      questions,
    };
  }

  /**
   * Who may read lesson content.
   *
   * A mentee needs an enrollment. The owning mentor and admins do not — they have to
   * be able to review what they publish. Returns the enrollment when there is one, so
   * the caller can attach progress without a second lookup.
   */
  private async requireReadAccess(
    courseId: string,
    mentorId: string,
    viewer: AuthenticatedUser,
  ): Promise<{ enrollmentId: string } | null> {
    if (viewer.role === Role.ADMIN) return null;
    if (viewer.role === Role.MENTOR && viewer.userId === mentorId) return null;

    const enrollment = await this.enrollments.find(courseId, viewer.userId);

    if (!enrollment) {
      throw new ForbiddenException({
        code: ErrorCode.NOT_ENROLLED,
        message: 'Enroll in this course to read its lessons',
      });
    }

    return { enrollmentId: enrollment.enrollmentId };
  }
}
