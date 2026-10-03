import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { AssessmentStatus } from '@prisma/client';

import { ErrorCode } from '@/common/constants/error-codes';
import { AuthenticatedUser } from '@/common/types/authenticated-user.type';
import {
  QUESTIONS_PER_SKILL,
  hasMastered,
  pickRandom,
} from './assessment.policy';
import {
  AssessmentRepository,
  AssessmentRow,
  BankQuestion,
} from './assessment.repository';
import { PathsRepository } from './paths.repository';
import {
  AssessmentDto,
  AssessmentResultDto,
  SkillScoreDto,
  SubmitAssessmentDto,
} from './dto/assessment.dto';

/** Kết quả cá nhân hoá: chương nào bỏ được, tiết kiệm bao nhiêu phút. */
export interface Personalisation {
  /** `chapterId` của những chương người học đã chứng minh là nắm vững. */
  skippedChapterIds: Set<string>;
  savedMinutes: number;
  totalChapters: number;
  submittedAt: Date | null;
}

@Injectable()
export class AssessmentService {
  constructor(
    private readonly repo: AssessmentRepository,
    private readonly paths: PathsRepository,
  ) {}

  /**
   * Bắt đầu bài kiểm tra, hoặc trả lại bài đang làm dở.
   *
   * Trả lại bài dở chứ không tạo bài mới: người dùng đóng tab rồi quay lại phải thấy
   * đúng bộ đề và những câu đã trả lời. Tạo mới mỗi lần bấm sẽ để lại một dãy bài
   * IN_PROGRESS chết trong database, và người dùng không bao giờ làm xong được câu nào.
   */
  async start(slug: string, viewer: AuthenticatedUser): Promise<AssessmentDto> {
    const path = await this.paths.findBySlug(slug);

    if (!path)
      throw new NotFoundException({ message: 'Learning path not found' });

    const existing = await this.repo.findInProgress(
      viewer.userId,
      path.learningPathId,
    );

    if (existing) return this.toDto(existing);

    const bank = await this.repo.bankFor(path.learningPathId);

    if (bank.length === 0) {
      throw new BadRequestException({
        code: ErrorCode.ASSESSMENT_NO_QUESTIONS,
        message: 'Lộ trình này chưa có ngân hàng câu hỏi để kiểm tra đầu vào',
      });
    }

    const assessmentId = await this.repo.create({
      userId: viewer.userId,
      learningPathId: path.learningPathId,
      questions: this.buildPaper(bank),
    });

    const created = await this.repo.findById(assessmentId);

    if (!created) {
      throw new NotFoundException({ message: 'Assessment not found' });
    }

    return this.toDto(created);
  }

  /**
   * Bốc đề: mỗi kỹ năng `QUESTIONS_PER_SKILL` câu, xếp xen kẽ các kỹ năng.
   *
   * Xen kẽ chứ không gom theo kỹ năng: ba câu liên tiếp cùng chủ đề khiến người làm
   * bài đoán được đang đo cái gì và trả lời theo quán tính, và một chuỗi câu khó liền
   * nhau cũng dễ làm họ bỏ dở hơn là khi độ khó rải đều.
   *
   * Kỹ năng có ít hơn ba câu trong ngân hàng vẫn được đưa vào với số câu nó có —
   * loại bỏ nó nghĩa là mọi chương của kỹ năng đó không bao giờ bỏ qua được.
   */
  private buildPaper(bank: BankQuestion[]): BankQuestion[] {
    const bySkill = new Map<string, BankQuestion[]>();

    for (const q of bank) {
      const list = bySkill.get(q.skillId) ?? [];
      list.push(q);
      bySkill.set(q.skillId, list);
    }

    const perSkill = [...bySkill.values()].map((questions) =>
      pickRandom(questions, QUESTIONS_PER_SKILL),
    );

    // Vòng tròn: lấy câu thứ 1 của mọi kỹ năng, rồi câu thứ 2, rồi câu thứ 3.
    const paper: BankQuestion[] = [];
    const longest = Math.max(...perSkill.map((list) => list.length), 0);

    for (let round = 0; round < longest; round += 1) {
      for (const list of perSkill) {
        if (list[round]) paper.push(list[round]);
      }
    }

    return paper;
  }

