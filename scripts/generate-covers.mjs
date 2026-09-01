import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

/**
 * Sinh ảnh cover cho các khoá học demo, ghi ra public/covers/*.svg.
 *
 * Chọn SVG thay vì PNG/JPG vì ba lý do:
 *
 *   1. Không cần thư viện xử lý ảnh nào — Node thuần ghi ra text.
 *   2. File chỉ ~2 KB nhưng sắc nét ở mọi độ phân giải, kể cả màn Retina.
 *   3. Sửa màu hay chữ là sửa file này rồi chạy lại, không phải mở trình thiết kế.
 *
 * Tất cả nằm gọn trong một file: không dùng font ngoài, không ảnh nhúng. Font chữ
 * lấy theo ngăn xếp hệ thống, nên máy nào cũng hiển thị được mà không phải tải về.
 *
 * Chạy: npm run assets:covers
 */

const HERE = dirname(fileURLToPath(import.meta.url));
const OUT_DIR = join(HERE, '..', 'public', 'covers');

/** Kích thước chuẩn của ảnh chia sẻ mạng xã hội. Dùng luôn cho cover để sau này
 *  gắn thẻ Open Graph không phải sinh lại bộ ảnh thứ hai. */
const WIDTH = 1200;
const HEIGHT = 630;

/**
 * Màu lấy theo bộ nhận diện thật của từng công nghệ — người học nhìn là nhận ra
 * ngay, không cần đọc chữ.
 */
const COVERS = [
  {
    slug: 'javascript',
    title: 'JavaScript',
    tagline: 'Nền tảng của mọi thứ chạy trên web',
    monogram: 'JS',
    from: '#D6A319',
    to: '#3D2E05',
    accent: '#F7DF7E',
  },
  {
    slug: 'typescript',
    title: 'TypeScript',
    tagline: 'Hệ thống kiểu tĩnh cho JavaScript',
    monogram: 'TS',
    from: '#3178C6',
    to: '#17335C',
    accent: '#8CBEF5',
  },
  {
    slug: 'nodejs',
    title: 'Node.js',
    tagline: 'JavaScript phía máy chủ',
    monogram: 'JS',
    from: '#5FA04E',
    to: '#17331A',
    accent: '#A7DE96',
  },
  {
    slug: 'expressjs',
    title: 'Express.js',
    tagline: 'Khung web tối giản cho Node',
    monogram: 'EX',
    from: '#475569',
    to: '#111827',
    accent: '#A5B4C4',
  },
  {
    slug: 'database',
    title: 'Database',
    tagline: 'SQL, Prisma va thiet ke du lieu',
    monogram: 'DB',
    from: '#0E7490',
    to: '#06283D',
    accent: '#7DD3E8',
  },
  {
    slug: 'nestjs',
    title: 'NestJS',
    tagline: 'Kiến trúc có kỷ luật cho backend',
    monogram: 'NJ',
    from: '#E0234E',
    to: '#4A0A19',
    accent: '#FF9CB0',
  },
  {
    slug: 'auth-security',
    title: 'Authentication\n& Security',
    tagline: 'Xác thực, phân quyền và phòng thủ',
    monogram: 'ID',
    from: '#6D28D9',
    to: '#20124A',
    accent: '#C4B0F5',
  },
];

/** SVG là XML: năm ký tự này phải escape, nếu không "Authentication & Security"
 *  sẽ làm hỏng cả file. */
