import { plainToInstance } from 'class-transformer';
import {
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsString,
  IsUrl,
  Matches,
  Max,
  Min,
  MinLength,
  ValidateIf,
  validateSync,
} from 'class-validator';

/** Validates environment variables at startup so a missing or malformed value kills
 *  the process immediately, instead of surfacing later as a library-level error like
 *  "jwt secret must be a string" that nobody traces back to a missing .env line. */

export enum NodeEnv {
  Development = 'development',
  Production = 'production',
  Test = 'test',
}

class EnvVars {
  @IsEnum(NodeEnv)
  NODE_ENV: NodeEnv;

  @IsInt()
  @Min(1)
  @Max(65535)
  PORT: number;

  @IsUrl({ require_tld: false })
  CORS_ORIGIN: string;

  /// Goc cong khai cua chinh API nay. Duoc ghep vao truoc duong dan cua file tinh
  /// (anh cover khoa hoc) truoc khi luu URL vao database.
  @IsUrl({ require_tld: false })
  PUBLIC_BASE_URL: string;

  @IsString()
  @IsNotEmpty()
  DATABASE_URL: string;

  // 32 chars is the sane floor for HMAC-SHA256. Shorter secrets are guessable.
  @IsString()
  @MinLength(32, {
    message:
      "JWT_ACCESS_SECRET must be at least 32 characters. Generate one with: node -e \"console.log(require('crypto').randomBytes(48).toString('base64url'))\"",
  })
  JWT_ACCESS_SECRET: string;

  @IsInt()
  @Min(60)
  @Max(3600)
  JWT_ACCESS_TTL: number;

  @IsInt()
  @Min(3600)
  REFRESH_TTL: number;

  @IsString()
  @IsNotEmpty()
  REFRESH_COOKIE_NAME: string;

  // --- Luu tru file dinh kem cua chat ---
  //
  // Cloudinary la bat buoc, khong @IsOptional. Thieu mot bien o day thi tinh nang
  // gui anh im lang hong: nguoi dung chon anh, chờ, roi nhan mot loi 500 khong noi
  // len dieu gi. Chan ngay luc khoi dong dat loi vao dung cho no thuoc ve — file
  // .env — thay vi vao mot request giua gio cao diem.

  @IsString()
  @IsNotEmpty()
  CLOUDINARY_CLOUD_NAME: string;

  @IsString()
  @IsNotEmpty()
  CLOUDINARY_API_KEY: string;

  @IsString()
  @IsNotEmpty()
  CLOUDINARY_API_SECRET: string;

  // Supabase thi khong. Bo trong ca ba bien duoi day la mot lua chon hop le: API van
  // chay, gui anh va video van hoat dong, chi rieng gui file thuong tra ve 503.
  //
  // Nhung phai bo trong CA BA. @ValidateIf duoi day doc ca ba bien, nen dien mot
  // hoac hai bien se lam qua trinh khoi dong that bai thay vi lang le coi nhu chua
  // cau hinh — mot cau hinh do dang la thu kho lan ra nhat: tinh nang tat, khong ai
  // biet vi sao, va bien da dien nam ngay do trong .env nhu mot bang chung sai.

  /**
   * GOC cua project, khong kem duong dan. Vi du: https://abcdefgh.supabase.co
   *
   * Regex chan duong dan chu khong chi kiem tra "co phai URL khong", va do la mot cai
   * bay co that: trang Storage → Settings tren dashboard hien san mot o "Endpoint" ghi
   * https://<ref>.storage.supabase.co/storage/v1/s3 — rat de dan nham vao day. Code
   * TU GHEP /storage/v1/s3 va /storage/v1/object/public/..., nen mot gia tri co san
   * duong dan se tao ra .../storage/v1/s3/storage/v1/s3 va that bai im lang o phia
   * LiveKit.
   *
   * Khong ep phai la .supabase.co: Supabase tu host duoc, va chan theo ten mien se
   * lam hong nhung cai dat do ma khong duoc gi them.
   */
  @ValidateIf(hasAnySupabaseVar)
  @Matches(/^https?:\/\/[^/]+\/?$/, {
    message:
      'SUPABASE_URL phải là GỐC của project (ví dụ https://abcdefgh.supabase.co), ' +
      'không kèm đường dẫn. Ô "Endpoint" ở Storage → Settings KHÔNG phải giá trị của ' +
      'biến này — lấy "Project URL" ở Project Settings → Data API.',
  })
  SUPABASE_URL?: string;

  /// service_role key, KHONG phai anon key: anon key bi RLS chan, khong ky duoc URL
  /// upload. Key nay tuong duong quyen quan tri du an Supabase — chi de o server.
  @ValidateIf(hasAnyChatStorageVar)
  @IsString()
  @IsNotEmpty()
  SUPABASE_SERVICE_ROLE_KEY?: string;

  @ValidateIf(hasAnyChatStorageVar)
  @IsString()
  @IsNotEmpty()
  SUPABASE_BUCKET?: string;

  // --- LiveKit: SFU cho phong hop ---
  //
  // Tuy chon, theo dung khuon cua Supabase o tren: bo trong ca ba thi API van chay
  // binh thuong, chi rieng viec vao phong hop tra ve 503 kem loi nhan giai thich.
  // Nho vay phan chat va khoa hoc khong bi chan boot chi vi chua dang ky LiveKit.
  //
  // Va cung nhu Supabase: dien MOT hoac HAI bien la khoi dong that bai, chu khong
  // lang le coi nhu chua cau hinh.

