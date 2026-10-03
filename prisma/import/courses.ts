import { CourseLevel, CourseStatus, Prisma, PrismaClient } from '@prisma/client';
import { createHash } from 'node:crypto';
import { existsSync } from 'node:fs';
import { join } from 'node:path';

import { readCourse, type ParseWarning, type ParsedCourse } from './markdown';
import { legacyPathOrder } from './paths';

/**
 * Nạp các khoá học demo từ kho tài liệu Markdown vào database.
 *
 * Chạy lại bao nhiêu lần cũng ra một kết quả: mọi khoá chính sinh tất định từ khoá
 * tự nhiên có sẵn trong tài liệu (`id` trong frontmatter, tên thư mục), và mọi lệnh
 * ghi đều là `upsert`.
 */

/**
 * Kho tài liệu NGOÀI repository.
 *
 * Đây là tài liệu có sẵn của dự án, nằm trên máy cá nhân. Vì đường dẫn tuyệt đối
 * này chỉ tồn tại trên đúng một máy, khoá nào còn dùng nguồn này thì người khác
 * clone repo về sẽ không seed được — cảnh báo sẽ nói rõ khoá nào bị bỏ qua.
 * Trỏ đi chỗ khác bằng biến môi trường COURSE_DOCS_DIR.
 */
export const DEFAULT_DOCS_DIR =
  'c:/Users/HP VICTUS/Documents/VKU_Subjects/FPT_SummerIntern/FinalProjectDocs/NodeJS_BE';

/** Tài liệu tự soạn, nằm trong repository nên máy nào cũng có. */
export const AUTHORED_DOCS_DIR = 'content/courses';

interface CatalogEntry {
  /**
   * Tài liệu nằm ở đâu.
   *
   * `authored` — trong repo, tự soạn, được version-control cùng mã nguồn.
   * `external` — kho tài liệu ngoài, chỉ có trên máy đã cấu hình COURSE_DOCS_DIR.
   */
  root: 'authored' | 'external';
  /**
   * Khoá định danh của khoá học. **Không bao giờ đổi.**
   *
   * Mọi UUID của khoá, chương, bài, mục và câu hỏi đều băm từ chuỗi này. Trước
   * đây nó lấy theo tên thư mục, nên đánh lại số thứ tự thư mục cho đúng lộ trình
   * sẽ viết lại toàn bộ ID và làm mất tiến độ học. Tách ra thành trường riêng để
   * tên thư mục trở thành thứ đổi được tự do.
   */
  key: string;
  /** Tên thư mục con trong kho tài liệu tương ứng. */
  dir: string;
  // KHÔNG có `pathOrder` ở đây, có chủ ý.
  //
  // Lộ trình được khai ở prisma/import/paths.ts, và cột `courses.path_order` cũ được
  // SUY RA từ đó qua `legacyPathOrder()`. Khai ở cả hai nơi là mở đường cho hai nơi
  // lệch nhau, rồi bảng điều khiển và trang lộ trình nói hai câu chuyện khác nhau về
  // cùng một khoá học.

  /** Email của mentor đứng tên khoá. Phải khớp một tài khoản do seed tạo. */
  mentorEmail: string;
  /** Tên file trong public/covers, không kèm đuôi. */
  coverSlug: string;
  description: string;
}

/**
 * Bảy khoá của lộ trình NodeJS Backend Developer, xếp đúng thứ tự cần học.
 *
 * Chọn có chủ đích: chúng ghép thành một lộ trình backend liền mạch (ngôn ngữ →
 * runtime → framework → framework có kiến trúc → bảo mật), và cả năm đều có
 * frontmatter đầy đủ. Hai khoá còn lại trong kho bị bỏ qua — một khoá thiếu key
 * `course`/`module` ở vài bài, một khoá toàn file rỗng.
 *
 * Mentor được gán theo đúng chuyên môn khai trong seed, không gán bừa.
 */
