import {
  ConversationType,
  CourseLevel,
  CourseStatus,
  EnrollmentStatus,
  MeetingParticipantRole,
  MeetingStatus,
  MessageType,
  PrismaClient,
  Role,
  SkillLevel,
} from '@prisma/client';
import { createHash } from 'node:crypto';

import { hashPassword } from '../src/common/utils/password.util';
import { AUTHORED_DOCS_DIR, DEFAULT_DOCS_DIR, importCourses } from './import/courses';
import { importSkills } from './import/skills';

/**
 * Dữ liệu mẫu cho môi trường phát triển.
 *
 * Gồm hai nửa:
 *
 *   1. Người dùng, phiên đăng nhập và các khoá học chưa xuất bản — sinh từ mảng
 *      hằng trong chính file này.
 *   2. Năm khoá học đã xuất bản, kèm toàn bộ nội dung thật — nạp từ kho tài liệu
 *      Markdown qua `importCourses()`.
 *
 * Ghi danh, tiến độ, hội thoại và phòng họp đều bám vào NĂM KHOÁ THẬT, nên dữ liệu
 * nhìn ở đâu cũng khớp nhau.
 *
 * Chạy lại bao nhiêu lần cũng ra đúng một kết quả. Hai thứ bảo đảm điều đó:
 *
 *   1. Mọi khoá chính đều tất định, và mọi thao tác ghi đều là `upsert`.
 *   2. Không có `Math.random()` ở bất cứ đâu — mọi lựa chọn đều lấy theo phép chia
 *      dư của chỉ số, và thời gian tính từ một mốc cố định.
 *
 * Ngoại lệ duy nhất là bảng `sessions`: hạn phiên phải nằm ở tương lai SO VỚI LÚC
 * CHẠY, nếu không mọi phiên mẫu đều hết hạn và không test được màn hình quản lý
 * thiết bị. Xem chú thích ở phần sinh session.
 *
 * Điều này quan trọng vì `prisma migrate dev` chạy seed sau mỗi lần migrate.
 * Seed KHÔNG xoá dữ liệu không thuộc về nó.
 */

const prisma = new PrismaClient();

/** Chỉ dùng trên máy cá nhân. Đủ mạnh để qua được RegisterDto. */
const DEV_PASSWORD = 'Learnova@123';

// ---------------------------------------------------------------------------
// Tiện ích sinh dữ liệu tất định
// ---------------------------------------------------------------------------

/** Mã bảng, nhét vào UUID để khoá của hai bảng khác nhau không bao giờ đụng nhau. */
const TABLE = {
  course: 0x10,
  document: 0x13,
  enrollment: 0x14,
  progress: 0x15,
  conversation: 0x16,
  message: 0x17,
  meeting: 0x18,
  session: 0x19,
} as const;

/**
 * Khoá chính cố định, đúng định dạng UUID v7 (nibble phiên bản `7`, biến thể `8`).
 *
 * Cột trong schema khai `@db.Uuid` nên Postgres từ chối chuỗi sai định dạng — không
 * thể dùng kiểu khoá "course-01" cho gọn.
 */
function seedId(table: number, index: number): string {
  const tail = table.toString(16).padStart(4, '0') + index.toString(16).padStart(8, '0');
  return `019a0000-0000-7000-8000-${tail}`;
}

/** Mốc thời gian cố định: 15/01/2026. Dùng `new Date()` thì mỗi lần chạy seed lại
 *  sinh ra dữ liệu khác nhau và không so sánh được giữa hai lần. */
const EPOCH = Date.UTC(2026, 0, 15, 3, 0, 0);
const DAY = 86_400_000;
const HOUR = 3_600_000;

function at(days: number, hours = 0): Date {
  return new Date(EPOCH + days * DAY + hours * HOUR);
}

/**
 * Cùng ý nghĩa với `at()` nhưng neo vào thời điểm chạy thay vì mốc cố định.
 *
 * Chỉ dùng cho `sessions`. Một phiên "còn hiệu lực" là phiên có expiresAt > now,
 * mà `now` thì trôi đi mỗi ngày — neo vào mốc cố định thì chỉ vài tuần sau khi
 * viết seed, toàn bộ phiên mẫu đều đã hết hạn.
 */
function fromNow(days: number, hours = 0): Date {
  return new Date(Date.now() + days * DAY + hours * HOUR);
}

/** Chuỗi 64 ký tự hex, đúng hình dạng mà cột `@db.Char(64)` chờ đợi. */
function fakeTokenHash(label: string): string {
  return createHash('sha256').update(label).digest('hex');
}

// ---------------------------------------------------------------------------
// Người dùng
// ---------------------------------------------------------------------------

interface MentorSeed {
  username: string;
  email: string;
  fullName: string;
  expertise: string[];
  years: number;
  approved: boolean;
}

interface MenteeSeed {
  username: string;
  email: string;
  fullName: string;
  level: SkillLevel;
}

const ADMINS = [
  { username: 'admin', email: 'admin@learnova.local', fullName: 'Quản trị hệ thống' },
  { username: 'admin.ops', email: 'ops@learnova.local', fullName: 'Trực vận hành' },
];

