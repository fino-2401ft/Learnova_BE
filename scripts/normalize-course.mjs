import { mkdirSync, readFileSync, readdirSync, statSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

/**
 * Chuyển một thư mục tài liệu cũ sang đúng khuôn mô tả trong content/AUTHORING.md.
 *
 *   node scripts/normalize-course.mjs <thư-mục-nguồn> <tên-thư-mục-đích> <slug> [--dry]
 *
 * Công cụ này CHỈ ĐỌC thư mục nguồn, không bao giờ sửa nó. Kết quả ghi sang
 * content/courses/<tên-thư-mục-đích>/.
 *
 * SỬA ĐƯỢC (cấu trúc):
 *   - Tên thư mục chương  -> module-0N-<slug>
 *   - Tên file bài học    -> lesson-0N-<slug>.md
 *   - Thiếu key course/module trong frontmatter -> điền từ file cùng khoá / tên thư mục
 *   - id trùng nhau       -> sinh lại theo <slug>-m<N>-l<N>, bảo đảm duy nhất
 *   - order trùng hoặc nhảy cóc -> đánh lại 1…N liên tục
 *   - "Answer: **X**"     -> "**Answer: X**"
 *   - Tiêu đề mục ở cấp H1 -> H2 (một file chỉ nên có một H1)
 *   - File rỗng           -> bỏ qua kèm báo cáo
 *
 * KHÔNG SỬA ĐƯỢC (nội dung — cần người viết):
 *   - Thiếu "**Giải thích:**" sau đáp án
 *   - Thiếu hẳn một mục như Syntax hay Real World Example
 *   - Nội dung sai hoặc lỗi thời
 *
 * Chạy xong luôn chạy tiếp `npm run course:check` để biết còn thiếu gì.
 */

// ---------------------------------------------------------------------------
// Tiện ích
// ---------------------------------------------------------------------------

function slugify(text) {
  return text
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'D')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

/**
 * Suy tên chương từ tên thư mục khi frontmatter thiếu key `module`.
 *
 *   "Module2_ Control Flow"        -> "Control Flow"
 *   "module-03-database-design"    -> "Database Design"
 */
function moduleTitleFromDir(name) {
  const stripped = name
    .replace(/^module[-_]?\d*[-_]?/i, '')
    .replace(/^\d+[-_]/, '')
    .trim();

  return stripped
    .split(/[-_\s]+/)
    .filter(Boolean)
    .map((w) => (w.length <= 2 ? w : w[0].toUpperCase() + w.slice(1)))
    .join(' ');
}

/**
 * Lấy phần mô tả từ tên file nguồn: "lesson-03-repository-pattern.md" -> "repository-pattern".
 *
 * Dùng tên file chứ KHÔNG dùng `title` trong frontmatter, vì tên file đáng tin hơn.
 * Kho tài liệu có file bị chép từ file khác mà quên sửa `title` — lúc đó `title`
 * sai còn tên file vẫn đúng, và đặt tên đầu ra theo `title` sẽ nhân bản cái sai đó.
 */
function slugFromFileName(file) {
  const stripped = file
    .replace(/\.md$/i, '')
    .replace(/^lesson[-_]?\d*[-_]?/i, '')
    .trim();

  return stripped ? slugify(stripped) : '';
}

function parseFrontmatter(raw) {
  const match = raw.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?/);
  if (!match) return { data: {}, body: raw, had: false };

  const data = {};
  for (const line of match[1].split(/\r?\n/)) {
    const pair = line.match(/^(\w+):\s*(.*)$/);
    if (pair) data[pair[1]] = pair[2].trim();
  }

  return { data, body: raw.slice(match[0].length), had: true };
}

/** Tên mục mà parser của importer nhận diện. Dùng để chuẩn hoá cấp heading. */
const SECTION_NAMES = [
  'Learning Objectives', 'Definition', 'Syntax', 'Notes',
  'Real World Example', 'Common Mistakes', 'Summary', 'Quiz',
];

const DECORATION = /[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}\u{FE0F}\u{2B00}-\u{2BFF}]/gu;

/**
 * Chuẩn hoá phần thân bài.
 *
 * Đi theo từng dòng và theo dõi khối code, vì mọi thao tác dưới đây đều không
 * được đụng tới nội dung bên trong ``` — một dòng "# Install" trong đoạn shell
 * không phải heading, và "Answer:" trong ví dụ code không phải đáp án quiz.
 */