const CATALOG: CatalogEntry[] = [
  {
    root: 'authored',
    key: 'course-02-javascript',
    dir: 'course-01-javascript',
    mentorEmail: 'hoang.nguyen@learnova.dev',
    coverSlug: 'javascript',
    description:
      'Nền tảng JavaScript từ biến và kiểu dữ liệu tới closure, Promise và Fetch API. Nội dung soạn theo tài liệu chính thức trên MDN Web Docs.',
  },
  {
    root: 'authored',
    key: 'course-03-typescript',
    dir: 'course-02-typescript',
    mentorEmail: 'hoang.nguyen@learnova.dev',
    coverSlug: 'typescript',
    description:
      'Hệ thống kiểu của TypeScript, lập trình hướng đối tượng và những tính năng nâng cao như generic, utility type. Kết thúc bằng một dự án hoàn chỉnh.',
  },
  {
    root: 'authored',
    key: 'course-04-nodejs',
    dir: 'course-03-nodejs',
    mentorEmail: 'yen.cao@learnova.dev',
    coverSlug: 'nodejs',
    description:
      'Cách Node.js chạy JavaScript ngoài trình duyệt: event loop, các module lõi, lập trình bất đồng bộ, stream và buffer.',
  },
  {
    root: 'authored',
    key: 'course-01-expressjs',
    dir: 'course-04-expressjs',
    mentorEmail: 'mai.vu@learnova.dev',
    coverSlug: 'expressjs',
    description:
      'Dựng web server với Express 5: định tuyến, middleware, xử lý lỗi và cách thiết kế REST API đúng chuẩn. Nội dung soạn theo tài liệu chính thức tại expressjs.com.',
  },
  {
    root: 'authored',
    key: 'course-05-database',
    dir: 'course-05-database',
    mentorEmail: 'hue.dang@learnova.dev',
    coverSlug: 'database',
    description:
      'SQL từ SELECT tới transaction, Prisma ORM và nguyên tắc thiết kế cơ sở dữ liệu: chuẩn hoá, quan hệ và đánh index.',
  },
  {
    root: 'authored',
    key: 'course-06-nestjs',
    dir: 'course-06-nestjs',
    mentorEmail: 'mentor@learnova.local',
    coverSlug: 'nestjs',
    description:
      'NestJS từ nền tảng tới nâng cao: module, dependency injection, tích hợp Prisma, guard, pipe, interceptor và exception filter.',
  },
  {
    root: 'authored',
    key: 'course-07-auth-security',
    dir: 'course-07-auth-security',
    mentorEmail: 'nghia.vo@learnova.dev',
    coverSlug: 'auth-security',
    description:
      'Băm mật khẩu, JWT, xoay vòng refresh token, phân quyền theo vai trò, cùng danh sách kiểm tra bảo mật cho ứng dụng thật.',
  },

  // -------------------------------------------------------------------------
  // Lộ trình Frontend React — 10 khoá, nguồn: FinalProjectDocs/FE REACTJS
  // -------------------------------------------------------------------------
  //
  // Thứ tự khai báo dưới đây theo đúng mạch học, nhưng thứ tự THẬT của lộ trình nằm
  // ở prisma/import/paths.ts — đó mới là nơi quyết định. Danh sách này chỉ là danh
  // mục khoá học, không phải lộ trình.
  //
  // Mentor gán theo chuyên môn khai trong seed, không gán bừa: phần lớn về
  // mentor.hoang (React, TypeScript, Next.js), riêng khoá giao diện về mentor.trang
  // (UI/UX, Design System) và khoá kiểm thử về mentor.ha (Testing, Playwright).
  {
    root: 'authored',
    key: 'course-08-javascript-es6',
    dir: 'course-08-javascript-es6',
    mentorEmail: 'hoang.nguyen@learnova.dev',
    coverSlug: 'javascript-es6',
    description:
      'JavaScript hiện đại cho lập trình web: biến, hàm mũi tên, mảng và object, thao tác DOM, class và module, khép lại bằng scope, hoisting và quản lý bộ nhớ.',
  },
  {
    root: 'authored',
    key: 'course-09-javascript-async',
    dir: 'course-09-javascript-async',
    mentorEmail: 'hoang.nguyen@learnova.dev',
    coverSlug: 'javascript-async',
    description:
      'Closure, Promise, async/await và Event Loop — những cơ chế quyết định vì sao code bất đồng bộ chạy đúng hay sai. Kết thúc bằng prototype, Web API và mẫu thiết kế.',
  },
  {
    root: 'authored',
    key: 'course-10-react-fundamentals',
    dir: 'course-10-react-fundamentals',
    mentorEmail: 'hoang.nguyen@learnova.dev',
    coverSlug: 'react-fundamentals',
    description:
      'Dựng ứng dụng React từ đầu với Vite: component, props, state, xử lý sự kiện và form. Có cả phần Virtual DOM và React Fiber để hiểu React render thế nào.',
  },
  {
    root: 'authored',
    key: 'course-11-react-hooks-patterns',
    dir: 'course-11-react-hooks-patterns',
    mentorEmail: 'hoang.nguyen@learnova.dev',
    coverSlug: 'react-hooks-patterns',
    description:
      'useContext, useReducer, custom hook và các kỹ thuật tối ưu render. Phần cuối đi vào hook đồng thời và những mẫu component nâng cao như Compound Component.',
  },
  {
    root: 'authored',
    key: 'course-12-redux-toolkit',
    dir: 'course-12-redux-toolkit',
    mentorEmail: 'hoang.nguyen@learnova.dev',
    coverSlug: 'redux-toolkit',
    description:
      'Redux Toolkit và RTK Query cho ứng dụng lớn, kèm cập nhật lạc quan. So sánh thẳng thắn với Zustand và TanStack Query để biết khi nào không cần Redux.',
  },
  {
    root: 'authored',
    key: 'course-13-react-router-api',
    dir: 'course-13-react-router-api',
    mentorEmail: 'hoang.nguyen@learnova.dev',
    coverSlug: 'react-router-api',
    description:
      'React Router v6, route được bảo vệ, tầng gọi API bằng Axios và form với React Hook Form + Zod. Khép lại bằng xoay vòng JWT và triển khai CI/CD.',
  },
  {
    root: 'authored',
    key: 'course-14-typescript-react',
    dir: 'course-14-typescript-react',
    mentorEmail: 'mentor@learnova.local',
    coverSlug: 'typescript-react',
    description:
      'Định kiểu cho component, hook, Redux và React Router. Có cả type guard, discriminated union và lộ trình chuyển một dự án JavaScript sẵn có sang TypeScript.',
  },
  {
    root: 'authored',
    key: 'course-15-styling-ui',
    dir: 'course-15-styling-ui',
    mentorEmail: 'trang.le@learnova.dev',
    coverSlug: 'styling-ui',
    description:
      'CSS Modules, Tailwind v4, thư viện headless và Framer Motion. Phần cuối bàn về design token, hệ chủ đề và khả năng tiếp cận cho người khuyết tật.',
  },
  {
    root: 'authored',
    key: 'course-16-testing-performance',
    dir: 'course-16-testing-performance',
    mentorEmail: 'ha.phan@learnova.dev',
    coverSlug: 'testing-performance',
    description:
      'Vitest, React Testing Library, giả lập API bằng MSW và kiểm thử đầu-cuối với Playwright. Nửa sau là hồ sơ hiệu năng, chia nhỏ gói và theo dõi Core Web Vitals.',
  },
  {
    root: 'authored',
    key: 'course-17-nextjs-fullstack',
    dir: 'course-17-nextjs-fullstack',
    mentorEmail: 'hoang.nguyen@learnova.dev',
    coverSlug: 'nextjs-fullstack',
    description:
      'Next.js App Router, Server Component, các chiến lược SSR/SSG/ISR và Server Action. Kết thúc bằng kiến trúc dự án thật, Docker và danh sách kiểm tra OWASP.',
  },
];

