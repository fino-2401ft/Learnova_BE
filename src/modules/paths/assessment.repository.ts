import { Injectable } from '@nestjs/common';
import { AssessmentStatus, Prisma } from '@prisma/client';

import { PrismaService } from '@/database/prisma/prisma.service';

/** Một câu trong ngân hàng đề, kèm kỹ năng nó chấm cho. */
export interface BankQuestion {
  questionId: string;
  skillId: string;
}

const ASSESSMENT_SELECT = {
  assessmentId: true,
  status: true,
  startedAt: true,
  submittedAt: true,
  learningPath: { select: { slug: true, title: true, learningPathId: true } },
  questions: {
    orderBy: { orderIndex: 'asc' },
    select: {
      questionId: true,
      orderIndex: true,
      selectedOptionId: true,
      skill: { select: { skillId: true, name: true } },
      question: {
        select: {
          promptMd: true,
          options: {
            orderBy: { label: 'asc' },
            // `isCorrect` KHÔNG nằm ở đây, có chủ ý: nó không được rời khỏi server
            // trước khi nộp bài, và cách chắc chắn nhất là không đọc nó lên.
            select: { optionId: true, label: true, contentMd: true },
          },
        },
      },
    },
  },
} satisfies Prisma.PathAssessmentSelect;

export type AssessmentRow = Prisma.PathAssessmentGetPayload<{
  select: typeof ASSESSMENT_SELECT;
}>;

@Injectable()
export class AssessmentRepository {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Ngân hàng đề của một lộ trình: mọi câu quiz thuộc các chương có gắn kỹ năng, và
   * các khoá đó phải nằm trong lộ trình.
   *
   * Đi bằng SQL thô thay vì bốn tầng `include` lồng nhau: quan hệ ở đây là
   * Path → Course → Chapter → SkillChapter → Lesson → Question, và diễn đạt bằng
   * Prisma sẽ kéo về cả cây rồi mới lọc ở JavaScript. Câu SQL này trả đúng hai cột
   * cần dùng.
   */
  bankFor(learningPathId: string): Promise<BankQuestion[]> {
    return this.prisma.$queryRaw<BankQuestion[]>`
      SELECT q.question_id AS "questionId", sc.skill_id AS "skillId"
      FROM learning_path_courses lpc
      JOIN chapters ch       ON ch.course_id = lpc.course_id
      JOIN skill_chapters sc ON sc.chapter_id = ch.chapter_id
      JOIN lessons l         ON l.chapter_id = ch.chapter_id
      JOIN quiz_questions q  ON q.lesson_id = l.lesson_id
      WHERE lpc.learning_path_id = ${learningPathId}::uuid
    `;
  }

  /** Bài đang làm dở của một người trong một lộ trình, nếu có. */
  findInProgress(
    userId: string,
    learningPathId: string,
  ): Promise<AssessmentRow | null> {
    return this.prisma.pathAssessment.findFirst({
      where: {
        userId,
        learningPathId,
        status: AssessmentStatus.IN_PROGRESS,
      },
      select: ASSESSMENT_SELECT,
      orderBy: { startedAt: 'desc' },
    });
  }

  findById(assessmentId: string): Promise<AssessmentRow | null> {
    return this.prisma.pathAssessment.findUnique({
      where: { assessmentId },
      select: ASSESSMENT_SELECT,
    });
  }

  /** Chủ sở hữu và trạng thái — đủ để kiểm tra quyền mà không kéo cả bộ đề. */
  findOwner(assessmentId: string) {
    return this.prisma.pathAssessment.findUnique({
      where: { assessmentId },
      select: {
        assessmentId: true,
        userId: true,
        status: true,
        learningPathId: true,
      },
    });
  }