// 20 mentor. Ba tài khoản @learnova.local giữ nguyên email cũ để những hướng dẫn
// đang lưu hành vẫn đăng nhập được.
//
// Năm người trong danh sách này đứng tên năm khoá học thật; ánh xạ nằm ở CATALOG
// trong prisma/import/courses.ts và khớp theo email.
const MENTORS: MentorSeed[] = [
  { username: 'mentor.linh', email: 'mentor@learnova.local', fullName: 'Phạm Thùy Linh', expertise: ['NestJS', 'PostgreSQL', 'TypeScript'], years: 6, approved: true },
  { username: 'mentor.hoang', email: 'hoang.nguyen@learnova.dev', fullName: 'Nguyễn Việt Hoàng', expertise: ['React', 'TypeScript', 'Next.js'], years: 8, approved: true },
  { username: 'mentor.trang', email: 'trang.le@learnova.dev', fullName: 'Lê Thu Trang', expertise: ['UI/UX', 'Figma', 'Design System'], years: 5, approved: true },
  { username: 'mentor.duc', email: 'duc.pham@learnova.dev', fullName: 'Phạm Minh Đức', expertise: ['Java', 'Spring Boot', 'Microservices'], years: 10, approved: true },
  { username: 'mentor.mai', email: 'mai.vu@learnova.dev', fullName: 'Vũ Ngọc Mai', expertise: ['Python', 'Django', 'REST API'], years: 7, approved: true },
  { username: 'mentor.tuan', email: 'tuan.do@learnova.dev', fullName: 'Đỗ Anh Tuấn', expertise: ['DevOps', 'Docker', 'Kubernetes'], years: 9, approved: true },
  { username: 'mentor.hue', email: 'hue.dang@learnova.dev', fullName: 'Đặng Thị Huệ', expertise: ['SQL', 'Power BI', 'Data Analysis'], years: 4, approved: true },
  { username: 'mentor.khanh', email: 'khanh.bui@learnova.dev', fullName: 'Bùi Quốc Khánh', expertise: ['Golang', 'gRPC', 'Redis'], years: 6, approved: true },
  { username: 'mentor.oanh', email: 'oanh.tran@learnova.dev', fullName: 'Trần Kiều Oanh', expertise: ['Machine Learning', 'PyTorch'], years: 5, approved: true },
  { username: 'mentor.long', email: 'long.hoang@learnova.dev', fullName: 'Hoàng Hải Long', expertise: ['Android', 'Kotlin', 'Jetpack Compose'], years: 7, approved: true },
  { username: 'mentor.chi', email: 'chi.nguyen@learnova.dev', fullName: 'Nguyễn Linh Chi', expertise: ['iOS', 'Swift', 'SwiftUI'], years: 6, approved: true },
  { username: 'mentor.son', email: 'son.ly@learnova.dev', fullName: 'Lý Thanh Sơn', expertise: ['C#', '.NET', 'Azure'], years: 11, approved: true },
  { username: 'mentor.ha', email: 'ha.phan@learnova.dev', fullName: 'Phan Thu Hà', expertise: ['Testing', 'Cypress', 'Playwright'], years: 4, approved: true },
  { username: 'mentor.nghia', email: 'nghia.vo@learnova.dev', fullName: 'Võ Trung Nghĩa', expertise: ['Security', 'OWASP', 'Pentest'], years: 8, approved: true },
  { username: 'mentor.thao', email: 'thao.dinh@learnova.dev', fullName: 'Đinh Phương Thảo', expertise: ['Agile', 'Scrum', 'Product'], years: 9, approved: true },
  { username: 'mentor.binh', email: 'binh.truong@learnova.dev', fullName: 'Trương Thanh Bình', expertise: ['Rust', 'WebAssembly'], years: 5, approved: true },
  { username: 'mentor.yen', email: 'yen.cao@learnova.dev', fullName: 'Cao Hải Yến', expertise: ['GraphQL', 'Apollo', 'Node.js'], years: 6, approved: true },
  // Ba hồ sơ chưa duyệt: có hồ sơ mentor không đồng nghĩa với được xuất bản khoá học.
  { username: 'mentor.phuc', email: 'phuc.ngo@learnova.dev', fullName: 'Ngô Gia Phúc', expertise: ['Blockchain', 'Solidity'], years: 3, approved: false },
  { username: 'mentor.nhung', email: 'nhung.duong@learnova.dev', fullName: 'Dương Hồng Nhung', expertise: ['Technical Writing'], years: 4, approved: false },
  { username: 'mentor.kien', email: 'kien.mai@learnova.dev', fullName: 'Mai Trung Kiên', expertise: ['System Design', 'Architecture'], years: 13, approved: false },
];

const B = SkillLevel.BEGINNER;
const I = SkillLevel.INTERMEDIATE;
const A = SkillLevel.ADVANCED;

const MENTEES: MenteeSeed[] = [
  { username: 'mentee.nam', email: 'mentee@learnova.local', fullName: 'Trần Hoài Nam', level: B },
  { username: 'mentee.an', email: 'an.nguyen@learnova.dev', fullName: 'Nguyễn Bình An', level: B },
  { username: 'mentee.bao', email: 'bao.tran@learnova.dev', fullName: 'Trần Gia Bảo', level: I },
  { username: 'mentee.chau', email: 'chau.le@learnova.dev', fullName: 'Lê Minh Châu', level: B },
  { username: 'mentee.dung', email: 'dung.pham@learnova.dev', fullName: 'Phạm Tiến Dũng', level: I },
  { username: 'mentee.giang', email: 'giang.vu@learnova.dev', fullName: 'Vũ Thu Giang', level: A },
  { username: 'mentee.hanh', email: 'hanh.do@learnova.dev', fullName: 'Đỗ Mỹ Hạnh', level: B },
  { username: 'mentee.hieu', email: 'hieu.dang@learnova.dev', fullName: 'Đặng Trung Hiếu', level: I },
  { username: 'mentee.khoa', email: 'khoa.bui@learnova.dev', fullName: 'Bùi Đăng Khoa', level: B },
  { username: 'mentee.lan', email: 'lan.trinh@learnova.dev', fullName: 'Trịnh Ngọc Lan', level: I },
  { username: 'mentee.minh', email: 'minh.hoang@learnova.dev', fullName: 'Hoàng Nhật Minh', level: A },
  { username: 'mentee.ngan', email: 'ngan.nguyen@learnova.dev', fullName: 'Nguyễn Kim Ngân', level: B },
  { username: 'mentee.phong', email: 'phong.ly@learnova.dev', fullName: 'Lý Hoàng Phong', level: I },
  { username: 'mentee.quyen', email: 'quyen.phan@learnova.dev', fullName: 'Phan Thảo Quyên', level: B },
  { username: 'mentee.sang', email: 'sang.vo@learnova.dev', fullName: 'Võ Nhật Sang', level: I },
  { username: 'mentee.tam', email: 'tam.dinh@learnova.dev', fullName: 'Đinh Thanh Tâm', level: A },
  { username: 'mentee.uyen', email: 'uyen.truong@learnova.dev', fullName: 'Trương Tố Uyên', level: B },
  { username: 'mentee.vinh', email: 'vinh.cao@learnova.dev', fullName: 'Cao Quang Vinh', level: I },
  { username: 'mentee.xuan', email: 'xuan.ngo@learnova.dev', fullName: 'Ngô Thanh Xuân', level: B },
  { username: 'mentee.yen', email: 'yen.duong@learnova.dev', fullName: 'Dương Hải Yến', level: I },
];