  /** Bài đang làm dở, để tải lại trang không mất bộ đề. */
  async current(
    assessmentId: string,
    viewer: AuthenticatedUser,
  ): Promise<AssessmentDto> {
    const row = await this.requireOwned(assessmentId, viewer);

    return this.toDto(row);
  }

  /**
   * Nộp bài và chấm điểm.
   *
   * Chấm ở server, đọc `isCorrect` từ database — client chỉ gửi lên optionId đã chọn.
   * Đây là lý do `isCorrect` không bao giờ nằm trong DTO phát đề: nếu nó từng đi
   * xuống client thì mọi điểm số về sau đều vô nghĩa.
   */
  async submit(
    assessmentId: string,
    dto: SubmitAssessmentDto,
    viewer: AuthenticatedUser,
  ): Promise<AssessmentResultDto> {
    const row = await this.requireOwned(assessmentId, viewer);

    if (row.status === AssessmentStatus.SUBMITTED) {
      throw new BadRequestException({
        code: ErrorCode.ASSESSMENT_ALREADY_SUBMITTED,
        message: 'Bài kiểm tra này đã nộp rồi',
      });
    }

    const questionIds = row.questions.map((q) => q.questionId);
    const correctByQuestion = await this.repo.correctOptions(questionIds);
    const chosen = new Map(dto.answers.map((a) => [a.questionId, a.optionId]));

    const answers = row.questions.map((q) => {
      const optionId = chosen.get(q.questionId) ?? null;

      return {
        questionId: q.questionId,
        optionId,
        // Bỏ trống tính là SAI. Không có nhánh "chưa trả lời" ở bước chấm: người học
        // không trả lời được nghĩa là chưa nắm, và bỏ qua chương vì họ bỏ trống câu
        // hỏi là kết cục tệ nhất mà bài kiểm tra này có thể gây ra.
        isCorrect:
          optionId !== null && correctByQuestion.get(q.questionId) === optionId,
      };
    });

    // Cộng điểm theo kỹ năng đã CHỐT lúc phát đề, không tra lại từ chương.
    const tally = new Map<string, { correct: number; total: number }>();

    for (const [index, answer] of answers.entries()) {
      const skillId = row.questions[index].skill.skillId;
      const current = tally.get(skillId) ?? { correct: 0, total: 0 };

      current.total += 1;
      if (answer.isCorrect) current.correct += 1;
      tally.set(skillId, current);
    }

    const scores = [...tally.entries()].map(([skillId, t]) => ({
      skillId,
      correct: t.correct,
      total: t.total,
    }));

    await this.repo.submit({ assessmentId, answers, scores });

    return this.result(assessmentId, viewer);
  }

  /** Kết quả của một bài đã nộp. */
  async result(
    assessmentId: string,
    viewer: AuthenticatedUser,
  ): Promise<AssessmentResultDto> {
    const owner = await this.repo.findOwner(assessmentId);

    if (!owner)
      throw new NotFoundException({ message: 'Assessment not found' });
    if (owner.userId !== viewer.userId) {
      throw new ForbiddenException({
        code: ErrorCode.FORBIDDEN,
        message: 'Đây không phải bài kiểm tra của bạn',
      });
    }

    const latest = await this.repo.latestScores(
      viewer.userId,
      owner.learningPathId,
    );

    if (!latest) {
      throw new BadRequestException({
        code: ErrorCode.ASSESSMENT_NOT_SUBMITTED,
        message: 'Bài kiểm tra chưa được nộp',
      });
    }

    const path = await this.paths.findById(owner.learningPathId);
    const personalisation = await this.personalise(
      viewer.userId,
      owner.learningPathId,
    );

    const skillScores: SkillScoreDto[] = latest.skillScores
      .map((s) => ({
        skillCode: s.skill.code,
        skillName: s.skill.name,
        domain: s.skill.domain,
        correct: s.correct,
        total: s.total,
        percent: s.total === 0 ? 0 : Math.round((s.correct / s.total) * 100),
        mastered: hasMastered(s.correct, s.total),
      }))
      // Yếu nhất lên đầu: đó là thứ người học cần nhìn trước, và cũng là phần lộ
      // trình sẽ giữ lại cho họ.
      .sort((a, b) => a.percent - b.percent);

    return {
      assessmentId: latest.assessmentId,
      learningPathSlug: path?.slug ?? '',
      submittedAt: latest.submittedAt!,
      correct: skillScores.reduce((sum, s) => sum + s.correct, 0),
      total: skillScores.reduce((sum, s) => sum + s.total, 0),
      skillScores,
      skippedChapters: personalisation.skippedChapterIds.size,
      totalChapters: personalisation.totalChapters,
      savedMinutes: personalisation.savedMinutes,
    };
  }

