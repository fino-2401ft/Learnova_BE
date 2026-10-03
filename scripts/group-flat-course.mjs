import { mkdirSync, readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

/**
 * Gom một thư mục bài học PHẲNG thành cấu trúc chương mà content/AUTHORING.md yêu cầu.
 *
 *   node scripts/group-flat-course.mjs <thư-mục-nguồn> <thư-mục-đích> <file-map.json>
 *
 * VÌ SAO CẦN: `normalize-course.mjs` đọc chương theo THƯ MỤC CON của khoá học. Kho tài
 * liệu viết tay thường để tất cả bài ngang hàng trong một thư mục, và khi đó
 * normalize không thấy chương nào cả. Script này là bước đứng trước nó.
 *
 * Nó còn xử lý một chuyện tinh vi hơn: nhiều kho tài liệu điền `module:` trong
 * frontmatter bằng chính TIÊU ĐỀ BÀI HỌC. Giữ nguyên giá trị đó thì mỗi bài thành một
 * chương riêng, và đề cương khoá học hiện ra một danh sách chương mà chương nào cũng
 * chỉ có đúng một bài — trông như lỗi dữ liệu. Nên `module:` được GHI LẠI theo tên
 * chương trong map.
 *
 * CHỈ ĐỌC thư mục nguồn, không bao giờ sửa nó.
 *
 * Định dạng file map:
 *
 *   {
 *     "<tên-thư-mục-khoá-nguồn>": {
 *       "modules": [
 *         { "title": "Tên chương", "lessons": ["ten-file-khong-duoi", ...] }
 *       ]
 *     }
 *   }
 *
 * Tên bài trong map khớp theo CHUỖI CON của tên file, để khỏi phải chép nguyên
 * `lesson-3-2-components-props.md` — viết `components-props` là đủ.
 */

function slugify(text) {
  return text
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'D')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

const pad = (n) => String(n).padStart(2, '0');

/**
 * Ghi lại giá trị `module:` trong frontmatter.
 *
 * Thay bằng regex trên đúng một dòng chứ không parse rồi dựng lại cả khối YAML: mọi
 * key khác — kể cả những key script này chưa từng nghe tên — phải đi qua nguyên vẹn.
 * Dựng lại khối là cách chắc chắn để đánh rơi một key nào đó.
 */
function setModule(raw, moduleTitle) {
  const fm = raw.match(/^---\r?\n([\s\S]*?)\r?\n---/);

  if (!fm) return null;

  const body = fm[1];
  const replaced = /^module:\s*.*$/m.test(body)
    ? body.replace(/^module:\s*.*$/m, `module: ${moduleTitle}`)
    : `${body}\nmodule: ${moduleTitle}`;

  return raw.replace(fm[1], replaced);
}

const [srcRoot, destRoot, mapPath] = process.argv.slice(2);

if (!srcRoot || !destRoot || !mapPath) {
  console.error(
    'Dùng: node scripts/group-flat-course.mjs <nguồn> <đích> <map.json>',
  );
  process.exit(1);
}

const map = JSON.parse(readFileSync(mapPath, 'utf8'));

let totalCourses = 0;
let totalLessons = 0;
const problems = [];

for (const [courseDir, spec] of Object.entries(map)) {
  // JSON không có cú pháp chú thích, nên quy ước: key mở đầu bằng `_` là ghi chú của
  // người viết map, không phải một khoá học.
  if (courseDir.startsWith('_')) continue;

  const srcCourse = join(srcRoot, courseDir);

  let files;
  try {
    files = readdirSync(srcCourse).filter((f) => f.endsWith('.md'));
  } catch {
    problems.push(`${courseDir}: không đọc được thư mục nguồn`);
    continue;
  }

  const used = new Set();

  for (const [moduleIndex, mod] of spec.modules.entries()) {
    const moduleDir = join(
      destRoot,
      courseDir,
      `module-${pad(moduleIndex + 1)}-${slugify(mod.title)}`,
    );
    mkdirSync(moduleDir, { recursive: true });

    for (const [lessonIndex, needle] of mod.lessons.entries()) {
      const match = files.find((f) => f.includes(needle));

      if (!match) {
        problems.push(`${courseDir}: không tìm thấy bài khớp "${needle}"`);
        continue;
      }
      if (used.has(match)) {
        problems.push(`${courseDir}: "${match}" bị xếp vào hai chương`);
        continue;
      }
      used.add(match);

      const raw = readFileSync(join(srcCourse, match), 'utf8');
      const rewritten = setModule(raw, mod.title);

      if (!rewritten) {
        problems.push(`${courseDir}/${match}: không có frontmatter`);
        continue;
      }

      writeFileSync(
        join(moduleDir, `lesson-${pad(lessonIndex + 1)}-${slugify(needle)}.md`),
        rewritten,
        'utf8',
      );
      totalLessons += 1;
    }
  }

  // Bài nào trong nguồn không được map nhắc tới thì phải nói ra, không lặng lẽ bỏ.
  // Đây là cách duy nhất phát hiện map viết thiếu một bài.
  const ignored = files.filter(
    (f) =>
      !used.has(f) && f !== 'final-test.md' && f !== 'resources-and-videos.md',
  );
  for (const f of ignored) {
    problems.push(`${courseDir}: "${f}" KHÔNG nằm trong map, đã bỏ qua`);
  }

  totalCourses += 1;
}

console.log(`Đã gom ${totalCourses} khoá, ${totalLessons} bài → ${destRoot}`);

if (problems.length > 0) {
  console.log(`\n${problems.length} vấn đề:`);
  for (const p of problems) console.log('  -', p);
  process.exit(1);
}