// ---------------------------------------------------------------------------
// Khoá học chưa xuất bản
// ---------------------------------------------------------------------------

interface DraftCourseSeed {
  title: string;
  description: string;
  level: CourseLevel;
  status: CourseStatus;
  /** Chỉ số trong mảng MENTORS. */
  mentor: number;
}

const { BEGINNER, INTERMEDIATE, ADVANCED } = CourseLevel;
const { DRAFT, PENDING_APPROVAL, REJECTED } = CourseStatus;

/**
 * Mười khoá KHÔNG có nội dung, chỉ để màn hình quản trị có đủ trạng thái mà thử.
 *
 * Khoá ở trạng thái nháp hay bị từ chối thì chưa có bài học là chuyện bình thường,
 * nên việc chúng rỗng phản ánh đúng thực tế. Toàn bộ khoá ĐÃ XUẤT BẢN đều đến từ
 * kho tài liệu thật.
 */
const DRAFT_COURSES: DraftCourseSeed[] = [
  { title: 'Phát triển iOS với SwiftUI', description: 'Layout khai báo, điều hướng và quản lý trạng thái trên iOS.', level: INTERMEDIATE, status: PENDING_APPROVAL, mentor: 10 },
  { title: '.NET và Azure cho doanh nghiệp', description: 'Triển khai ứng dụng .NET lên Azure App Service.', level: ADVANCED, status: PENDING_APPROVAL, mentor: 11 },
  { title: 'Kiểm thử tự động với Playwright', description: 'Viết test end-to-end chạy ổn định trong CI.', level: INTERMEDIATE, status: PENDING_APPROVAL, mentor: 12 },
  { title: 'Phân tích dữ liệu với Power BI', description: 'Dựng báo cáo và bảng điều khiển từ dữ liệu thật.', level: BEGINNER, status: PENDING_APPROVAL, mentor: 6 },

  { title: 'Quản lý sản phẩm theo Scrum', description: 'Backlog, sprint và cách viết user story không mơ hồ.', level: BEGINNER, status: DRAFT, mentor: 14 },
  { title: 'Rust cho lập trình hệ thống', description: 'Ownership, borrow checker và lập trình bất đồng bộ.', level: ADVANCED, status: DRAFT, mentor: 15 },
  { title: 'Docker và Kubernetes căn bản', description: 'Đóng gói ứng dụng, chạy nhiều bản sao và triển khai không gián đoạn.', level: INTERMEDIATE, status: DRAFT, mentor: 5 },
  { title: 'Thiết kế hệ thống quy mô lớn', description: 'Cân bằng tải, phân mảnh dữ liệu và bộ nhớ đệm.', level: ADVANCED, status: DRAFT, mentor: 19 },

  { title: 'Kiếm tiền nhanh với Blockchain', description: 'Nội dung hứa hẹn lợi nhuận, không có giá trị đào tạo.', level: BEGINNER, status: REJECTED, mentor: 17 },
  { title: 'Khoá học chưa hoàn thiện', description: 'Nộp duyệt khi mới có phần mở đầu.', level: BEGINNER, status: REJECTED, mentor: 18 },
];

// ---------------------------------------------------------------------------
// Seed
// ---------------------------------------------------------------------------

