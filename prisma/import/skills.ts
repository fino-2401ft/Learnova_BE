import { PrismaClient } from '@prisma/client';

import { stableId, type ImportedCourse } from './courses';

/**
 * Nạp danh mục kỹ năng và gán từng chương vào một kỹ năng.
 *
 * Kỹ năng là đơn vị chấm điểm của hồ sơ năng lực: bài kiểm tra đầu vào hỏi theo kỹ
 * năng, điểm đầu ra so lại theo kỹ năng, và lộ trình bỏ bớt chương dựa trên kết quả
 * đó.
 *
 * Gán ở mức CHƯƠNG, không phải mức bài. Đơn vị mà lộ trình bỏ qua là cả chương, nên
 * gán tới từng bài chỉ làm phồng số câu hỏi phải soạn mà không đổi được điều gì.
 *
 * Idempotent theo đúng khuôn của `importCourses`: ID tất định, chỉ `upsert`, và xoá
 * hàng không còn được khai báo.
 */

interface SkillEntry {
  /** Khoá tự nhiên. Mọi UUID băm từ chuỗi này nên **không bao giờ đổi**. */
  code: string;
  name: string;
  /** Nhóm hiển thị trên biểu đồ hồ sơ. */
  domain: string;
  /**
   * Chương thuộc kỹ năng này, viết dạng `<thư-mục-khoá>/<thư-mục-module>`.
   *
   * Dùng tên thư mục chứ không dùng UUID: tên thư mục là thứ người soạn nhìn thấy và
   * đối chiếu được với `content/courses`. Bước nạp tự tra sang chapterId, và báo lỗi
   * nếu có dòng không khớp chương nào — sai chính tả ở đây phải nổ ngay, chứ không
   * được âm thầm bỏ sót một chương.
   */
  chapters: string[];
}

/**
 * 16 kỹ năng phủ đủ 26 chương của lộ trình.
 *
 * Số kỹ năng là một đánh đổi: mịn hơn thì hồ sơ nói được nhiều hơn, nhưng mỗi kỹ
 * năng cần 4 câu × 2 đề nên chi phí soạn đề tăng tuyến tính. 16 là mức mà mỗi kỹ
 * năng vẫn là một chủ đề kiểm tra được độc lập.
 *
 * `orderIndex` quyết định thứ tự hiển thị trên biểu đồ hồ sơ, xếp theo đúng thứ tự
 * học của lộ trình.
 */
const SKILLS: SkillEntry[] = [
  {
    code: 'js-core',
    name: 'JS Cú pháp nền tảng',
    domain: 'JavaScript',
    chapters: [
      'course-01-javascript/module-01-javascript-basics',
      'course-01-javascript/module-02-control-flow',
    ],
  },
  {
    code: 'js-func',
    name: 'JS Hàm & Closure',
    domain: 'JavaScript',
    chapters: ['course-01-javascript/module-03-functions'],
  },
  {
    code: 'js-data',
    name: 'JS Object & Array',
    domain: 'JavaScript',
    chapters: ['course-01-javascript/module-04-objects-arrays'],
  },
  {
    code: 'js-async',
    name: 'JS Hiện đại & Bất đồng bộ',
    domain: 'JavaScript',
    chapters: ['course-01-javascript/module-05-es6'],
  },
  {
    code: 'ts-types',
    name: 'TS Hệ thống kiểu',
    domain: 'TypeScript',
    chapters: ['course-02-typescript/module-01-type-system'],
  },
  {
    code: 'ts-oop',
    name: 'TS Hướng đối tượng',
    domain: 'TypeScript',
    chapters: ['course-02-typescript/module-02-object-oriented-programming'],
  },
  {
    code: 'ts-advanced',
    name: 'TS Nâng cao & Dự án',
    domain: 'TypeScript',
    chapters: [
      'course-02-typescript/module-03-advanced-typescript',
      'course-02-typescript/module-04-typescript-project',
    ],
  },
  {
    code: 'node-core',
    name: 'Node Nền tảng',
    domain: 'Node.js',
    chapters: [
      'course-03-nodejs/module-01-node-js-fundamentals',
      'course-03-nodejs/module-02-core-modules',
    ],
  },
  {
    code: 'node-async',
    name: 'Node Bất đồng bộ & Stream',
    domain: 'Node.js',
    chapters: [
      'course-03-nodejs/module-03-asynchronous-programming',
      'course-03-nodejs/module-04-stream-buffer',
    ],
  },
  {
    code: 'http-express',
    name: 'HTTP, Express & REST',
    domain: 'Web',
    chapters: [
      'course-04-expressjs/module-01-express-basics',
      'course-04-expressjs/module-02-middleware',
      'course-04-expressjs/module-03-rest-api',
    ],
  },
  {
    code: 'sql',
    name: 'SQL',
    domain: 'Database',
    chapters: ['course-05-database/module-01-sql'],
  },
  {
    code: 'db-design',
    name: 'ORM & Thiết kế CSDL',
    domain: 'Database',
    chapters: [
      'course-05-database/module-02-prisma-orm',
      'course-05-database/module-03-database-design',
    ],
  },
  {
    code: 'nest-core',
    name: 'NestJS Kiến trúc',
    domain: 'NestJS',
    chapters: [
      'course-06-nestjs/module-01-nestjs-fundamentals',
      'course-06-nestjs/module-02-dependency-injection',
      'course-06-nestjs/module-03-database-integration',
    ],
  },
  {
    code: 'nest-advanced',
    name: 'NestJS Nâng cao',
    domain: 'NestJS',
    chapters: ['course-06-nestjs/module-04-advanced-nestjs'],
  },
  {
    code: 'auth',
    name: 'Xác thực & Phân quyền',
    domain: 'Security',
    chapters: [
      'course-07-auth-security/module-01-authentication',
      'course-07-auth-security/module-02-authorization',
    ],
  },
  {
    code: 'appsec',
    name: 'Bảo mật ứng dụng',
    domain: 'Security',
    chapters: ['course-07-auth-security/module-03-security-best-practices'],
  },
];

