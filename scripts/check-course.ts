import { LessonSectionKind } from '@prisma/client';

import { readCourse, type ParseWarning, type ParsedLesson } from '../prisma/import/markdown';

/**
 * Kiểm tra định dạng một thư mục khoá học.
 *
 * Dùng ĐÚNG parser mà importer dùng, nên báo đạt ở đây thì seed cũng đạt. Viết
 * lại một bộ kiểm tra riêng sẽ trôi dạt khỏi parser thật theo thời gian, và khi
 * đó nó nói dối.
 *
 * Không chạm database — chạy được cả khi Postgres đang tắt.
 *
 *   npm run course:check -- content/courses/course-02-typescript
 */

/** Khung chuẩn: bài học đạt yêu cầu nên có đủ những mục này. */
const REQUIRED: LessonSectionKind[] = [
  LessonSectionKind.OBJECTIVES,
  LessonSectionKind.DEFINITION,
  LessonSectionKind.EXAMPLE,
  LessonSectionKind.NOTES,
  LessonSectionKind.MISTAKES,
  LessonSectionKind.SUMMARY,
];

/** Mục có cũng tốt, thiếu cũng được. */
const OPTIONAL: LessonSectionKind[] = [LessonSectionKind.SYNTAX, LessonSectionKind.REAL_WORLD];

interface Problem {
  file: string;
  level: 'LỖI' | 'CẢNH BÁO';
  message: string;
}

function checkLesson(lesson: ParsedLesson, problems: Problem[]): void {
  const add = (level: Problem['level'], message: string) =>
    problems.push({ file: lesson.sourcePath, level, message });

  const kinds = new Set(lesson.sections.map((s) => s.kind));

  for (const kind of REQUIRED) {
    if (!kinds.has(kind)) add('LỖI', `thiếu mục ${kind}`);
  }

  for (const kind of OPTIONAL) {
    if (!kinds.has(kind)) add('CẢNH BÁO', `không có mục ${kind}`);
  }

  if (lesson.quiz.length === 0) add('LỖI', 'không có câu quiz nào');
  else if (lesson.quiz.length < 2) add('CẢNH BÁO', `chỉ có ${lesson.quiz.length} câu quiz, nên có 2`);

  lesson.quiz.forEach((question, index) => {
    const n = index + 1;

    if (question.options.length !== 4) {
      add('LỖI', `câu ${n}: ${question.options.length} lựa chọn, cần đúng 4`);
    }

    const correct = question.options.filter((o) => o.isCorrect).length;
    if (correct !== 1) add('LỖI', `câu ${n}: ${correct} đáp án đúng, cần đúng 1`);

    if (!question.explanationMd) add('CẢNH BÁO', `câu ${n}: không có phần giải thích`);
  });

  // Còn sót TODO nghĩa là khung sinh ra chưa được điền.
  const todo = lesson.sections.filter((s) => s.contentMd.includes('TODO')).length;
  if (todo > 0) add('LỖI', `còn ${todo} mục chứa TODO chưa điền`);

  if (lesson.durationMinutes <= 0) add('CẢNH BÁO', 'estimatedTime bằng 0');

  // Mục quá ngắn thường là dấu hiệu viết cho có.
  for (const section of lesson.sections) {
    if (section.contentMd.length < 80) {
      add('CẢNH BÁO', `mục ${section.kind} chỉ có ${section.contentMd.length} ký tự`);
    }
  }
}

function main(): void {
  const dir = process.argv[2];

  if (!dir) {
    console.error('Cách dùng: npm run course:check -- content/courses/course-0N-slug');
    process.exit(1);
  }

  const warnings: ParseWarning[] = [];
  const course = readCourse(dir, warnings);
  const problems: Problem[] = [];

  const lessons = course.chapters.flatMap((c) => c.lessons);

  if (lessons.length === 0) {
    console.error(`Không đọc được bài học nào trong "${dir}".`);
    warnings.forEach((w) => console.error(`  ${w.file}: ${w.message}`));
    process.exit(1);
  }

  console.log(`Khoá: "${course.title}"  |  ${course.chapters.length} chương  |  ${lessons.length} bài\n`);

  for (const chapter of course.chapters) {
    console.log(`  ${chapter.orderIndex}. ${chapter.title}`);

    for (const lesson of chapter.lessons) {
      const before = problems.length;
      checkLesson(lesson, problems);

      const own = problems.slice(before);
      const errors = own.filter((p) => p.level === 'LỖI').length;
      const mark = errors > 0 ? 'LỖI ' : own.length > 0 ? 'lưu ý' : 'ok   ';

      console.log(
        `     ${mark} ${String(lesson.orderIndex).padStart(2)}. ${lesson.title.padEnd(30)}` +
          ` ${String(lesson.sections.length).padStart(2)} mục  ${lesson.quiz.length} quiz  ${lesson.durationMinutes}p`,
      );
    }
  }

  const errors = problems.filter((p) => p.level === 'LỖI');
  const notes = problems.filter((p) => p.level === 'CẢNH BÁO');

  const show = (list: Problem[], title: string) => {
    if (list.length === 0) return;
    console.log(`\n${title} (${list.length}):`);
    for (const p of list) console.log(`  ${p.file}\n      ${p.message}`);
  };

  show(errors, 'LỖI — phải sửa');
  show(notes, 'CẢNH BÁO — nên xem lại');

  // Cảnh báo từ chính parser: file rỗng, quiz không bóc được, order bị đánh lại.
  if (warnings.length > 0) {
    console.log(`\nGhi chú từ parser (${warnings.length}):`);
    for (const w of warnings) console.log(`  ${w.file}: ${w.message}`);
  }

  const totalSections = lessons.reduce((n, l) => n + l.sections.length, 0);
  const totalQuiz = lessons.reduce((n, l) => n + l.quiz.length, 0);
  const totalMinutes = lessons.reduce((n, l) => n + l.durationMinutes, 0);

  console.log(
    `\nTổng: ${totalSections} mục | ${totalQuiz} câu quiz | ${totalMinutes} phút` +
      `\nKết quả: ${errors.length === 0 ? 'ĐẠT — import được' : `${errors.length} lỗi phải sửa trước khi import`}`,
  );

  process.exit(errors.length === 0 ? 0 : 1);
}

main();
