import { readFileSync, readdirSync, statSync, writeFileSync } from 'node:fs';
import { join, relative, sep } from 'node:path';

/**
 * Bổ sung phần "**Giải thích:**" cho câu hỏi quiz còn thiếu.
 *
 *   node scripts/quiz-explanations.mjs extract <thư-mục-khoá>
 *   node scripts/quiz-explanations.mjs inject  <thư-mục-khoá> <file-json>
 *
 * Tách làm hai bước vì phần giải thích là NỘI DUNG — phải do người viết. Công cụ
 * chỉ lo phần cơ học: tìm câu nào thiếu, và chèn đúng chỗ mà không đụng gì khác
 * trong file.
 *
 * `extract` in ra dạng gọn để đọc; `inject` nhận một file JSON dạng
 *
 *   { "module-01-x/lesson-01-y.md": ["giải thích câu 1", "giải thích câu 2"] }
 *
 * Phần tử rỗng hoặc null nghĩa là bỏ qua câu đó.
 */

const QUESTION_SPLIT = /^#{2,4}\s+Question\s+\d+\s*$/im;
// `[ 	]*` chu khong phai `\s*`: `\s` bao gom ca ky tu xuong dong, va voi co `m`
// thi `\s*$` nuot luon dau dong ke tiep, khien phan chen vao bi thua mot dong trong.
const ANSWER_LINE = /^\*\*Answer:\s*([A-D])[ \t]*\*\*[ \t]*$/im;

function markdownFiles(dir) {
  const out = [];
  (function walk(d) {
    for (const e of readdirSync(d)) {
      const p = join(d, e);
      statSync(p).isDirectory() ? walk(p) : e.endsWith('.md') && out.push(p);
    }
  })(dir);
  return out.sort();
}

/** Cắt phần Quiz thành từng khối câu hỏi, giữ nguyên văn bản gốc. */
function quizBlocks(raw) {
  const quizStart = raw.search(/^#{1,3}\s+.*Quiz\s*$/im);
  if (quizStart === -1) return { head: raw, blocks: [] };

  const head = raw.slice(0, quizStart);
  const quiz = raw.slice(quizStart);

  const markers = [...quiz.matchAll(new RegExp(QUESTION_SPLIT.source, 'gim'))];
  if (markers.length === 0) return { head: raw, blocks: [] };

  const blocks = markers.map((m, i) => ({
    marker: m[0],
    start: m.index,
    end: markers[i + 1]?.index ?? quiz.length,
    text: quiz.slice(m.index + m[0].length, markers[i + 1]?.index ?? quiz.length),
  }));

  return { head, quizPrefix: quiz.slice(0, markers[0].index), quiz, blocks };
}

function parseOptions(text) {
  const labels = [...text.matchAll(/^([A-D])\.[ \t]*(.*)$/gm)];
  const answer = text.match(ANSWER_LINE);

  return labels.map((l, i) => {
    const from = l.index + l[0].length;
    const to = labels[i + 1]?.index ?? (answer ? text.indexOf(answer[0]) : text.length);
    const inline = l[2].trim();
    const below = text.slice(from, to).replace(/```[a-z]*\n?/g, '').replace(/^---$/gm, '').trim();

    return { label: l[1], content: inline || below, correct: answer && l[1] === answer[1].toUpperCase() };
  });
}

function extract(dir) {
  let total = 0;

  for (const file of markdownFiles(dir)) {
    const raw = readFileSync(file, 'utf8');
    const { blocks } = quizBlocks(raw);
    if (blocks.length === 0) continue;

    const missing = blocks
      .map((b, i) => ({ index: i, text: b.text }))
      .filter((b) => !/\*\*Giải thích:\*\*/i.test(b.text));

    if (missing.length === 0) continue;

    console.log(`\n### ${relative(dir, file).split(sep).join('/')}`);

    for (const q of missing) {
      const answer = q.text.match(ANSWER_LINE);
      const prompt = q.text.slice(0, q.text.search(/^[A-D]\.[ \t]/m)).trim();

      console.log(`\n[${q.index}] ${prompt.replace(/\n+/g, ' ').slice(0, 150)}`);
      for (const o of parseOptions(q.text)) {
        console.log(`   ${o.label}${o.correct ? ' ✔' : '  '} ${o.content.replace(/\n+/g, ' ').slice(0, 90)}`);
      }
      console.log(`   -> đáp án ${answer ? answer[1] : '?'}`);
      total += 1;
    }
  }

  console.log(`\n=== ${total} câu thiếu giải thích ===`);
}

function inject(dir, jsonPath) {
  const mapping = JSON.parse(readFileSync(jsonPath, 'utf8'));
  let written = 0;
  let inserted = 0;

  for (const [relPath, explanations] of Object.entries(mapping)) {
    const file = join(dir, relPath);
    const raw = readFileSync(file, 'utf8');
    const { head, quizPrefix, quiz, blocks } = quizBlocks(raw);

    if (blocks.length === 0) {
      console.warn(`  bỏ qua ${relPath}: không tìm thấy khối quiz`);
      continue;
    }

    // Dựng lại từ cuối lên đầu để chỉ số không bị lệch sau mỗi lần chèn.
    let rebuilt = quizPrefix;

    blocks.forEach((block, i) => {
      let text = block.text;
      const explanation = explanations[i];

      const needs = explanation && !/\*\*Giải thích:\*\*/i.test(text);

      if (needs) {
        const answer = text.match(ANSWER_LINE);

        if (!answer) {
          console.warn(`  ${relPath} câu ${i + 1}: không tìm thấy dòng đáp án, bỏ qua`);
        } else {
          // Chèn ngay sau dòng đáp án, cách một dòng trống. Phần còn lại của khối
          // (dấu --- ngăn câu, khoảng trắng) giữ nguyên không đụng tới.
          const at = text.indexOf(answer[0]) + answer[0].length;
          text = `${text.slice(0, at)}\n\n**Giải thích:** ${explanation.trim()}\n${text.slice(at)}`;
          inserted += 1;
        }
      }

      rebuilt += block.marker + text;
    });

    writeFileSync(file, head + rebuilt, 'utf8');
    written += 1;
  }

  console.log(`Đã chèn ${inserted} phần giải thích vào ${written} file.`);
}

const [command, dir, jsonPath] = process.argv.slice(2);

if (command === 'extract' && dir) extract(dir);
else if (command === 'inject' && dir && jsonPath) inject(dir, jsonPath);
else {
  console.log(`Cách dùng:
  node scripts/quiz-explanations.mjs extract <thư-mục-khoá>
  node scripts/quiz-explanations.mjs inject  <thư-mục-khoá> <file-json>`);
  process.exit(1);
}