/**
 * Sinh UUID tất định từ một khoá tự nhiên.
 *
 * Khác với `seedId()` bên seed.ts (đánh số theo vị trí), ở đây khoá đến từ chính
 * tài liệu — `auth-m1-l2`, `course-06-nestjs`. Nhờ vậy thêm hay bớt một bài không
 * làm xê dịch ID của những bài còn lại, chuyện chắc chắn xảy ra nếu đánh theo vị trí.
 *
 * Băm SHA-256 rồi ép về đúng định dạng UUID: cột trong schema khai `@db.Uuid` nên
 * Postgres từ chối chuỗi không đúng khuôn.
 */
export function stableId(namespace: string, key: string): string {
  const hex = createHash('sha256').update(`${namespace}:${key}`).digest('hex');

  return [
    hex.slice(0, 8),
    hex.slice(8, 12),
    // Nibble phiên bản: 7. Nibble biến thể: 8–b.
    `7${hex.slice(13, 16)}`,
    ((parseInt(hex[16], 16) & 0x3) | 0x8).toString(16) + hex.slice(17, 20),
    hex.slice(20, 32),
  ].join('-');
}

/**
 * Đẩy tạm `order_index` của một tập hàng sang vùng âm.
 *
 * `@@unique([chapterId, orderIndex])` được Postgres kiểm tra ngay sau mỗi câu lệnh,
 * không hoãn tới cuối giao dịch. Nên khi đổi thứ tự hai bài cho nhau, câu UPDATE
 * đầu tiên đã đụng ngay số mà bài kia còn đang giữ, dù trạng thái cuối cùng hoàn
 * toàn hợp lệ.
 *
 * Phép `-x - 1` biến mọi số không âm phân biệt thành số âm phân biệt, nên bước
 * dọn chỗ này không bao giờ tự đụng chính nó. Sau đó mọi giá trị cuối (đều >= 1)
 * tha hồ được gán mà không chạm vùng âm.
 */
