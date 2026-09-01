import { LessonSectionKind } from '@prisma/client';
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { basename, join } from 'node:path';

/**
 * Đọc kho tài liệu giảng dạy dạng Markdown và bóc thành cấu trúc.
 *
 * File này KHÔNG chạm tới database. Nó chỉ nhận đường dẫn thư mục và trả về dữ
 * liệu thuần, nhờ vậy chạy thử được mà không cần Postgres, và mọi lỗi phân tích
 * lộ ra trước khi có bất kỳ lệnh ghi nào.
 *
 * Hình dạng tài liệu mà file này trông đợi:
 *
 *   <khoá>/<module-0N-ten>/lesson-0N-ten.md
 *
 * Mỗi file mở đầu bằng frontmatter YAML rồi tới thân Markdown chia mục bằng
 * heading. Phần thân dùng đúng một khung: Learning Objectives → Definition →
 * Syntax → Example… → Notes → Real World Example → Common Mistakes → Summary →
 * Quiz. Không bài nào bắt buộc có đủ, nhưng thứ tự thì luôn như vậy.
 */

// ---------------------------------------------------------------------------
// Kiểu dữ liệu
// ---------------------------------------------------------------------------

export interface ParsedQuizOption {
  label: string;
  contentMd: string;
  isCorrect: boolean;
}

export interface ParsedQuizQuestion {
  promptMd: string;
  options: ParsedQuizOption[];
  /** Vì sao đáp án đó đúng. Chỉ hiện sau khi học viên đã nộp bài. */
  explanationMd: string | null;
}

export interface ParsedSection {
  kind: LessonSectionKind;
  /** Tiêu đề gốc, ví dụ "Example 3 - Find Unique". */
  heading: string | null;
  contentMd: string;
}

export interface ParsedLesson {
  /**
   * Khoá định danh bài học, dùng để sinh UUID tất định.
   *
   * Là ĐƯỜNG DẪN TƯƠNG ĐỐI của file, không phải trường `id` trong frontmatter.
   * Lẽ ra `id` mới là lựa chọn tự nhiên — nó ổn định cả khi đổi tên file — nhưng
   * kho tài liệu có ít nhất một cặp bài dùng trùng `id` (chép file rồi quên sửa),
   * và hai bài cùng UUID thì bài sau ghi đè bài trước, âm thầm mất nội dung.
   * Đường dẫn file thì hệ thống tệp bảo đảm không bao giờ trùng.
   */
  key: string;
  /** Trường `id` trong frontmatter. Chỉ để đối chiếu và cảnh báo khi trùng. */
  declaredKey: string;
  title: string;
  /** Số thứ tự khai trong frontmatter. CHƯA chuẩn hoá — xem `orderIndex`. */
  declaredOrder: number;
  /** Số thứ tự thật sự ghi vào database: 1…N, liên tục, không trùng. */
  orderIndex: number;
  durationMinutes: number;
  difficulty: string;
  sections: ParsedSection[];
  quiz: ParsedQuizQuestion[];
  sourcePath: string;
}

export interface ParsedChapter {
  key: string;
  title: string;
  orderIndex: number;
  lessons: ParsedLesson[];
}

export interface ParsedCourse {
  /** Tên thư mục, dùng làm khoá ổn định. */
  key: string;
  /** Trường `course` trong frontmatter. */
  title: string;
  chapters: ParsedChapter[];
}

/** Những chỗ tài liệu không khớp khuôn. Gom lại để báo một lượt thay vì ném lỗi
 *  ngay — người chạy cần thấy toàn bộ danh sách, không phải sửa từng cái một. */
export interface ParseWarning {
  file: string;
  message: string;
}

// ---------------------------------------------------------------------------
// Frontmatter
// ---------------------------------------------------------------------------

/**
 * Bóc frontmatter YAML.
 *
 * Cố tình KHÔNG kéo thư viện YAML về: frontmatter ở đây chỉ có cặp `khoá: giá trị`
 * phẳng, không lồng nhau, không mảng. Một biểu thức chính quy mười dòng đọc được
 * hết, và thêm phụ thuộc chỉ để làm việc này thì không đáng.
 */
