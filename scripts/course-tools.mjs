import { existsSync, mkdirSync, readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { basename, dirname, join } from 'node:path';

/**
 * Công cụ soạn nội dung khoá học.
 *
 *   scaffold <file-đề-cương>   Sinh khung .md cho cả khoá từ một bản đề cương
 *   split <file-nháp>          Cắt một file chứa nhiều bài thành từng file riêng
 *
 * Mục đích: bỏ hẳn phần việc tay chân dễ sai — gõ frontmatter, đặt tên thư mục,
 * đánh số thứ tự — để chỉ còn phải viết nội dung.
 *
 * Không dùng thư viện ngoài nào.
 */

// ---------------------------------------------------------------------------
// Định dạng file đề cương
// ---------------------------------------------------------------------------
//
//   course: TypeScript
//   dir: course-02-typescript
//   slug: ts
//
//   module: Type System | module-01-type-system
//     Primitive Types | 25 | Beginner
//     Union & Intersection | 30 | Beginner
//
//   module: Advanced TypeScript | module-03-advanced
//     Generic | 35 | Intermediate
//
// Dòng bài học: <tiêu đề> | <số phút> | <độ khó>
// Phút và độ khó có thể bỏ, mặc định 30 và Beginner.

function parseOutline(text) {
  const meta = {};
  const modules = [];
  let current = null;

  for (const raw of text.split(/\r?\n/)) {
    const line = raw.trimEnd();

    if (!line.trim() || line.trim().startsWith('#')) continue;

    const header = line.match(/^(course|dir|slug):\s*(.+)$/);
    if (header) {
      meta[header[1]] = header[2].trim();
      continue;
    }

    const mod = line.match(/^module:\s*(.+)$/);
    if (mod) {
      const [title, dir] = mod[1].split('|').map((s) => s.trim());
      current = { title, dir: dir ?? slugify(title), lessons: [] };
      modules.push(current);
      continue;
    }

    // Dòng thụt lề = một bài học của module đang mở.
    if (/^\s+\S/.test(raw)) {
      if (!current) throw new Error(`Bài học "${line.trim()}" không thuộc module nào`);

      const [title, minutes, difficulty] = line.split('|').map((s) => s.trim());

      current.lessons.push({
        title,
        minutes: Number(minutes) || 30,
        difficulty: difficulty || 'Beginner',
      });
    }
  }

  for (const key of ['course', 'dir', 'slug']) {
    if (!meta[key]) throw new Error(`Đề cương thiếu dòng "${key}:"`);
  }

  return { ...meta, modules };
}

/** Bỏ dấu tiếng Việt rồi chuyển sang dạng kebab-case dùng làm tên file. */
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

// ---------------------------------------------------------------------------
// scaffold
// ---------------------------------------------------------------------------

/**
 * Khung một bài học.
 *
 * Frontmatter điền sẵn đầy đủ; phần thân có sẵn mọi tiêu đề mục theo đúng tên
 * mà parser nhận diện. Người soạn chỉ việc thay các dòng TODO.
 */
function lessonTemplate({ slug, course, module, title, order, moduleIndex, minutes, difficulty }) {
  return `---
id: ${slug}-m${moduleIndex}-l${order}
course: ${course}
module: ${module}
title: ${title}
order: ${order}
difficulty: ${difficulty}
estimatedTime: ${minutes}
---

# ${title}

## 🎯 Learning Objectives

Sau bài học này, bạn có thể:

- TODO
- TODO
- TODO
- TODO

---

## 📖 Definition

TODO: 2-3 đoạn. Giải thích VÌ SAO thứ này tồn tại, không chỉ nói nó là gì.

---

## ⚙️ Syntax

\`\`\`typescript
// TODO: cú pháp tối giản
\`\`\`

### Example 1 - TODO

\`\`\`typescript
// TODO
\`\`\`

TODO: giải thích ngắn.

### Example 2 - TODO

\`\`\`typescript
// TODO
\`\`\`

### Example 3 - TODO

\`\`\`typescript
// TODO
\`\`\`

---

## 📌 Notes

- TODO
- TODO
- TODO
- TODO

---

## 🌍 Real World Example

TODO: code như trong dự án thật.

\`\`\`typescript
// TODO
\`\`\`

TODO: giải thích vì sao viết như vậy.

---

## ⚠️ Common Mistakes

**Sai 1 — TODO**

\`\`\`typescript
// SAI
// ĐÚNG
\`\`\`

**Sai 2 — TODO**

**Sai 3 — TODO**

**Sai 4 — TODO**

---

## 📋 Summary

- TODO
- TODO
- TODO
- TODO

---

## 📝 Quiz

### Question 1

TODO: câu hỏi kiểm tra sự HIỂU, không kiểm tra trí nhớ.

A. TODO

B. TODO

C. TODO

D. TODO

**Answer: B**

**Giải thích:** TODO: vì sao đúng, và vì sao phương án hấp dẫn nhất lại sai.

---

### Question 2

TODO

A. TODO

B. TODO

C. TODO

D. TODO

**Answer: C**

**Giải thích:** TODO
`;
}

function scaffold(outlinePath) {
  const outline = parseOutline(readFileSync(outlinePath, 'utf8'));
  const courseDir = join('content', 'courses', outline.dir);

  let created = 0;
  let skipped = 0;

  outline.modules.forEach((module, moduleIndex) => {
    const moduleDir = join(courseDir, module.dir);
    mkdirSync(moduleDir, { recursive: true });

    module.lessons.forEach((lesson, lessonIndex) => {
      const order = lessonIndex + 1;
      const file = join(
        moduleDir,
        `lesson-${String(order).padStart(2, '0')}-${slugify(lesson.title)}.md`,
      );

      // Không bao giờ ghi đè: chạy lại chỉ bổ sung bài mới, giữ nguyên bài đã viết.
      if (existsSync(file)) {
        skipped += 1;
        return;
      }

      writeFileSync(
        file,
        lessonTemplate({
          slug: outline.slug,
          course: outline.course,
          module: module.title,
          title: lesson.title,
          order,
          moduleIndex: moduleIndex + 1,
          minutes: lesson.minutes,
          difficulty: lesson.difficulty,
        }),
        'utf8',
      );

      created += 1;
      console.log(`  + ${file}`);
    });
  });

  console.log(`\nĐã tạo ${created} khung bài học, bỏ qua ${skipped} file đã tồn tại.`);
  console.log(`Thư mục: ${courseDir}`);
}

// ---------------------------------------------------------------------------
// split
// ---------------------------------------------------------------------------

/**
 * Cắt một file nháp chứa nhiều bài học thành từng file riêng.
 *
 * Đây là thứ biến "dán 93 lần" thành "dán 22 lần": bảo mô hình sinh cả module
 * trong một lượt, ngăn cách bằng dòng đánh dấu, rồi chạy lệnh này.
 *
 * Định dạng file nháp:
 *
 *   === FILE: course-02-typescript/module-01-type-system/lesson-01-x.md ===
 *   ---
 *   id: ...
 *   ---
 *   # ...
 *
 *   === FILE: course-02-typescript/module-01-type-system/lesson-02-y.md ===
 *   ...
 */
const FILE_MARKER = /^===\s*FILE:\s*(.+?)\s*===$/;

function split(draftPath) {
  const lines = readFileSync(draftPath, 'utf8').split(/\r?\n/);

  const files = [];
  let current = null;

  for (const line of lines) {
    const marker = line.match(FILE_MARKER);

    if (marker) {
      current = { path: marker[1], body: [] };
      files.push(current);
      continue;
    }

    if (current) current.body.push(line);
  }

  if (files.length === 0) {
    console.error('Không tìm thấy dòng đánh dấu nào.');
    console.error('Mỗi bài phải mở đầu bằng:  === FILE: <đường-dẫn-tương-đối> ===');
    process.exit(1);
  }

  for (const file of files) {
    const target = join('content', 'courses', file.path);
    mkdirSync(dirname(target), { recursive: true });

    // Bỏ dòng trống thừa ở hai đầu, giữ đúng một dòng xuống cuối file.
    const content = `${file.body.join('\n').trim()}\n`;

    writeFileSync(target, content, 'utf8');
    console.log(`  → ${target}  (${content.length} ký tự)`);
  }

  console.log(`\nĐã ghi ${files.length} file. Kiểm tra bằng:  npm run course:check -- <thư-mục-khoá>`);
}

// ---------------------------------------------------------------------------

const [command, arg] = process.argv.slice(2);

if (command === 'scaffold' && arg) {
  scaffold(arg);
} else if (command === 'split' && arg) {
  split(arg);
} else {
  console.log(`Cách dùng:

  npm run course:scaffold -- content/outlines/typescript.txt
      Sinh khung .md cho cả khoá từ bản đề cương. Không ghi đè file đã có.

  npm run course:split -- drafts/module-01.txt
      Cắt một file chứa nhiều bài thành từng file riêng, theo dòng
      "=== FILE: <đường-dẫn> ===".

  npm run course:check -- content/courses/course-02-typescript
      Kiểm tra định dạng bằng chính parser của importer.`);
  process.exit(arg ? 1 : 0);
}