async function parkOrderIndexes(
  prisma: PrismaClient,
  table: 'chapters' | 'lessons',
  parentId: string,
): Promise<void> {
  // Tên bảng và tên cột không thể truyền vào dạng tham số, nên phải viết sẵn hai
  // câu lệnh. Riêng `parentId` vẫn đi qua tham số, không nối chuỗi.
  await prisma.$executeRaw(
    table === 'chapters'
      ? Prisma.sql`UPDATE "chapters" SET "order_index" = -"order_index" - 1 WHERE "course_id" = ${parentId}::uuid AND "order_index" >= 0`
      : Prisma.sql`UPDATE "lessons" SET "order_index" = -"order_index" - 1 WHERE "chapter_id" = ${parentId}::uuid AND "order_index" >= 0`,
  );
}

export interface ImportedChapter {
  chapterId: string;
  /** Tên thư mục module, ví dụ `module-03-functions`. */
  dirName: string;
  title: string;
  lessonCount: number;
}

export interface ImportedCourse {
  courseId: string;
  title: string;
  /** Tên thư mục khoá, ví dụ `course-01-javascript`. */
  dirName: string;
  mentorUserId: string;
  /**
   * Chương theo đúng thứ tự học.
   *
   * Trả ra ngoài để bước gán kỹ năng không phải tự tính lại `stableId('chapter', …)`.
   * Tự tính lại nghĩa là công thức sinh ID nằm ở hai chỗ, và hai chỗ thì sớm muộn lệch.
   */
  chapters: ImportedChapter[];
  chapterCount: number;
  /** ID bài học theo đúng thứ tự học, dùng để dựng dữ liệu tiến độ. */
  lessonIds: string[];
  totalMinutes: number;
}

export interface ImportResult {
  courses: ImportedCourse[];
  warnings: ParseWarning[];
  counts: { chapters: number; lessons: number; sections: number; questions: number; options: number };
  skipped: string[];
}

/**
 * Suy mức độ khó của khoá từ mức độ khó của các bài.
 *
 * Frontmatter khai `difficulty` cho từng BÀI, còn schema chỉ có `level` cho cả
 * KHOÁ, nên phải gộp lại. Lấy mức chiếm đa số: một khoá có mười bài Intermediate
 * và bốn bài Beginner thì tổng thể là Intermediate.
 */