function parseFrontmatter(raw: string): { data: Record<string, string>; body: string } {
  const match = raw.match(/^---\r?\n([\s\S]*?)\r?\n---/);

  if (!match) return { data: {}, body: raw };

  const data: Record<string, string> = {};

  for (const line of match[1].split(/\r?\n/)) {
    const pair = line.match(/^(\w+):\s*(.*)$/);
    if (pair) data[pair[1]] = pair[2].trim();
  }

  return { data, body: raw.slice(match[0].length) };
}

// ---------------------------------------------------------------------------
// Cắt mục
// ---------------------------------------------------------------------------

/** Emoji trang trí trong heading ("## 📝 Quiz"). Phải gỡ trước khi so khớp tên mục. */
const DECORATION = /[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}\u{FE0F}\u{2B00}-\u{2BFF}]/gu;

function normalizeHeading(text: string): string {
  return text.replace(DECORATION, '').replace(/\s+/g, ' ').trim();
}

/**
 * Heading nào mở ra một mục mới.
 *
 * Thứ tự trong mảng không quyết định thứ tự mục — thứ tự thật lấy theo vị trí
 * heading trong file. Mảng này chỉ để nhận diện.
 */
const SECTION_PATTERNS: Array<[LessonSectionKind, RegExp]> = [
  [LessonSectionKind.OBJECTIVES, /^Learning Objectives$/i],
  [LessonSectionKind.DEFINITION, /^Definition$/i],
  [LessonSectionKind.SYNTAX, /^Syntax$/i],
  [LessonSectionKind.EXAMPLE, /^Example\b/i],
  [LessonSectionKind.NOTES, /^Notes$/i],
  [LessonSectionKind.REAL_WORLD, /^Real World Example$/i],
  [LessonSectionKind.MISTAKES, /^Common Mistakes$/i],
  [LessonSectionKind.SUMMARY, /^Summary$/i],
];

const QUIZ_HEADING = /^Quiz$/i;

interface Boundary {
  kind: LessonSectionKind | 'QUIZ';
  heading: string;
  line: number;
}

/**
 * Tìm mọi heading mở mục, BỎ QUA heading nằm trong khối code.
 *
 * Việc bỏ qua khối code là bắt buộc chứ không phải cho chắc: tài liệu đầy đoạn
 * shell có dòng `# Install dependencies`, mà xét về cú pháp Markdown thì đó cũng
 * là heading cấp 1.
 */