function xml(text) {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function render({ slug, title, tagline, monogram, from, to, accent }) {
  const lines = title.split('\n');

  // Tiêu đề neo từ dưới lên: thêm dòng thứ hai thì khối chữ dâng lên trên, còn
  // chân của nó vẫn thẳng hàng với tagline.
  const titleBottom = 396;
  const lineHeight = 82;
  const titleTop = titleBottom - (lines.length - 1) * lineHeight;

  const titleSpans = lines
    .map((line, i) => `<tspan x="80" y="${titleTop + i * lineHeight}">${xml(line)}</tspan>`)
    .join('\n      ');

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${WIDTH}" height="${HEIGHT}" viewBox="0 0 ${WIDTH} ${HEIGHT}" role="img" aria-label="${xml(title.replace('\n', ' '))}">
  <title>${xml(title.replace('\n', ' '))} — Learnova</title>

  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="${from}"/>
      <stop offset="100%" stop-color="${to}"/>
    </linearGradient>

    <!-- Vệt sáng lệch tâm, để nền không phẳng lì như một mảng màu đơn. -->
    <radialGradient id="glow" cx="18%" cy="12%" r="70%">
      <stop offset="0%" stop-color="#ffffff" stop-opacity="0.26"/>
      <stop offset="100%" stop-color="#ffffff" stop-opacity="0"/>
    </radialGradient>

    <pattern id="grid" width="48" height="48" patternUnits="userSpaceOnUse">
      <path d="M48 0H0V48" fill="none" stroke="#ffffff" stroke-opacity="0.06" stroke-width="1"/>
    </pattern>
  </defs>

  <rect width="${WIDTH}" height="${HEIGHT}" fill="url(#bg)"/>
  <rect width="${WIDTH}" height="${HEIGHT}" fill="url(#grid)"/>
  <rect width="${WIDTH}" height="${HEIGHT}" fill="url(#glow)"/>

  <!-- Chữ lồng cỡ lớn, mờ, nằm dưới phần chữ chính. Bị cắt bớt ở mép phải là có
       chủ ý: nó là hoạ tiết nền chứ không phải nội dung cần đọc. -->
  <text x="1150" y="560" text-anchor="end"
        font-family="ui-monospace, 'Cascadia Code', 'JetBrains Mono', Consolas, monospace"
        font-size="300" font-weight="700" fill="#ffffff" fill-opacity="0.07"
        letter-spacing="-12">${xml(monogram)}</text>

  <!-- Dấu ngoặc nhọn, gợi ý đây là khoá học lập trình. -->
  <text x="80" y="560"
        font-family="ui-monospace, 'Cascadia Code', 'JetBrains Mono', Consolas, monospace"
        font-size="52" font-weight="600" fill="${accent}" fill-opacity="0.55">&lt;/&gt;</text>

  <!-- Nhãn thương hiệu -->
  <g transform="translate(80, 74)">
    <rect width="40" height="40" rx="11" fill="#ffffff" fill-opacity="0.16"/>
    <path d="M12 10v18a1 1 0 0 0 1 1h17" fill="none" stroke="#ffffff" stroke-width="3.4"
          stroke-linecap="round" stroke-linejoin="round"/>
    <circle cx="28.5" cy="15" r="3.6" fill="#ffffff"/>
    <text x="58" y="28"
          font-family="'Segoe UI', system-ui, -apple-system, Helvetica, Arial, sans-serif"
          font-size="23" font-weight="700" fill="#ffffff" letter-spacing="3.4">LEARNOVA</text>
  </g>

  <text font-family="'Segoe UI', system-ui, -apple-system, Helvetica, Arial, sans-serif"
        font-size="76" font-weight="700" fill="#ffffff" letter-spacing="-2.2">
      ${titleSpans}
  </text>

  <text x="80" y="452"
        font-family="'Segoe UI', system-ui, -apple-system, Helvetica, Arial, sans-serif"
        font-size="30" font-weight="400" fill="${accent}">${xml(tagline)}</text>

  <rect x="80" y="490" width="132" height="4" rx="2" fill="${accent}" fill-opacity="0.9"/>
</svg>
`;
}

mkdirSync(OUT_DIR, { recursive: true });

for (const cover of COVERS) {
  const file = join(OUT_DIR, `${cover.slug}.svg`);
  writeFileSync(file, render(cover), 'utf8');
  console.log(`  ${cover.slug}.svg`.padEnd(24), `${Buffer.byteLength(render(cover))} B`);
}

console.log(`\nĐã ghi ${COVERS.length} ảnh cover vào public/covers/`);