export interface SkillImportResult {
  skills: number;
  links: number;
  /** Chương có thật nhưng không kỹ năng nào nhận. Phải luôn rỗng. */
  orphanChapters: string[];
  /** Dòng khai báo không khớp chương nào. Phải luôn rỗng. */
  unknownChapters: string[];
}

/**
 * Nạp kỹ năng và gán chương.
 *
 * @param courses Kết quả của `importCourses`. Lấy chapterId từ đây thay vì tự tính
 *                lại `stableId('chapter', …)` — công thức sinh ID nằm ở hai chỗ thì
 *                sớm muộn hai chỗ lệch nhau.
 */
export async function importSkills(
  prisma: PrismaClient,
  courses: ImportedCourse[],
): Promise<SkillImportResult> {
  // Tra cứu "<thư-mục-khoá>/<thư-mục-module>" -> chapterId.
  const chapterIdByPath = new Map<string, string>();

  for (const course of courses) {
    for (const chapter of course.chapters) {
      chapterIdByPath.set(`${course.dirName}/${chapter.dirName}`, chapter.chapterId);
    }
  }

  const skillIds: string[] = [];
  const unknownChapters: string[] = [];
  const claimed = new Set<string>();
  let links = 0;

  for (const [index, entry] of SKILLS.entries()) {
    const skillId = stableId('skill', entry.code);
    skillIds.push(skillId);

    await prisma.skill.upsert({
      where: { skillId },
      update: { code: entry.code, name: entry.name, domain: entry.domain, orderIndex: index + 1 },
      create: {
        skillId,
        code: entry.code,
        name: entry.name,
        domain: entry.domain,
        orderIndex: index + 1,
      },
    });

    const chapterIds: string[] = [];

    for (const path of entry.chapters) {
      const chapterId = chapterIdByPath.get(path);

      if (!chapterId) {
        unknownChapters.push(`${entry.code} -> ${path}`);
        continue;
      }

      chapterIds.push(chapterId);
      claimed.add(path);
    }

    // Gỡ chương đã bị bỏ khỏi khai báo. `upsert` chỉ biết thêm và sửa, nên chuyển
    // một chương sang kỹ năng khác mà không dọn sẽ để nó thuộc cả hai.
    await prisma.skillChapter.deleteMany({
      where: { skillId, chapterId: { notIn: chapterIds } },
    });

    for (const chapterId of chapterIds) {
      await prisma.skillChapter.upsert({
        where: { skillId_chapterId: { skillId, chapterId } },
        update: {},
        create: { skillId, chapterId },
      });

      links += 1;
    }
  }

  // Kỹ năng bị gỡ khỏi danh mục thì xoá; SkillChapter đi theo nhờ onDelete: Cascade.
  await prisma.skill.deleteMany({ where: { skillId: { notIn: skillIds } } });

  const orphanChapters = [...chapterIdByPath.keys()].filter((path) => !claimed.has(path)).sort();

  return { skills: SKILLS.length, links, orphanChapters, unknownChapters };
}