function normalizeBody(body, report) {
  const lines = body.split(/\r?\n/);
  const out = [];
  let inFence = false;

  for (const line of lines) {
    if (/^\s*```/.test(line)) {
      inFence = !inFence;
      out.push(line);
      continue;
    }

    if (inFence) {
      out.push(line);
      continue;
    }

    // H1 của một mục -> H2. Một file Markdown chỉ nên có đúng một H1 là tiêu đề bài.
    const h1 = line.match(/^#\s+(.+)$/);
    if (h1) {
      const text = h1[1].replace(DECORATION, '').replace(/\s+/g, ' ').trim();

      if (SECTION_NAMES.some((n) => text.toLowerCase() === n.toLowerCase())) {
        out.push(`#${line}`);
        report.headingsFixed += 1;
        continue;
      }
    }

    // "Answer: **C**" -> "**Answer: C**"
    const altAnswer = line.match(/^\s*Answer:\s*\*\*\s*([A-D])\s*\*\*\s*$/i);
    if (altAnswer) {
      out.push(`**Answer: ${altAnswer[1].toUpperCase()}**`);
      report.answersFixed += 1;
      continue;
    }

    out.push(line);
  }

  return out.join('\n');
}

/** Đếm câu hỏi chưa có phần giải thích — thứ công cụ không tự viết được. */
function countMissingExplanations(body) {
  const blocks = body.split(/^#{2,4}\s+Question\s+\d+\s*$/im).slice(1);
  return blocks.filter((b) => !/\*\*Giải thích:\*\*/i.test(b)).length;
}

// ---------------------------------------------------------------------------
// Chuyển đổi
// ---------------------------------------------------------------------------

function normalize(sourceDir, targetName, slug, dryRun) {
  const targetDir = join('content', 'courses', targetName);

  const report = {
    lessons: 0, empty: [], filledCourse: 0, filledModule: 0,
    regeneratedIds: 0, renumbered: 0, headingsFixed: 0, answersFixed: 0,
    missingExplanations: 0, renamedDirs: [], duplicateTitles: [],
  };

  const moduleDirs = readdirSync(sourceDir)
    .filter((e) => statSync(join(sourceDir, e)).isDirectory())
    .sort();

  // Lượt 1: đọc hết để biết tên khoá — 5 file trong kho cũ thiếu key `course`,
  // và cách duy nhất để điền đúng là lấy từ file khác cùng khoá.
  let courseTitle = null;
  for (const dir of moduleDirs) {
    for (const file of readdirSync(join(sourceDir, dir)).filter((f) => f.endsWith('.md'))) {
      const raw = readFileSync(join(sourceDir, dir, file), 'utf8');
      if (!raw.trim()) continue;
      const { data } = parseFrontmatter(raw);
      if (data.course) { courseTitle = data.course; break; }
    }
    if (courseTitle) break;
  }

  if (!courseTitle) {
    console.error(`Không tìm thấy key "course" trong bất kỳ file nào của ${sourceDir}.`);
    process.exit(1);
  }

  // Lượt 2: ghi ra thư mục đích.
  let moduleIndex = 0;

  for (const dir of moduleDirs) {
    const files = readdirSync(join(sourceDir, dir)).filter((f) => f.endsWith('.md')).sort();

    // Đọc trước để bỏ qua module chỉ toàn file rỗng — nếu không sẽ để lại một
    // thư mục trống và một số thứ tự chương bị nhảy.
    const parsed = [];

    for (const file of files) {
      const raw = readFileSync(join(sourceDir, dir, file), 'utf8');

      if (!raw.trim()) {
        report.empty.push(`${dir}/${file}`);
        continue;
      }

      const { data, body } = parseFrontmatter(raw);
      parsed.push({ file, data, body });
    }

    if (parsed.length === 0) continue;

    moduleIndex += 1;

    const moduleTitle = parsed.find((p) => p.data.module)?.data.module ?? moduleTitleFromDir(dir);
    const moduleSlug = `module-${String(moduleIndex).padStart(2, '0')}-${slugify(moduleTitle)}`;

    if (moduleSlug !== dir) report.renamedDirs.push(`${dir} -> ${moduleSlug}`);

    // Sắp theo `order` khai trong file, hoà thì theo tên file — giữ đúng ý đồ
    // của người viết tài liệu, vì tên file có sẵn tiền tố số.
    parsed.sort(
      (a, b) => (Number(a.data.order) || 0) - (Number(b.data.order) || 0) || a.file.localeCompare(b.file),
    );

    if (!dryRun) mkdirSync(join(targetDir, moduleSlug), { recursive: true });

    // Hai bài cùng `title` trong một chương gần như luôn là dấu hiệu file bị chép
    // mà quên sửa frontmatter. Công cụ không tự đoán tiêu đề đúng — nó báo lên và
    // đề xuất tiêu đề suy từ tên file để người viết quyết định.
    const titleCount = new Map();
    for (const lesson of parsed) {
      const t = (lesson.data.title ?? '').trim();
      if (t) titleCount.set(t, (titleCount.get(t) ?? 0) + 1);
    }

    parsed.forEach((lesson, index) => {
      const order = index + 1;
      const title = lesson.data.title ?? lesson.file.replace(/\.md$/, '');

      if (titleCount.get(title.trim()) > 1) {
        const suggested = slugFromFileName(lesson.file)
          .split('-')
          .filter(Boolean)
          .map((w) => w[0].toUpperCase() + w.slice(1))
          .join(' ');

        report.duplicateTitles.push(
          `${dir}/${lesson.file}: title "${title}" trùng trong chương — có thể đúng là "${suggested}"`,
        );
      }

      if (!lesson.data.course) report.filledCourse += 1;
      if (!lesson.data.module) report.filledModule += 1;
      if (Number(lesson.data.order) !== order) report.renumbered += 1;

      // Sinh lại id theo vị trí: bảo đảm duy nhất, xoá hẳn nhóm id trùng.
      const newId = `${slug}-m${moduleIndex}-l${order}`;
      if (lesson.data.id !== newId) report.regeneratedIds += 1;

      const frontmatter = [
        '---',
        `id: ${newId}`,
        `course: ${courseTitle}`,
        `module: ${moduleTitle}`,
        `title: ${title}`,
        `order: ${order}`,
        `difficulty: ${lesson.data.difficulty || 'Beginner'}`,
        `estimatedTime: ${Number(lesson.data.estimatedTime) || 30}`,
        '---',
        '',
      ].join('\n');

      const body = normalizeBody(lesson.body, report);
      report.missingExplanations += countMissingExplanations(body);

      const outFile = join(
        targetDir,
        moduleSlug,
        `lesson-${String(order).padStart(2, '0')}-${slugFromFileName(lesson.file) || slugify(title)}.md`,
      );

      if (!dryRun) writeFileSync(outFile, `${frontmatter}${body.trim()}\n`, 'utf8');

      report.lessons += 1;
      console.log(`  ${dryRun ? '[thử]' : '  +  '} ${outFile}`);
    });
  }

  return { report, targetDir, courseTitle };
}

// ---------------------------------------------------------------------------

const args = process.argv.slice(2);
const dryRun = args.includes('--dry');
const [sourceDir, targetName, slug] = args.filter((a) => !a.startsWith('--'));

if (!sourceDir || !targetName || !slug) {
  console.log(`Cách dùng:

  node scripts/normalize-course.mjs <thư-mục-nguồn> <tên-thư-mục-đích> <slug> [--dry]

Ví dụ:

  node scripts/normalize-course.mjs \\
    "C:/.../FinalProjectDocs/NodeJS_BE/course-06-nestjs" \\
    course-06-nestjs nest --dry

Thư mục nguồn chỉ được ĐỌC, không bao giờ bị sửa.`);
  process.exit(sourceDir ? 1 : 0);
}

const { report, targetDir, courseTitle } = normalize(sourceDir, targetName, slug, dryRun);

console.log(`\n=== "${courseTitle}" -> ${targetDir} ===`);
console.log(`  bài học chuyển được          : ${report.lessons}`);

if (report.renamedDirs.length > 0) {
  console.log(`  thư mục đổi tên              : ${report.renamedDirs.length}`);
  report.renamedDirs.forEach((r) => console.log(`      ${r}`));
}

const fixed = [
  ['điền key "course" còn thiếu ', report.filledCourse],
  ['điền key "module" còn thiếu ', report.filledModule],
  ['sinh lại id                 ', report.regeneratedIds],
  ['đánh lại order              ', report.renumbered],
  ['tiêu đề mục H1 -> H2        ', report.headingsFixed],
  ['sửa dạng dòng đáp án        ', report.answersFixed],
].filter(([, n]) => n > 0);

if (fixed.length > 0) {
  console.log('\n  Đã sửa tự động:');
  fixed.forEach(([label, n]) => console.log(`      ${label}: ${n}`));
}

if (report.empty.length > 0) {
  console.log(`\n  Bỏ qua ${report.empty.length} file rỗng:`);
  report.empty.forEach((f) => console.log(`      ${f}`));
}

if (report.duplicateTitles.length > 0) {
  console.log(`
  CẦN NGƯỜI SỬA: ${report.duplicateTitles.length} bài có tiêu đề trùng nhau`);
  report.duplicateTitles.forEach((d) => console.log(`      ${d}`));
}

if (report.missingExplanations > 0) {
  console.log(`\n  CẦN NGƯỜI VIẾT: ${report.missingExplanations} câu quiz chưa có "**Giải thích:**"`);
  console.log('      Công cụ không tự sinh nội dung được. Xem prompt ở content/AUTHORING.md.');
}

console.log(
  dryRun
    ? '\n(chạy thử — chưa ghi file nào. Bỏ --dry để ghi thật)'
    : `\nXong. Kiểm tra tiếp:  npm run course:check -- ${targetDir.split(/[\\/]/).join('/')}`,
);