  // GHI CHU: SUPABASE_URL o tren duoc DUNG CHUNG boi hai tinh nang doc lap —
  // dinh kem file trong chat, va ghi hinh buoi hop. Rang buoc cua no nam o
  // `hasAnySupabaseVar`, von doc ca cac bien S3 ben duoi.

  /// Dang wss://<project>.livekit.cloud. Khong dung @IsUrl vi validator do mac dinh
  /// chi chap nhan http/https/ftp — dia chi WebSocket se bi tu choi oan.
  @ValidateIf(hasAnyLivekitVar)
  @Matches(/^wss?:\/\/.+/, {
    message: 'LIVEKIT_URL phải bắt đầu bằng wss:// (hoặc ws:// khi chạy local)',
  })
  LIVEKIT_URL?: string;

  @ValidateIf(hasAnyLivekitVar)
  @IsString()
  @IsNotEmpty()
  LIVEKIT_API_KEY?: string;

  /// Bi mat ky access token vao phong. Chi de o server.
  @ValidateIf(hasAnyLivekitVar)
  @IsString()
  @IsNotEmpty()
  LIVEKIT_API_SECRET?: string;

  // --- Supabase S3: dich tai len cua ghi hinh ---
  //
  // Tuy chon, cung khuon "ca bon hoac khong bien nao". Thieu thi ghi hinh bao 503,
  // moi thu khac — ke ca hop truc tuyen — van chay binh thuong.
  //
  // Day la cap khoa S3-compatible RIENG, khong phai service_role key: LiveKit Egress
  // tu tai file len kho luu tru va no chi noi duoc giao thuc S3.
  // Lay o Supabase → Storage → S3 Access Keys.

  @ValidateIf(hasAnyS3Var)
  @IsString()
  @IsNotEmpty()
  SUPABASE_S3_ACCESS_KEY_ID?: string;

  @ValidateIf(hasAnyS3Var)
  @IsString()
  @IsNotEmpty()
  SUPABASE_S3_SECRET_ACCESS_KEY?: string;

  @ValidateIf(hasAnyS3Var)
  @IsString()
  @IsNotEmpty()
  SUPABASE_S3_REGION?: string;

  @ValidateIf(hasAnyS3Var)
  @IsString()
  @IsNotEmpty()
  SUPABASE_RECORDING_BUCKET?: string;
}

/**
 * SUPABASE_URL bat buoc khi bat BAT KY tinh nang nao dung toi Supabase.
 *
 * Doc ca bien S3 o duoi, va do la diem quan trong: ghi hinh chi can URL cong cap khoa
 * S3, khong can service_role key. Neu ham nay chi doc bo ba dinh kem-chat thi dien
 * khoa S3 ma quen URL se qua duoc validate, roi ghi hinh im lang bao 503 — dung loai
 * loi kho lan ra nhat.
 */
function hasAnySupabaseVar(env: EnvVars): boolean {
  return (
    filled(
      env.SUPABASE_URL,
      env.SUPABASE_SERVICE_ROLE_KEY,
      env.SUPABASE_BUCKET,
    ) || hasAnyS3Var(env)
  );
}

/** service_role key va bucket di THANH CAP, va chi phuc vu dinh kem file trong chat.
 *  Tach khoi SUPABASE_URL de nguoi chi muon ghi hinh khong phai dien chung. */
function hasAnyChatStorageVar(env: EnvVars): boolean {
  return filled(env.SUPABASE_SERVICE_ROLE_KEY, env.SUPABASE_BUCKET);
}

/** Cùng lý do như Supabase: điền một nửa còn tệ hơn không điền gì. */
function hasAnyLivekitVar(env: EnvVars): boolean {
  return filled(env.LIVEKIT_URL, env.LIVEKIT_API_KEY, env.LIVEKIT_API_SECRET);
}

function hasAnyS3Var(env: EnvVars): boolean {
  return filled(
    env.SUPABASE_S3_ACCESS_KEY_ID,
    env.SUPABASE_S3_SECRET_ACCESS_KEY,
    env.SUPABASE_S3_REGION,
    env.SUPABASE_RECORDING_BUCKET,
  );
}

/** Chuỗi rỗng tính là chưa điền: đó là thứ một dòng `FOO=` bỏ dở trong .env tạo ra. */
function filled(...values: (string | undefined)[]): boolean {
  return values.some((value) => typeof value === 'string' && value.length > 0);
}

export function validateEnv(raw: Record<string, unknown>): EnvVars {
  const parsed = plainToInstance(EnvVars, raw, {
    // Env values are always strings; without this PORT="3000" fails @IsInt.
    enableImplicitConversion: true,
  });

  const errors = validateSync(parsed, { skipMissingProperties: false });

  if (errors.length > 0) {
    const details = errors
      .map(
        (e) =>
          `  - ${e.property}: ${Object.values(e.constraints ?? {}).join(', ')}`,
      )
      .join('\n');

    throw new Error(
      `Invalid environment configuration:\n${details}\n\nCompare against .env.example`,
    );
  }

  return parsed;
}