function deriveLevel(course: ParsedCourse): CourseLevel {
  const tally: Record<string, number> = {};

  for (const chapter of course.chapters) {
    for (const lesson of chapter.lessons) {
      const key = lesson.difficulty.toUpperCase();
      tally[key] = (tally[key] ?? 0) + 1;
    }
  }

  const winner = Object.entries(tally).sort((a, b) => b[1] - a[1])[0]?.[0];

  if (winner === 'ADVANCED') return CourseLevel.ADVANCED;
  if (winner === 'INTERMEDIATE') return CourseLevel.INTERMEDIATE;
  return CourseLevel.BEGINNER;
}

export interface ImportOptions {
  /** Kho tài liệu ngoài repository. */
  externalDir: string;
  /** Thư mục tài liệu tự soạn, nằm trong repository. */
  authoredDir: string;
  /** Gốc công khai của API, để dựng URL tuyệt đối cho ảnh cover. */
  publicBaseUrl: string;
  /** email -> userId, do seed dựng sau khi tạo tài khoản. */
  mentorIdByEmail: Map<string, string>;
  /** Admin đứng tên duyệt các khoá này. */
  reviewerId: string;
  /** Mốc thời gian cố định, để hai lần chạy seed cho ra cùng dữ liệu. */
  publishedAt: Date;
}