  /**
   * Chương nào được bỏ qua, dựa trên lần nộp gần nhất.
   *
   * Một chương chỉ bỏ được khi MỌI kỹ năng gắn với nó đều đạt ngưỡng. Hầu hết chương
   * chỉ có một kỹ năng, nhưng chương nào có hai thì "biết một nửa" không đủ để bỏ.
   *
   * Chương không gắn kỹ năng nào KHÔNG bao giờ bị bỏ: không có bằng chứng thì mặc
   * định là phải học. Seed đã chặn trường hợp này (chương mồ côi làm seed đổ), nhưng
   * dữ liệu thật có thể lệch khỏi seed.
   */
  async personalise(
    userId: string,
    learningPathId: string,
  ): Promise<Personalisation> {
    const chapters = await this.repo.chaptersWithSkills(learningPathId);
    const latest = await this.repo.latestScores(userId, learningPathId);

    const empty: Personalisation = {
      skippedChapterIds: new Set(),
      savedMinutes: 0,
      totalChapters: chapters.length,
      submittedAt: null,
    };

    if (!latest) return empty;

    const mastered = new Set(
      latest.skillScores
        .filter((s) => hasMastered(s.correct, s.total))
        .map((s) => s.skill.skillId),
    );

    const skippedChapterIds = new Set<string>();
    let savedMinutes = 0;

    for (const chapter of chapters) {
      if (chapter.skills.length === 0) continue;

      const allMastered = chapter.skills.every((s) => mastered.has(s.skillId));

      if (!allMastered) continue;

      skippedChapterIds.add(chapter.chapterId);
      savedMinutes += chapter.lessons.reduce(
        (sum, l) => sum + l.durationMinutes,
        0,
      );
    }

    return {
      skippedChapterIds,
      savedMinutes,
      totalChapters: chapters.length,
      submittedAt: latest.submittedAt,
    };
  }

  private async requireOwned(
    assessmentId: string,
    viewer: AuthenticatedUser,
  ): Promise<AssessmentRow> {
    const row = await this.repo.findById(assessmentId);

    if (!row) throw new NotFoundException({ message: 'Assessment not found' });

    const owner = await this.repo.findOwner(assessmentId);

    if (owner?.userId !== viewer.userId) {
      throw new ForbiddenException({
        code: ErrorCode.FORBIDDEN,
        message: 'Đây không phải bài kiểm tra của bạn',
      });
    }

    return row;
  }

  private toDto(row: AssessmentRow): AssessmentDto {
    return {
      assessmentId: row.assessmentId,
      learningPathSlug: row.learningPath.slug,
      learningPathTitle: row.learningPath.title,
      status: row.status,
      startedAt: row.startedAt,
      questions: row.questions.map((q) => ({
        questionId: q.questionId,
        orderIndex: q.orderIndex,
        promptMd: q.question.promptMd,
        skillName: q.skill.name,
        options: q.question.options,
        selectedOptionId: q.selectedOptionId,
      })),
    };
  }
}
