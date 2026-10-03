import { PrismaClient } from '@prisma/client';

import { stableId, type ImportedCourse } from './courses';

/**
 * Nạp các lộ trình nghề và thứ tự khoá học trong từng lộ trình.
 *
 * Lộ trình là dãy khoá cố định giống nhau với mọi người học. Cá nhân hoá KHÔNG đảo
 * thứ tự và không thêm bớt khoá — nó chỉ bỏ bớt chương dựa trên điểm bài test đầu vào
 * (xem SkillChapter và module assessment).
 *
 * Idempotent theo đúng khuôn của `importCourses`: ID tất định, chỉ `upsert`, và xoá
 * những hàng không còn được khai báo.
 */

interface PathEntry {
  /** Khoá tự nhiên, đi vào URL. Mọi UUID băm từ chuỗi này nên **không bao giờ đổi**. */
  slug: string;
  title: string;
  description: string;
  /** Tên icon để frontend tra sang component. Phải khớp một tên có thật trong
   *  `Learnova_FE/src/components/icons.tsx`. */
  icon: string;
  /**
   * `key` của các khoá trong CATALOG, xếp ĐÚNG thứ tự cần học.
   *
   * Dùng `key` chứ không dùng tên thư mục: `key` là khoá tự nhiên mà mọi UUID băm ra,
   * còn tên thư mục thì đổi được tự do (xem ghi chú ở CatalogEntry).
   */
  courseKeys: string[];
}

const PATHS: PathEntry[] = [
  {
    slug: 'nodejs-backend',
    title: 'NodeJS Backend Developer',
    description:
      'Từ JavaScript và TypeScript tới Node.js, Express và NestJS, khép lại bằng cơ sở dữ liệu và bảo mật ứng dụng. Bảy khoá xếp thành một mạch liền: ngôn ngữ → runtime → framework → kiến trúc → phòng thủ.',
    icon: 'braces',
    courseKeys: [
      'course-02-javascript',
      'course-03-typescript',
      'course-04-nodejs',
      'course-01-expressjs',
      'course-05-database',
      'course-06-nestjs',
      'course-07-auth-security',
    ],
  },
  {
    slug: 'react-frontend',
    title: 'React Frontend Developer',
    description:
      'Mười khoá từ JavaScript hiện đại tới Next.js: React nền tảng, hook nâng cao, quản lý state, định tuyến, TypeScript, giao diện, kiểm thử và kiến trúc full-stack.',
    icon: 'layout',
    courseKeys: [
      'course-08-javascript-es6',
      'course-09-javascript-async',
      'course-10-react-fundamentals',
      'course-11-react-hooks-patterns',
      'course-12-redux-toolkit',
      'course-13-react-router-api',
      'course-14-typescript-react',
      'course-15-styling-ui',
      'course-16-testing-performance',
      'course-17-nextjs-fullstack',
    ],
  },
];

/**
 * Lộ trình mà cột `courses.path_order` cũ mô tả.
 *
 * Cột đó `@unique` trên toàn bảng nên chỉ diễn đạt được ĐÚNG MỘT lộ trình. Nó vẫn
 * được điền để bảng điều khiển phía frontend chạy tiếp, nhưng giá trị SUY RA từ đây
 * chứ không khai riêng — hai nơi khai cùng một thứ là hai nơi có thể lệch nhau.
 */
export const LEGACY_PATH_SLUG = 'nodejs-backend';

/** Vị trí trong lộ trình cũ của một khoá, hoặc `null` nếu khoá không thuộc lộ trình
 *  đó. Dùng lúc import khoá học, trước khi lộ trình được nạp. */
export function legacyPathOrder(courseKey: string): number | null {
  const legacy = PATHS.find((p) => p.slug === LEGACY_PATH_SLUG);
  const index = legacy?.courseKeys.indexOf(courseKey) ?? -1;

  return index === -1 ? null : index + 1;
}

export interface PathImportResult {
  paths: number;
  links: number;
  /** `key` khai trong lộ trình nhưng không khớp khoá nào đã import. Phải luôn rỗng. */
  unknownCourses: string[];
}

export async function importPaths(
  prisma: PrismaClient,
  courses: ImportedCourse[],
): Promise<PathImportResult> {
  // Đối chiếu bằng UUID chứ không bằng `key`: `ImportedCourse` không mang `key` ra
  // ngoài, mà `courseId` vốn băm từ chính `key` đó nên tính lại là tương đương và
  // không cần nới rộng kiểu trả về của importCourses.
  //
  // Tập này còn bắt được một trường hợp im lặng khác: khoá dùng kho tài liệu ngoài
  // repo mà máy hiện tại không có sẽ bị importCourses bỏ qua, và lộ trình trỏ tới nó
  // phải báo lỗi chứ không được lặng lẽ ngắn đi một bước.
  const importedIds = new Set(courses.map((c) => c.courseId));
  const unknownCourses: string[] = [];
  const keptPathIds: string[] = [];
  let links = 0;

  for (const [index, entry] of PATHS.entries()) {
    const learningPathId = stableId('learning_path', entry.slug);
    keptPathIds.push(learningPathId);

    await prisma.learningPath.upsert({
      where: { learningPathId },
      update: {
        slug: entry.slug,
        title: entry.title,
        description: entry.description,
        icon: entry.icon,
        orderIndex: index + 1,
      },
      create: {
        learningPathId,
        slug: entry.slug,
        title: entry.title,
        description: entry.description,
        icon: entry.icon,
        orderIndex: index + 1,
      },
    });

    // Xoá sạch rồi ghi lại thay vì upsert từng dòng: `@@unique(pathId, orderIndex)`
    // được Postgres kiểm ngay sau mỗi câu lệnh, nên chèn một khoá vào giữa lộ trình
    // sẽ đụng số mà khoá phía sau còn đang giữ — dù trạng thái cuối hoàn toàn hợp lệ.
    // Xoá trước là cách đơn giản nhất, và ở đây an toàn vì bảng chỉ chứa cấu hình,
    // không chứa dữ liệu người dùng.
    await prisma.learningPathCourse.deleteMany({ where: { learningPathId } });

    for (const [position, courseKey] of entry.courseKeys.entries()) {
      const courseId = stableId('course', courseKey);

      if (!importedIds.has(courseId)) {
        unknownCourses.push(`${entry.slug}: ${courseKey}`);
        continue;
      }

      await prisma.learningPathCourse.create({
        data: { learningPathId, courseId, orderIndex: position + 1 },
      });
      links += 1;
    }
  }

  // Lộ trình bị gỡ khỏi khai báo phải biến mất khỏi database, nếu không nó sống mãi
  // và vẫn hiện trên trang chọn lộ trình.
  await prisma.learningPath.deleteMany({
    where: { learningPathId: { notIn: keptPathIds } },
  });

  return { paths: PATHS.length, links, unknownCourses };
}