export async function importCourses(
  prisma: PrismaClient,
  options: ImportOptions,
): Promise<ImportResult> {
  const warnings: ParseWarning[] = [];
  const skipped: string[] = [];
  const imported: ImportedCourse[] = [];
  const counts = { chapters: 0, lessons: 0, sections: 0, questions: 0, options: 0 };

  for (const entry of CATALOG) {
    const courseDir = join(
      entry.root === 'authored' ? options.authoredDir : options.externalDir,
      entry.dir,
    );

    // Kho tài liệu nằm ngoài repository. Máy nào không có thì bỏ qua kèm cảnh báo,
    // chứ không làm đổ cả lệnh seed — phần dữ liệu còn lại vẫn dùng được.
    if (!existsSync(courseDir)) {
      skipped.push(`${entry.dir} (không tìm thấy ${courseDir})`);
      continue;
    }

    const mentorUserId = options.mentorIdByEmail.get(entry.mentorEmail);

    if (!mentorUserId) {
      skipped.push(`${entry.dir} (không có mentor ${entry.mentorEmail})`);
      continue;
    }

    const parsed = readCourse(courseDir, warnings, entry.key);

    if (parsed.chapters.length === 0) {
      skipped.push(`${entry.dir} (không đọc được bài học nào)`);
      continue;
    }

    const courseId = stableId('course', parsed.key);
    const level = deriveLevel(parsed);

    const totalMinutes = parsed.chapters
      .flatMap((chapter) => chapter.lessons)
      .reduce((sum, lesson) => sum + lesson.durationMinutes, 0);

    await prisma.course.upsert({
      where: { courseId },
      update: {
        title: parsed.title,
        description: entry.description,
        pathOrder: legacyPathOrder(entry.key),
        coverImageUrl: `${options.publicBaseUrl}/static/covers/${entry.coverSlug}.svg`,
        level,
        mentorId: mentorUserId,
      },
      create: {
        courseId,
        mentorId: mentorUserId,
        title: parsed.title,
        description: entry.description,
        pathOrder: legacyPathOrder(entry.key),
        // Chỉ lưu URL, không lưu chính tấm ảnh. File nằm ở public/covers và được
        // phục vụ ở /static. Chuyển sang S3 sau này chỉ là đổi PUBLIC_BASE_URL.
        coverImageUrl: `${options.publicBaseUrl}/static/covers/${entry.coverSlug}.svg`,
        level,
        status: CourseStatus.PUBLISHED,
        reviewedById: options.reviewerId,
        reviewedAt: options.publishedAt,
        publishedAt: options.publishedAt,
        createdAt: options.publishedAt,
      },
    });

    const lessonIds: string[] = [];
    const importedChapters: ImportedChapter[] = [];

    // Chương nào không còn trong tài liệu thì xoá. `upsert` chỉ biết thêm và sửa,
    // nên đổi tên một thư mục module sẽ để lại chương cũ nằm song song với chương
    // mới. Bài học, mục và câu hỏi đi theo nhờ onDelete: Cascade.
    const chapterIds = parsed.chapters.map((chapter) =>
      stableId('chapter', `${parsed.key}/${chapter.key}`),
    );

    await prisma.chapter.deleteMany({
      where: { courseId, chapterId: { notIn: chapterIds } },
    });

    await parkOrderIndexes(prisma, 'chapters', courseId);

    for (const chapter of parsed.chapters) {
      const chapterId = stableId('chapter', `${parsed.key}/${chapter.key}`);

      await prisma.chapter.upsert({
        where: { chapterId },
        update: { title: chapter.title, orderIndex: chapter.orderIndex },
        create: {
          chapterId,
          courseId,
          title: chapter.title,
          orderIndex: chapter.orderIndex,
          createdAt: options.publishedAt,
        },
      });

      counts.chapters += 1;

      importedChapters.push({
        chapterId,
        dirName: chapter.key,
        title: chapter.title,
        lessonCount: chapter.lessons.length,
      });

      // Cùng lý do như với chương: dọn bài đã bị xoá khỏi tài liệu, rồi dọn chỗ
      // cho đợt đánh số mới.
      const chapterLessonIds = chapter.lessons.map((lesson) => stableId('lesson', lesson.key));

      await prisma.lesson.deleteMany({
        where: { chapterId, lessonId: { notIn: chapterLessonIds } },
      });

      await parkOrderIndexes(prisma, 'lessons', chapterId);

      for (const lesson of chapter.lessons) {
        const lessonId = stableId('lesson', lesson.key);

        await prisma.lesson.upsert({
          where: { lessonId },
          update: {
            title: lesson.title,
            durationMinutes: lesson.durationMinutes,
            orderIndex: lesson.orderIndex,
          },
          create: {
            lessonId,
            chapterId,
            title: lesson.title,
            durationMinutes: lesson.durationMinutes,
            orderIndex: lesson.orderIndex,
            createdAt: options.publishedAt,
          },
        });

        // Xoá sạch rồi tạo lại thay vì upsert từng dòng.
        //
        // `upsert` biết thêm và sửa nhưng không biết dọn: sửa tài liệu cho một bài
        // từ chín mục xuống bảy mục thì hai mục cũ vẫn nằm lại database. Mục và câu
        // hỏi đều thuộc hoàn toàn về bài học do importer sở hữu, nên xoá là an toàn.
        await prisma.lessonSection.deleteMany({ where: { lessonId } });
        await prisma.quizQuestion.deleteMany({ where: { lessonId } });

        await prisma.lessonSection.createMany({
          data: lesson.sections.map((section, index) => ({
            sectionId: stableId('section', `${lesson.key}#${index}`),
            lessonId,
            kind: section.kind,
            heading: section.heading,
            contentMd: section.contentMd,
            orderIndex: index + 1,
          })),
        });

        counts.sections += lesson.sections.length;

        for (const [index, question] of lesson.quiz.entries()) {
          const questionId = stableId('question', `${lesson.key}#${index}`);

          await prisma.quizQuestion.create({
            data: {
              questionId,
              lessonId,
              promptMd: question.promptMd,
              explanationMd: question.explanationMd,
              orderIndex: index + 1,
              options: {
                create: question.options.map((option) => ({
                  optionId: stableId('option', `${lesson.key}#${index}#${option.label}`),
                  label: option.label,
                  contentMd: option.contentMd,
                  isCorrect: option.isCorrect,
                })),
              },
            },
          });

          counts.questions += 1;
          counts.options += question.options.length;
        }

        lessonIds.push(lessonId);
        counts.lessons += 1;
      }
    }

    imported.push({
      courseId,
      title: parsed.title,
      dirName: entry.dir,
      mentorUserId,
      chapters: importedChapters,
      chapterCount: parsed.chapters.length,
      lessonIds,
      totalMinutes,
    });
  }

  return { courses: imported, warnings, counts, skipped };
}