function findBoundaries(lines: string[]): Boundary[] {
  const boundaries: Boundary[] = [];
  let insideFence = false;

  lines.forEach((line, index) => {
    if (/^\s*```/.test(line)) {
      insideFence = !insideFence;
      return;
    }

    if (insideFence) return;

    const heading = line.match(/^(#{1,3})\s+(.+)$/);
    if (!heading) return;

    const text = normalizeHeading(heading[2]);

    if (QUIZ_HEADING.test(text)) {
      boundaries.push({ kind: 'QUIZ', heading: text, line: index });
      return;
    }

    const match = SECTION_PATTERNS.find(([, pattern]) => pattern.test(text));
    if (match) boundaries.push({ kind: match[0], heading: text, line: index });
  });

  return boundaries;
}

function splitBody(body: string): { sections: ParsedSection[]; quizMd: string | null } {
  const lines = body.split(/\r?\n/);
  const boundaries = findBoundaries(lines);

  const sections: ParsedSection[] = [];
  let quizMd: string | null = null;

  boundaries.forEach((boundary, index) => {
    const end = boundaries[index + 1]?.line ?? lines.length;
    const content = lines.slice(boundary.line + 1, end).join('\n').trim();

    if (boundary.kind === 'QUIZ') {
      quizMd = content;
      return;
    }

    // Heading rỗng thường là tiêu đề nhóm, ví dụ "Syntax" đứng ngay trước
    // "Example 1". Bỏ đi: một mục không có nội dung thì hiển thị ra cũng trống.
    if (!content) return;

    sections.push({ kind: boundary.kind, heading: boundary.heading, contentMd: content });
  });

  return { sections, quizMd };
}

// ---------------------------------------------------------------------------
// Quiz
// ---------------------------------------------------------------------------

/**
 * Bóc phần Quiz thành câu hỏi có cấu trúc.
 *
 * Tài liệu dùng hai biến thể cú pháp, phải đọc được cả hai:
 *
 *   Đáp án:  `A.` rồi nội dung ở dòng dưới   |  `A. nội dung` cùng một dòng
 *   Kết quả: `**Answer: B**`                 |  `Answer: **B**`
 */
function parseQuiz(quizMd: string | null, warn: (message: string) => void): ParsedQuizQuestion[] {
  if (!quizMd) return [];

  const blocks = quizMd.split(/^#{2,4}\s+Question\s+\d+\s*$/im).slice(1);
  const questions: ParsedQuizQuestion[] = [];

  blocks.forEach((block, index) => {
    const answer =
      block.match(/\*\*Answer:\s*([A-D])\s*\*\*/i) ?? block.match(/Answer:\s*\*\*\s*([A-D])\s*\*\*/i);

    if (!answer) {
      warn(`Câu hỏi ${index + 1}: không tìm thấy dòng đáp án đúng`);
      return;
    }

    const labels = [...block.matchAll(/^([A-D])\.[ \t]*(.*)$/gm)];

    if (labels.length !== 4) {
      warn(`Câu hỏi ${index + 1}: tìm thấy ${labels.length} lựa chọn, cần đúng 4`);
      return;
    }

    const correct = answer[1].toUpperCase();

    const options = labels.map((label, position) => {
      const inline = label[2].trim();
      const from = label.index! + label[0].length;
      const to = labels[position + 1]?.index ?? answer.index!;

      const below = block
        .slice(from, to)
        // Nội dung trong khối code là bản thân đáp án, không phải code cần chạy —
        // giữ nguyên hàng rào ``` sẽ khiến mỗi lựa chọn hiện thành một khối to đùng.
        .replace(/```[a-z]*\n?/g, '')
        .replace(/^---$/gm, '')
        .trim();

      return {
        label: label[1],
        contentMd: inline || below,
        isCorrect: label[1] === correct,
      };
    });

    // Giải thích là tuỳ chọn: tài liệu cũ không có, tài liệu mới thì nên có. Nằm
    // sau dòng đáp án và chạy tới hết khối câu hỏi.
    const explanation = block
      .slice(answer.index! + answer[0].length)
      .replace(/^\s*---\s*$/gm, '')
      .replace(/^\*\*Giải thích:\*\*/im, '')
      .trim();

    const promptMd = block.slice(0, labels[0].index!).trim();

    if (!promptMd) {
      warn(`Câu hỏi ${index + 1}: đề bài trống`);
      return;
    }

    const blank = options.filter((option) => !option.contentMd);
    if (blank.length > 0) {
      warn(`Câu hỏi ${index + 1}: lựa chọn ${blank.map((o) => o.label).join(', ')} không có nội dung`);
      return;
    }

    questions.push({ promptMd, options, explanationMd: explanation || null });
  });

  return questions;
}

// ---------------------------------------------------------------------------
// Duyệt thư mục
// ---------------------------------------------------------------------------

/** Rút số thứ tự từ tên thư mục `module-03-database-integration` → 3. */
function orderFromDirectoryName(name: string, fallback: number): number {
  const match = name.match(/(\d+)/);
  return match ? Number(match[1]) : fallback;
}

/**
 * Đọc một thư mục khoá học.
 *
 * @param courseDir Đường dẫn tuyệt đối tới thư mục khoá.
 * @param warnings  Mảng nhận cảnh báo. Hàm này không tự ném lỗi vì tài liệu chưa
 *                  chuẩn là chuyện thường; nơi gọi quyết định coi đó là lỗi hay không.
 *
 * @param keyOverride Khoá định danh của khoá học. Mặc định lấy theo tên thư mục, nhưng
 *                  mọi UUID đều băm từ khoá này — nên để nguyên tên thư mục làm khoá
 *                  thì đổi tên thư mục sẽ viết lại ID của toàn bộ khoá học, kéo theo
 *                  cả tiến độ học của học viên. Truyền khoá tường minh để hai thứ đó
 *                  độc lập với nhau.
 */
export function readCourse(
  courseDir: string,
  warnings: ParseWarning[],
  keyOverride?: string,
): ParsedCourse {
  const courseKey = keyOverride ?? basename(courseDir);

  const moduleDirs = readdirSync(courseDir)
    .filter((entry) => statSync(join(courseDir, entry)).isDirectory())
    .sort();

  const chapters: ParsedChapter[] = [];
  let courseTitle: string | null = null;

  /** `id` trong frontmatter -> file đầu tiên khai nó. Dùng để phát hiện trùng. */
  const declaredKeys = new Map<string, string>();

  moduleDirs.forEach((moduleName, moduleIndex) => {
    const moduleDir = join(courseDir, moduleName);
    const files = readdirSync(moduleDir)
      .filter((entry) => entry.endsWith('.md'))
      .sort();

    const lessons: ParsedLesson[] = [];
    let chapterTitle: string | null = null;

    for (const file of files) {
      const path = join(moduleDir, file);
      const relative = `${courseKey}/${moduleName}/${file}`;
      const raw = readFileSync(path, 'utf8');

      if (!raw.trim()) {
        warnings.push({ file: relative, message: 'file rỗng, bỏ qua' });
        continue;
      }

      const { data, body } = parseFrontmatter(raw);

      if (!data.id || !data.title) {
        warnings.push({ file: relative, message: 'frontmatter thiếu `id` hoặc `title`, bỏ qua' });
        continue;
      }

      // Không làm đổ lệnh import — khoá định danh lấy theo đường dẫn nên trùng `id`
      // không gây hại. Nhưng vẫn phải báo, vì đó là dấu hiệu file bị chép mà quên sửa.
      const firstSeen = declaredKeys.get(data.id);

      if (firstSeen) {
        warnings.push({
          file: relative,
          message: `id "${data.id}" trùng với ${firstSeen} — nên sửa lại trong tài liệu`,
        });
      } else {
        declaredKeys.set(data.id, relative);
      }

      courseTitle ??= data.course ?? null;
      chapterTitle ??= data.module ?? null;

      const { sections, quizMd } = splitBody(body);
      const quiz = parseQuiz(quizMd, (message) => warnings.push({ file: relative, message }));

      if (sections.length === 0) {
        warnings.push({ file: relative, message: 'không cắt được mục nội dung nào' });
      }

      lessons.push({
        key: relative,
        declaredKey: data.id,
        title: data.title,
        declaredOrder: Number(data.order) || 0,
        orderIndex: 0, // gán lại ngay bên dưới
        durationMinutes: Number(data.estimatedTime) || 0,
        difficulty: data.difficulty ?? 'Beginner',
        sections,
        quiz,
        sourcePath: relative,
      });
    }

    if (lessons.length === 0) return;

    // Đánh lại số thứ tự thành 1…N liên tục.
    //
    // Không dùng thẳng `order` của frontmatter được: có module khai [1, 2, 2] và có
    // module khai [2, 3]. Cột `orderIndex` nằm dưới ràng buộc
    // @@unique([chapterId, orderIndex]) nên số trùng làm cả lệnh import đổ với
    // P2002, còn số nhảy cóc thì hiện ra giao diện thành bài "2, 3" mà không có bài 1.
    //
    // Sắp theo `order` trước, hoà thì theo tên file — tên file có sẵn tiền tố số nên
    // vẫn giữ đúng ý đồ của người viết tài liệu.
    lessons
      .sort((a, b) => a.declaredOrder - b.declaredOrder || a.sourcePath.localeCompare(b.sourcePath))
      .forEach((lesson, index) => {
        lesson.orderIndex = index + 1;

        if (lesson.declaredOrder !== lesson.orderIndex) {
          warnings.push({
            file: lesson.sourcePath,
            message: `order ${lesson.declaredOrder} -> ${lesson.orderIndex} (đánh lại cho liên tục)`,
          });
        }
      });

    chapters.push({
      key: moduleName,
      title: chapterTitle ?? moduleName,
      orderIndex: orderFromDirectoryName(moduleName, moduleIndex + 1),
      lessons,
    });
  });

  // Số thứ tự chương cũng phải liên tục, vì lý do y hệt như với bài học.
  chapters
    .sort((a, b) => a.orderIndex - b.orderIndex || a.key.localeCompare(b.key))
    .forEach((chapter, index) => {
      chapter.orderIndex = index + 1;
    });

  return { key: courseKey, title: courseTitle ?? courseKey, chapters };
}
