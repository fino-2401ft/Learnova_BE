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

  // -------------------------------------------------------------------------
  // Lộ trình Frontend React
  // -------------------------------------------------------------------------
  //
  // MỘT kỹ năng cho MỘT khoá, thô hơn hẳn phần backend ở trên (nơi một khoá tách
  // thành hai tới ba kỹ năng). Có chủ ý: mỗi kỹ năng cần 4 câu × 2 đề để chấm hồ sơ,
  // nên chia mịn ở đây sẽ đội chi phí soạn đề lên gấp đôi mà không đổi được điều gì —
  // lộ trình Frontend chưa có bài kiểm tra đầu vào riêng, và đơn vị mà người học thực
  // sự cân nhắc bỏ qua là cả một khoá chứ không phải một chương lẻ.
  //
  // Chia mịn hơn lúc nào cũng làm được sau: tách một `chapters` thành hai mục là thao
  // tác cục bộ, và `code` của những kỹ năng còn lại không đổi nên hồ sơ đã chấm vẫn
  // giữ nguyên.
  {
    code: 'fe-js-modern',
    name: 'JavaScript hiện đại',
    domain: 'Frontend',
    chapters: [
      'course-08-javascript-es6/module-01-nen-tang-cu-phap',
      'course-08-javascript-es6/module-02-du-lieu-va-dom',
      'course-08-javascript-es6/module-03-cu-phap-hien-dai-va-co-che-ben-duoi',
    ],
  },
  {
    code: 'fe-js-async',
    name: 'JavaScript bất đồng bộ',
    domain: 'Frontend',
    chapters: [
      'course-09-javascript-async/module-01-closure-va-bat-dong-bo',
      'course-09-javascript-async/module-02-xu-ly-loi-va-event-loop',
      'course-09-javascript-async/module-03-prototype-web-api-va-mau-thiet-ke',
    ],
  },
  {
    code: 'react-core',
    name: 'React nền tảng',
    domain: 'React',
    chapters: [
      'course-10-react-fundamentals/module-01-khoi-dong-va-component',
      'course-10-react-fundamentals/module-02-state-va-tuong-tac-nguoi-dung',
      'course-10-react-fundamentals/module-03-side-effect-co-che-render-va-form',
    ],
  },
  {
    code: 'react-hooks',
    name: 'React Hooks & Patterns',
    domain: 'React',
    chapters: [
      'course-11-react-hooks-patterns/module-01-chia-se-va-quan-ly-state',
      'course-11-react-hooks-patterns/module-02-toi-uu-va-tai-su-dung-logic',
      'course-11-react-hooks-patterns/module-03-hook-nang-cao-va-mau-component',
    ],
  },
  {
    code: 'react-state',
    name: 'Quản lý state',
    domain: 'React',
    chapters: [
      'course-12-redux-toolkit/module-01-redux-toolkit-nen-tang',
      'course-12-redux-toolkit/module-02-rtk-query-va-thuc-hanh-tot',
      'course-12-redux-toolkit/module-03-giai-phap-thay-the-redux',
    ],
  },
  {
    code: 'react-routing',
    name: 'Định tuyến & tích hợp API',
    domain: 'React',
    chapters: [
      'course-13-react-router-api/module-01-dinh-tuyen-voi-react-router',
      'course-13-react-router-api/module-02-tich-hop-api-va-form',
      'course-13-react-router-api/module-03-bao-mat-va-trien-khai',
    ],
  },
  {
    code: 'ts-react',
    name: 'TypeScript cho React',
    domain: 'Frontend',
    chapters: [
      'course-14-typescript-react/module-01-nen-tang-typescript',
      'course-14-typescript-react/module-02-dinh-kieu-cho-react',
      'course-14-typescript-react/module-03-dinh-kieu-cho-he-sinh-thai',
      'course-14-typescript-react/module-04-ky-thuat-nang-cao-va-chuyen-doi',
    ],
  },
  {
    code: 'fe-styling',
    name: 'Giao diện & Design System',
    domain: 'Frontend',
    chapters: [
      'course-15-styling-ui/module-01-css-modules-va-tailwind',
      'course-15-styling-ui/module-02-thu-vien-ui-va-hieu-ung',
      'course-15-styling-ui/module-03-design-system-va-kha-nang-tiep-can',
    ],
  },
  {
    code: 'fe-quality',
    name: 'Kiểm thử & hiệu năng',
    domain: 'Frontend',
    chapters: [
      'course-16-testing-performance/module-01-nen-tang-kiem-thu',
      'course-16-testing-performance/module-02-kiem-thu-nang-cao',
      'course-16-testing-performance/module-03-toi-uu-hieu-nang',
    ],
  },
  {
    code: 'nextjs',
    name: 'Next.js & Full-stack React',
    domain: 'React',
    chapters: [
      'course-17-nextjs-fullstack/module-01-app-router-nen-tang',
      'course-17-nextjs-fullstack/module-02-lay-du-lieu-va-mutation',
      'course-17-nextjs-fullstack/module-03-xac-thuc-va-seo',
      'course-17-nextjs-fullstack/module-04-kien-truc-va-trien-khai',
    ],
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
