import { plainToInstance } from 'class-transformer';
import {
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsString,
  IsUrl,
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

  @ValidateIf(hasAnySupabaseVar)
  @IsUrl({ require_tld: false })
  SUPABASE_URL?: string;

  /// service_role key, KHONG phai anon key: anon key bi RLS chan, khong ky duoc URL
  /// upload. Key nay tuong duong quyen quan tri du an Supabase — chi de o server.
  @ValidateIf(hasAnySupabaseVar)
  @IsString()
  @IsNotEmpty()
  SUPABASE_SERVICE_ROLE_KEY?: string;

  @ValidateIf(hasAnySupabaseVar)
  @IsString()
  @IsNotEmpty()
  SUPABASE_BUCKET?: string;
}

/** True khi ít nhất một biến Supabase được điền — nghĩa là người dùng ĐỊNH bật tính
 *  năng này, nên cả ba biến phải hợp lệ. Chuỗi rỗng tính là chưa điền: đó là thứ một
 *  dòng `SUPABASE_URL=` bỏ dở trong .env tạo ra. */
function hasAnySupabaseVar(env: EnvVars): boolean {
  return [
    env.SUPABASE_URL,
    env.SUPABASE_SERVICE_ROLE_KEY,
    env.SUPABASE_BUCKET,
  ].some((value) => typeof value === 'string' && value.length > 0);
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