  /**
   * Tạo bài mới cùng toàn bộ đề trong MỘT transaction.
   *
   * Tách làm hai lệnh nghĩa là một lỗi giữa chừng để lại một bài kiểm tra không có câu
   * hỏi nào — và `findInProgress` sẽ trả về nó mãi mãi, chặn người dùng bắt đầu lại.
   */
  create(data: {
    userId: string;
    learningPathId: string;
    questions: BankQuestion[];
  }) {
    return this.prisma.$transaction(async (tx) => {
      const assessment = await tx.pathAssessment.create({
        data: { userId: data.userId, learningPathId: data.learningPathId },
        select: { assessmentId: true },
      });

      await tx.assessmentQuestion.createMany({
        data: data.questions.map((q, index) => ({
          assessmentId: assessment.assessmentId,
          questionId: q.questionId,
          skillId: q.skillId,
          orderIndex: index + 1,
        })),
      });

      return assessment.assessmentId;
    });
  }

  /** Đáp án đúng của một tập câu hỏi. Chỉ gọi khi CHẤM, không bao giờ khi phát đề. */
  async correctOptions(questionIds: string[]): Promise<Map<string, string>> {
    if (questionIds.length === 0) return new Map();

    const rows = await this.prisma.quizOption.findMany({
      where: { questionId: { in: questionIds }, isCorrect: true },
      select: { questionId: true, optionId: true },
    });

    return new Map(rows.map((row) => [row.questionId, row.optionId]));
  }

  /** Ghi câu trả lời, điểm kỹ năng và đánh dấu đã nộp — một transaction. */
  submit(data: {
    assessmentId: string;
    answers: {
      questionId: string;
      optionId: string | null;
      isCorrect: boolean;
    }[];
    scores: { skillId: string; correct: number; total: number }[];
  }) {
    return this.prisma.$transaction(async (tx) => {
      for (const answer of data.answers) {
        await tx.assessmentQuestion.update({
          where: {
            assessmentId_questionId: {
              assessmentId: data.assessmentId,
              questionId: answer.questionId,
            },
          },
          data: {
            selectedOptionId: answer.optionId,
            isCorrect: answer.isCorrect,
          },
        });
      }

      // Xoá rồi ghi lại: nộp lại cùng một bài không được phép cộng dồn điểm.
      await tx.assessmentSkillScore.deleteMany({
        where: { assessmentId: data.assessmentId },
      });

      await tx.assessmentSkillScore.createMany({
        data: data.scores.map((s) => ({
          assessmentId: data.assessmentId,
          ...s,
        })),
      });

      await tx.pathAssessment.update({
        where: { assessmentId: data.assessmentId },
        data: {
          status: AssessmentStatus.SUBMITTED,
          submittedAt: new Date(),
        },
      });
    });
  }

  /**
   * Điểm kỹ năng của lần nộp GẦN NHẤT trong một lộ trình.
   *
   * Gần nhất chứ không phải cao nhất: người học đi lên thì lần sau đúng hơn, còn nếu
   * kết quả tệ hơn thì đó cũng là bức tranh mới nhất về họ. Lấy điểm cao nhất trong
   * mọi lần làm sẽ khoá cứng một khoảnh khắc may mắn.
   */
  async latestScores(userId: string, learningPathId: string) {
    const latest = await this.prisma.pathAssessment.findFirst({
      where: {
        userId,
        learningPathId,
        status: AssessmentStatus.SUBMITTED,
      },
      orderBy: { submittedAt: 'desc' },
      select: {
        assessmentId: true,
        submittedAt: true,
        skillScores: {
          select: {
            correct: true,
            total: true,
            skill: {
              select: { skillId: true, code: true, name: true, domain: true },
            },
          },
        },
      },
    });

    return latest;
  }

  /** Chương nào thuộc kỹ năng nào, cho các khoá của một lộ trình. */
  chaptersWithSkills(learningPathId: string) {
    return this.prisma.chapter.findMany({
      where: {
        course: { learningPaths: { some: { learningPathId } } },
      },
      select: {
        chapterId: true,
        courseId: true,
        title: true,
        orderIndex: true,
        skills: { select: { skillId: true } },
        lessons: { select: { durationMinutes: true } },
      },
      orderBy: { orderIndex: 'asc' },
    });
  }
}