async function main(): Promise<void> {
  if (process.env.NODE_ENV === 'production') {
    throw new Error('Never seed a production database');
  }

  // Phải dùng đúng hàm băm của ứng dụng, không được hạ cost cho nhanh. Tài khoản băm
  // ở cost khác sẽ so nhanh hoặc chậm hơn dummy hash dùng cho email không tồn tại, và
  // thời gian phản hồi của /auth/login sẽ tiết lộ email nào có thật.
  const passwordHash = await hashPassword(DEV_PASSWORD);

  // --- users ---------------------------------------------------------------
  //
  // Khoá theo email chứ không theo ID cố định: ba tài khoản @learnova.local có thể
  // đã tồn tại từ bản seed cũ với UUID ngẫu nhiên. Upsert theo email giữ nguyên
  // hàng cũ, rồi mọi khoá ngoại phía dưới dùng ID đọc lại được từ database.

  const userIdByEmail = new Map<string, string>();

  async function upsertUser(
    seed: { username: string; email: string; fullName: string },
    role: Role,
    bio: string,
    index: number,
  ): Promise<string> {
    const user = await prisma.user.upsert({
      where: { email: seed.email },
      update: { username: seed.username, role, bio, passwordHash },
      create: {
        username: seed.username,
        email: seed.email,
        passwordHash,
        role,
        bio,
        // Ảnh đại diện sinh từ tên: dịch vụ không cần khoá API và luôn trả về ảnh.
        // Để trống ở một phần tài khoản để giao diện phải xử lý cả nhánh không ảnh.
        avatarUrl:
          index % 3 === 0
            ? null
            : `https://ui-avatars.com/api/?name=${encodeURIComponent(seed.fullName)}&background=4f46e5&color=fff`,
        createdAt: at(-120 + index),
      },
    });

    userIdByEmail.set(seed.email, user.userId);
    return user.userId;
  }

  const adminIds: string[] = [];
  for (const [index, seed] of ADMINS.entries()) {
    adminIds.push(await upsertUser(seed, Role.ADMIN, `${seed.fullName} — tài khoản quản trị.`, index));
  }

  const mentorIds: string[] = [];
  for (const [index, seed] of MENTORS.entries()) {
    const userId = await upsertUser(
      seed,
      Role.MENTOR,
      `${seed.fullName} — ${seed.years} năm kinh nghiệm với ${seed.expertise.join(', ')}.`,
      index + 2,
    );

    await prisma.mentor.upsert({
      where: { userId },
      update: { expertise: seed.expertise, experienceYears: seed.years, isApproved: seed.approved },
      create: {
        userId,
        expertise: seed.expertise,
        experienceYears: seed.years,
        isApproved: seed.approved,
      },
    });

    mentorIds.push(userId);
  }

  const menteeIds: string[] = [];
  for (const [index, seed] of MENTEES.entries()) {
    const userId = await upsertUser(
      seed,
      Role.MENTEE,
      `${seed.fullName} — đang học ở mức ${seed.level.toLowerCase()}.`,
      index + 22,
    );

    await prisma.mentee.upsert({
      where: { userId },
      update: { skillLevel: seed.level },
      create: { userId, skillLevel: seed.level },
    });

    menteeIds.push(userId);
  }

  // Một tài khoản bị vô hiệu hoá, để thử nhánh 403 ACCOUNT_DISABLED khi đăng nhập.
  await prisma.user.update({
    where: { email: MENTEES[19].email },
    data: { isActive: false },
  });

  const allUserIds = [...adminIds, ...mentorIds, ...menteeIds];

  // --- sessions ------------------------------------------------------------
  //
  // Mỗi hàng là một thiết bị đã đăng nhập. Trộn đủ ba trạng thái: còn hiệu lực,
  // đã thu hồi và đã hết hạn, để truy vấn dọn phiên có cái mà lọc.

  const DEVICES = [
    { name: 'Chrome trên Windows', agent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/131.0' },
    { name: 'Safari trên macOS', agent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 14_5) Safari/17.5' },
    { name: 'Chrome trên Android', agent: 'Mozilla/5.0 (Linux; Android 14; Pixel 8) Chrome/131.0' },
    { name: 'Safari trên iPhone', agent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_1) Safari/18.1' },
    { name: 'Firefox trên Ubuntu', agent: 'Mozilla/5.0 (X11; Ubuntu; Linux x86_64) Firefox/133.0' },
  ];

  for (let i = 0; i < 20; i += 1) {
    const device = DEVICES[i % DEVICES.length];
    const revoked = i % 5 === 3;
    const expired = i % 5 === 4;

    // Hạn và mốc dùng cuối nằm cả ở nhánh `update`: chạy lại seed sau vài tuần thì
    // những phiên đáng lẽ còn hiệu lực phải được đẩy hạn ra, không thì chúng lặng
    // lẽ trôi vào nhóm hết hạn.
    const timing = {
      expiresAt: expired ? fromNow(-3) : fromNow(30 - i, -i),
      lastUsedAt: fromNow(-(i % 7), -i),
      revokedAt: revoked ? fromNow(-2) : null,
    };

    await prisma.session.upsert({
      where: { sessionId: seedId(TABLE.session, i) },
      update: { ...timing, userId: allUserIds[i % allUserIds.length] },
      create: {
        sessionId: seedId(TABLE.session, i),
        userId: allUserIds[i % allUserIds.length],
        refreshTokenHash: fakeTokenHash(`seed-refresh-${i}`),
        // Chỉ những phiên đã refresh ít nhất một lần mới có token trước đó.
        previousTokenHash: i % 3 === 0 ? fakeTokenHash(`seed-previous-${i}`) : null,
        deviceName: device.name,
        ipAddress: `10.0.${Math.floor(i / 10)}.${(i % 10) + 20}`,
        userAgent: device.agent,
        ...timing,
        createdAt: fromNow(-30 + i),
      },
    });
  }

  // --- khoá học thật, nạp từ kho tài liệu Markdown -------------------------

  const externalDir = process.env.COURSE_DOCS_DIR ?? DEFAULT_DOCS_DIR;

  const importResult = await importCourses(prisma, {
    externalDir,
    authoredDir: AUTHORED_DOCS_DIR,
    publicBaseUrl: process.env.PUBLIC_BASE_URL ?? 'http://localhost:3000',
    mentorIdByEmail: userIdByEmail,
    reviewerId: adminIds[0],
    publishedAt: at(-58),
  });

  const realCourses = importResult.courses;

  if (realCourses.length === 0) {
    throw new Error(
      `Không nạp được khoá học nào từ "${AUTHORED_DOCS_DIR}" hay "${externalDir}".\n` +
        'Kiểm tra COURSE_DOCS_DIR, và chạy seed từ thư mục gốc của dự án.',
    );
  }

  // --- danh mục kỹ năng -----------------------------------------------------
  //
  // Phải chạy sau importCourses vì nó gắn vào chương có thật. Hai danh sách trả về
  // đều phải rỗng: có chương không kỹ năng nào nhận nghĩa là bài kiểm tra đầu vào
  // sẽ không bao giờ hỏi tới chương đó, còn dòng khai báo trỏ sai nghĩa là gõ nhầm
  // tên thư mục. Cả hai đều phải nổ ngay chứ không được âm thầm trôi qua.
  const skillResult = await importSkills(prisma, realCourses);

  if (skillResult.unknownChapters.length > 0) {
    throw new Error(
      `Khai báo kỹ năng trỏ tới chương không tồn tại:\n  ${skillResult.unknownChapters.join('\n  ')}`,
    );
  }

  if (skillResult.orphanChapters.length > 0) {
    throw new Error(
      `Chương chưa được gán kỹ năng nào:\n  ${skillResult.orphanChapters.join('\n  ')}`,
    );
  }

  // --- khoá học chưa xuất bản ----------------------------------------------

  for (const [index, seed] of DRAFT_COURSES.entries()) {
    const courseId = seedId(TABLE.course, index);

    await prisma.course.upsert({
      where: { courseId },
      update: {
        title: seed.title,
        description: seed.description,
        level: seed.level,
        status: seed.status,
        mentorId: mentorIds[seed.mentor],
        coverImageUrl: null,
      },
      create: {
        courseId,
        mentorId: mentorIds[seed.mentor],
        title: seed.title,
        description: seed.description,
        // Khoá chưa xuất bản chưa cần ảnh bìa — đúng thực tế, và buộc giao diện
        // danh sách phải xử lý được nhánh không có ảnh.
        coverImageUrl: null,
        level: seed.level,
        status: seed.status,
        reviewedById: seed.status === REJECTED ? adminIds[index % adminIds.length] : null,
        reviewedAt: seed.status === REJECTED ? at(-60 + index) : null,
        rejectionReason:
          seed.status === REJECTED
            ? 'Nội dung chưa đạt yêu cầu đào tạo. Vui lòng bổ sung phần thực hành và gửi duyệt lại.'
            : null,
        createdAt: at(-90 + index),
      },
    });
  }

  // --- dọn cấu trúc thừa của bản seed trước --------------------------------
  //
  // Trước đây seed tự sinh 20 khoá, trong đó 10 khoá đầu có chương và bài giả. Bản
  // này chỉ giữ 10 khoá nháp ở đúng những ID đó, còn toàn bộ nội dung đến từ kho
  // tài liệu thật. Hai chỗ phải dọn:
  //
  //   1. Chương giả vẫn bám vào các khoá nháp. Nháp trong fixture này không có nội
  //      dung, nên mọi chương nằm dưới chúng đều là rác. Bài học, mục, câu hỏi và
  //      tiến độ đi theo nhờ onDelete: Cascade.
  //   2. Các khoá ở ô ID từ 10 trở lên — bản này chỉ dùng tới ô thứ 9.
  //
  // Xoá theo ID chứ không theo tiêu đề: hai khoá cũ đã bị bỏ khỏi danh sách fixture
  // nên không còn tiêu đề nào để đối chiếu.

  const draftCourseIds = DRAFT_COURSES.map((_, index) => seedId(TABLE.course, index));

  await prisma.chapter.deleteMany({ where: { courseId: { in: draftCourseIds } } });

  /** Số ô ID dành sẵn cho khoá học. Quét hết dải để bản seed nào từng dùng nhiều
   *  fixture hơn cũng được dọn sạch. */
  const COURSE_ID_SLOTS = 64;

  await prisma.course.deleteMany({
    where: {
      courseId: {
        in: Array.from({ length: COURSE_ID_SLOTS - DRAFT_COURSES.length }, (_, offset) =>
          seedId(TABLE.course, DRAFT_COURSES.length + offset),
        ),
      },
    },
  });

  // --- tài liệu đính kèm bài học -------------------------------------------

  const FILES = [
    { name: 'slide-bai-giang.pdf', type: 'application/pdf', size: 1_842_000 },
    { name: 'ma-nguon-vi-du.zip', type: 'application/zip', size: 524_288 },
    { name: 'bai-tap-thuc-hanh.docx', type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', size: 96_400 },
    { name: 'bang-tra-cuu.xlsx', type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', size: 45_120 },
  ];

  // Bốn bài đầu của mỗi khoá, để khoá nào cũng có tài liệu chứ không dồn hết vào một.
  const documentTargets = realCourses.flatMap((course) => course.lessonIds.slice(0, 4)).slice(0, 20);

  for (const [i, lessonId] of documentTargets.entries()) {
    const file = FILES[i % FILES.length];

    await prisma.lessonDocument.upsert({
      where: { documentId: seedId(TABLE.document, i) },
      update: { lessonId },
      create: {
        documentId: seedId(TABLE.document, i),
        lessonId,
        fileName: file.name,
        fileUrl: `https://cdn.learnova.dev/documents/${i}-${file.name}`,
        fileType: file.type,
        fileSize: file.size,
        createdAt: at(-50 + i),
      },
    });
  }

  // --- ghi danh và tiến độ -------------------------------------------------
  //
  // Mentee thứ m ghi danh khoá (m % 5) nên mỗi khoá có đúng 4 học viên, còn mức độ
  // hoàn thành lấy theo floor(m / 5). Hai phép chia phải độc lập nhau: dùng chung
  // một phép thì mọi học viên của cùng một khoá sẽ có y hệt tiến độ.

  /** Tỉ lệ bài đã hoàn thành, theo nhóm floor(m / 5). */
  const COMPLETION = [0, 0.34, 0.67, 1];

  /** Khoảng chỗ dành cho mỗi lượt ghi danh khi sinh ID tiến độ. Phải lớn hơn số
   *  bài của khoá dài nhất, nếu không hai lượt sẽ tranh nhau một ID. */
  const PROGRESS_STRIDE = 64;

  for (let m = 0; m < MENTEES.length; m += 1) {
    const course = realCourses[m % realCourses.length];
    const ratio = COMPLETION[Math.floor(m / realCourses.length) % COMPLETION.length];

    const total = course.lessonIds.length;
    const completed = Math.round(total * ratio);

    const status =
      completed === total
        ? EnrollmentStatus.COMPLETED
        : completed > 0
          ? EnrollmentStatus.IN_PROGRESS
          : EnrollmentStatus.ENROLLED;

    const enrollmentId = seedId(TABLE.enrollment, m);

    await prisma.enrollment.upsert({
      where: { enrollmentId },
      update: { status, courseId: course.courseId },
      create: {
        enrollmentId,
        courseId: course.courseId,
        menteeId: menteeIds[m],
        status,
        enrolledAt: at(-50 + m),
        completedAt: status === EnrollmentStatus.COMPLETED ? at(-10 + m) : null,
      },
    });

    // Xoá sạch rồi tạo lại thay vì chỉ upsert. `upsert` biết thêm và sửa nhưng
    // không biết dọn: đổi fixture cho một lượt ghi danh từ 3 bài xuống 0 bài thì
    // ba dòng cũ vẫn nằm lại và mâu thuẫn với trạng thái mới. Mọi dòng tiến độ ở
    // đây đều thuộc một enrollment do seed sở hữu nên không đụng dữ liệu người khác.
    await prisma.lessonProgress.deleteMany({ where: { enrollmentId } });

    for (let l = 0; l < total; l += 1) {
      const isCompleted = l < completed;
      // Bài kế tiếp bài cuối cùng đã xong là bài đang xem dở. Lượt ENROLLED
      // (completed === 0) cố tình không có dòng tiến độ nào: "đã ghi danh nhưng
      // chưa học" phải là không có dữ liệu, chứ không phải có một bài xem dở.
      const isCurrent = completed > 0 && l === completed;

      if (!isCompleted && !isCurrent) continue;

      await prisma.lessonProgress.create({
        data: {
          progressId: seedId(TABLE.progress, m * PROGRESS_STRIDE + l),
          enrollmentId,
          lessonId: course.lessonIds[l],
          isCompleted,
          lastPositionSeconds: isCompleted ? 0 : 120 + ((m * 37 + l * 11) % 600),
          completedAt: isCompleted ? at(-45 + m + l) : null,
        },
      });
    }
  }

  // --- hội thoại -----------------------------------------------------------
  //
  // Một hội thoại nhóm cho mỗi khoá thật (mentor + 4 học viên đã ghi danh), cộng
  // 15 hội thoại riêng tư 1-1.

  const PRIVATE_COUNT = 15;
  const CONVERSATION_SLOTS = 64;
  const conversationCount = realCourses.length + PRIVATE_COUNT;

  // Dọn ô ID không còn dùng tới, rồi giải phóng `directKey` của những ô còn lại.
  //
  // `directKey` có ràng buộc UNIQUE toàn bảng. Số hội thoại nhóm thay đổi theo số
  // khoá thật, nên cùng một cặp mentor–mentee lần này rơi vào ô ID khác lần trước;
  // gán thẳng sẽ đụng chính khoá mà hàng cũ đang giữ. Xoá về null trước là cách
  // duy nhất để đợt gán mới chắc chắn không va vào đợt cũ.
  await prisma.conversation.deleteMany({
    where: {
      conversationId: {
        in: Array.from({ length: CONVERSATION_SLOTS - conversationCount }, (_, offset) =>
          seedId(TABLE.conversation, conversationCount + offset),
        ),
      },
    },
  });

  await prisma.conversation.updateMany({
    where: {
      conversationId: {
        in: Array.from({ length: conversationCount }, (_, index) =>
          seedId(TABLE.conversation, index),
        ),
      },
    },
    data: { directKey: null },
  });

  for (const [c, course] of realCourses.entries()) {
    const conversationId = seedId(TABLE.conversation, c);

    // Học viên của khoá c là những mentee có m % 5 === c — đúng quy tắc ghi danh
    // ở trên, nên nhóm chat luôn khớp với danh sách lớp.
    const members = [
      course.mentorUserId,
      ...menteeIds.filter((_, m) => m % realCourses.length === c),
    ];

    // Nhánh `update` phải nêu đủ type, courseId và directKey. Số hội thoại nhóm
    // thay đổi theo số khoá thật, nên một ô ID từng là COURSE có thể lần này phải
    // là PRIVATE. Để `update` rỗng thì hàng cũ giữ nguyên loại cũ và dữ liệu tự
    // mâu thuẫn với chính nó.
    await prisma.conversation.upsert({
      where: { conversationId },
      update: {
        type: ConversationType.COURSE,
        courseId: course.courseId,
        directKey: null,
      },
      create: {
        conversationId,
        type: ConversationType.COURSE,
        courseId: course.courseId,
        // Nhóm nhiều người không có directKey. Postgres cho phép nhiều NULL trong
        // cột UNIQUE, nên các hàng cùng NULL vẫn hợp lệ.
        directKey: null,
        lastMessageAt: at(-5 + c, 2),
        createdAt: at(-48 + c),
      },
    });

    for (const [position, userId] of members.entries()) {
      await prisma.conversationParticipant.upsert({
        where: { conversationId_userId: { conversationId, userId } },
        update: {},
        create: {
          conversationId,
          userId,
          joinedAt: at(-48 + c, position),
          lastReadAt: position === 0 ? at(-5 + c, 3) : at(-6 + c),
        },
      });
    }

    // Danh sách lớp đổi theo quy tắc ghi danh, nên thành viên của lần chạy trước
    // có thể không còn thuộc về hội thoại này nữa.
    await prisma.conversationParticipant.deleteMany({
      where: { conversationId, userId: { notIn: members } },
    });

    for (let msg = 0; msg < 2; msg += 1) {
      const messageIndex = c * 2 + msg;

      // `senderId` phải có mặt ở nhánh update: danh sách lớp đổi theo số khoá thật,
      // nên người gửi của lần chạy trước có thể không còn trong hội thoại này nữa,
      // và một tin nhắn do người ngoài gửi là dữ liệu vô nghĩa.
      await prisma.message.upsert({
        where: { messageId: seedId(TABLE.message, messageIndex) },
        update: { conversationId, senderId: members[messageIndex % members.length] },
        create: {
          messageId: seedId(TABLE.message, messageIndex),
          conversationId,
          senderId: members[messageIndex % members.length],
          content:
            msg === 0
              ? `Chào cả lớp, buổi trực tuyến tuần này của khoá "${course.title}" bắt đầu lúc 20h nhé.`
              : 'Em đã xem xong chương 1 ạ, phần bài tập em còn vướng câu cuối.',
          messageType: MessageType.TEXT,
          createdAt: at(-5 + c, msg),
        },
      });
    }
  }

  for (let p = 0; p < PRIVATE_COUNT; p += 1) {
    const conversationId = seedId(TABLE.conversation, realCourses.length + p);
    const mentorId = mentorIds[p];
    const menteeId = menteeIds[(p + 5) % menteeIds.length];

    // directKey = min:max. Sắp xếp trước khi nối làm cho A:B và B:A ra cùng một
    // chuỗi, nhờ đó UNIQUE chặn được hội thoại 1-1 trùng lặp.
    const directKey = [mentorId, menteeId].sort().join(':');

    await prisma.conversation.upsert({
      where: { conversationId },
      update: {
        type: ConversationType.PRIVATE,
        courseId: null,
        directKey,
      },
      create: {
        conversationId,
        type: ConversationType.PRIVATE,
        courseId: null,
        directKey,
        lastMessageAt: at(-3 + p, 1),
        createdAt: at(-40 + p),
      },
    });

    for (const [position, userId] of [mentorId, menteeId].entries()) {
      await prisma.conversationParticipant.upsert({
        where: { conversationId_userId: { conversationId, userId } },
        update: {},
        create: {
          conversationId,
          userId,
          joinedAt: at(-40 + p, position),
          lastReadAt: at(-3 + p),
        },
      });
    }

    await prisma.conversationParticipant.deleteMany({
      where: { conversationId, userId: { notIn: [mentorId, menteeId] } },
    });

    for (let msg = 0; msg < 2; msg += 1) {
      const messageIndex = realCourses.length * 2 + p * 2 + msg;

      await prisma.message.upsert({
        where: { messageId: seedId(TABLE.message, messageIndex) },
        update: { conversationId, senderId: msg === 0 ? menteeId : mentorId },
        create: {
          messageId: seedId(TABLE.message, messageIndex),
          conversationId,
          senderId: msg === 0 ? menteeId : mentorId,
          content:
            msg === 0
              ? 'Chào anh/chị, em muốn hỏi thêm về lộ trình học tiếp theo ạ.'
              : 'Chào em, em cứ hoàn thành nốt khoá hiện tại rồi mình bàn bước kế nhé.',
          messageType: MessageType.TEXT,
          createdAt: at(-3 + p, msg),
        },
      });
    }
  }

  // --- phòng họp -----------------------------------------------------------

  const MEETING_STATUSES = [
    MeetingStatus.SCHEDULED,
    MeetingStatus.LIVE,
    MeetingStatus.ENDED,
    MeetingStatus.CANCELLED,
  ];

  for (let i = 0; i < 20; i += 1) {
    const meetingRoomId = seedId(TABLE.meeting, i);
    const status = MEETING_STATUSES[i % MEETING_STATUSES.length];

    // Năm phòng đầu gắn với khoá học thật, mười lăm phòng sau là buổi kèm 1-1
    // không thuộc khoá nào — đúng lý do courseId được khai nullable.
    const course = i < realCourses.length ? realCourses[i] : null;
    const hostId = course ? course.mentorUserId : mentorIds[i % mentorIds.length];

    const start = at(-4 + i, 12);
    const end = new Date(start.getTime() + 90 * 60_000);
    const happened = status === MeetingStatus.ENDED || status === MeetingStatus.LIVE;

    const meetingTitle = course
      ? `Buổi trực tuyến: ${course.title}`
      : `Kèm riêng 1-1 — buổi ${i - realCourses.length + 1}`;

    // `hostId` cũng phải nằm ở nhánh update. Chủ phòng suy ra từ mentor của khoá,
    // mà khoá gắn vào từng ô ID thay đổi khi danh sách khoá thật thay đổi.
    await prisma.meetingRoom.upsert({
      where: { meetingRoomId },
      update: { status, courseId: course?.courseId ?? null, hostId, title: meetingTitle },
      create: {
        meetingRoomId,
        courseId: course?.courseId ?? null,
        hostId,
        title: meetingTitle,
        description: course
          ? 'Buổi giải đáp trực tuyến hàng tuần cho học viên của khoá.'
          : 'Buổi kèm riêng theo yêu cầu của học viên.',
        // Duy nhất, tối đa 20 ký tự.
        meetingCode: `lnv-${String(i + 1).padStart(3, '0')}-${String(1000 + i * 7)}`,
        status,
        scheduledStartAt: start,
        scheduledEndAt: end,
        actualStartAt: happened ? new Date(start.getTime() + 2 * 60_000) : null,
        actualEndAt: status === MeetingStatus.ENDED ? new Date(end.getTime() - 5 * 60_000) : null,
        createdAt: at(-20 + i),
      },
    });

    // Chủ phòng luôn là HOST; thêm hai học viên. Khoá chính là (phòng, người dùng)
    // nên chủ phòng không được lặp lại trong danh sách khách mời.
    const guests = [menteeIds[i % menteeIds.length], menteeIds[(i + 7) % menteeIds.length]];
    const members: Array<{ userId: string; role: MeetingParticipantRole }> = [
      { userId: hostId, role: MeetingParticipantRole.HOST },
      ...guests
        .filter((id) => id !== hostId)
        .map((userId) => ({ userId, role: MeetingParticipantRole.PARTICIPANT })),
    ];

    for (const [position, member] of members.entries()) {
      await prisma.meetingParticipant.upsert({
        where: { meetingRoomId_userId: { meetingRoomId, userId: member.userId } },
        update: { role: member.role },
        create: {
          meetingRoomId,
          userId: member.userId,
          role: member.role,
          invitedAt: at(-18 + i, position),
          // invitedAt ghi ai được mời; joinedAt/leftAt ghi ai thực sự có mặt.
          joinedAt: happened ? new Date(start.getTime() + (position + 1) * 60_000) : null,
          leftAt: status === MeetingStatus.ENDED ? new Date(end.getTime() - 5 * 60_000) : null,
        },
      });
    }

    // Chủ phòng đổi khi danh sách khoá thật đổi, nên chủ cũ phải rời danh sách —
    // nếu không phòng sẽ có hai người mang vai trò HOST.
    await prisma.meetingParticipant.deleteMany({
      where: { meetingRoomId, userId: { notIn: members.map((member) => member.userId) } },
    });
  }

  // --- dọn tàn dư của bản seed trước --------------------------------------
  //
  // Các bản seed trước để khoá chính cho Prisma tự sinh, nên `upsert` theo ID cố
  // định không nhận ra hàng cũ và mỗi lần đổi fixture lại bỏ lại một khoá trùng tên.
  //
  // Điều kiện xoá gồm hai vế: trùng tiêu đề với một fixture hiện tại, VÀ nằm ngoài
  // dải ID mà seed này quản lý. Vế thứ hai là thứ ngăn seed tự xoá chính nó.
  const managedCourseIds = [
    ...realCourses.map((course) => course.courseId),
    ...DRAFT_COURSES.map((_, index) => seedId(TABLE.course, index)),
  ];

  const { count: staleCourses } = await prisma.course.deleteMany({
    where: {
      title: {
        in: [...realCourses.map((course) => course.title), ...DRAFT_COURSES.map((course) => course.title)],
      },
      courseId: { notIn: managedCourseIds },
    },
  });

  // --- dọn tài khoản rác từ các lần thử API -------------------------------
  //
  // Sinh ra bởi script kiểm thử thủ công, không phải dữ liệu của ai. Session của
  // chúng bị xoá theo nhờ onDelete: Cascade.

  const { count: removed } = await prisma.user.deleteMany({
    where: {
      OR: [
        { email: { startsWith: 'fe.test.' } },
        { email: { startsWith: 'flow.' } },
        { email: { startsWith: 'reuse.' } },
      ],
    },
  });

  await report(removed, staleCourses, importResult);
}

async function report(
  removedTestAccounts: number,
  removedStaleCourses: number,
  importResult: Awaited<ReturnType<typeof importCourses>>,
): Promise<void> {
  console.log('\nKhoá học nạp từ tài liệu Markdown:');
  console.table(
    importResult.courses.map((course) => ({
      'khoá học': course.title,
      'chương': course.chapterCount,
      'bài': course.lessonIds.length,
      'phút': course.totalMinutes,
    })),
  );

  if (importResult.skipped.length > 0) {
    console.log('Bỏ qua:', importResult.skipped.join(' | '));
  }

  // Cảnh báo phân tích tài liệu gom hết về đây. Đa số là việc đánh lại số thứ tự
  // cho liên tục — bình thường. Cảnh báo về quiz mới là thứ đáng xem.
  if (importResult.warnings.length > 0) {
    const renumber = importResult.warnings.filter((w) => w.message.includes('đánh lại'));
    const rest = importResult.warnings.filter((w) => !w.message.includes('đánh lại'));

    console.log(`\nCảnh báo khi đọc tài liệu: ${importResult.warnings.length}`);
    if (renumber.length > 0) {
      console.log(`  ${renumber.length} bài được đánh lại số thứ tự cho liên tục`);
    }
    for (const warning of rest) console.log(`  ${warning.file}: ${warning.message}`);
  }

  const counts = {
    users: await prisma.user.count(),
    mentors: await prisma.mentor.count(),
    mentees: await prisma.mentee.count(),
    sessions: await prisma.session.count(),
    courses: await prisma.course.count(),
    chapters: await prisma.chapter.count(),
    lessons: await prisma.lesson.count(),
    lesson_sections: await prisma.lessonSection.count(),
    quiz_questions: await prisma.quizQuestion.count(),
    quiz_options: await prisma.quizOption.count(),
    skills: await prisma.skill.count(),
    skill_chapters: await prisma.skillChapter.count(),
    lesson_documents: await prisma.lessonDocument.count(),
    enrollments: await prisma.enrollment.count(),
    lesson_progress: await prisma.lessonProgress.count(),
    conversations: await prisma.conversation.count(),
    conversation_participants: await prisma.conversationParticipant.count(),
    messages: await prisma.message.count(),
    meeting_rooms: await prisma.meetingRoom.count(),
    meeting_participants: await prisma.meetingParticipant.count(),
  };

  console.log('\nSố bản ghi sau khi seed:');
  console.table(Object.entries(counts).map(([table, rows]) => ({ 'bảng': table, 'số dòng': rows })));

  if (removedTestAccounts > 0) {
    console.log(`Đã xoá ${removedTestAccounts} tài khoản thử nghiệm còn sót.`);
  }

  if (removedStaleCourses > 0) {
    console.log(`Đã xoá ${removedStaleCourses} khoá học trùng tên do bản seed cũ để lại.`);
  }

  console.log('\nTài khoản đăng nhập (mật khẩu chung: %s)', DEV_PASSWORD);
  console.table([
    { 'vai trò': 'ADMIN', email: 'admin@learnova.local' },
    { 'vai trò': 'MENTOR', email: 'mentor@learnova.local' },
    { 'vai trò': 'MENTEE', email: 'mentee@learnova.local' },
    { 'vai trò': 'MENTEE (đã khoá)', email: MENTEES[19].email },
  ]);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
