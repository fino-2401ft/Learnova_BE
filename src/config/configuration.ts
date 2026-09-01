import { NodeEnv } from './env.validation';

/** Environment variables as one typed object. process.env values are always
 *  `string | undefined`; coercing once here means no call site has to. */

export interface AppConfig {
  nodeEnv: NodeEnv;
  port: number;
  corsOrigin: string;
  /** Goc cong khai cua API, dung de dung URL tuyet doi cho file tinh. */
  publicBaseUrl: string;
  isProduction: boolean;
}

export interface AuthConfig {
  accessSecret: string;
  /** Seconds. */
  accessTtl: number;
  /** Seconds. */
  refreshTtl: number;
  refreshCookieName: string;
}

/** Cloudinary giu anh va video: co CDN, co transform, co thumbnail sinh san. */
export interface CloudinaryConfig {
  cloudName: string;
  apiKey: string;
  /** Chi dung o server de ky yeu cau upload. KHONG BAO GIO gui xuong client. */
  apiSecret: string;
  /** Thu muc goc cua moi file chat tren Cloudinary. */
  folder: string;
}

/** Supabase Storage giu moi loai file con lai: pdf, docx, xlsx, zip... */
export interface SupabaseConfig {
  url: string;
  /** service_role key — bo qua RLS. Chi dung o server. */
  serviceRoleKey: string;
  bucket: string;
}

export interface StorageConfig {
  cloudinary: CloudinaryConfig;
  /** `null` khi chua cau hinh Supabase. Hop le, va la trang thai mac dinh: gui anh
   *  va video van chay, chi rieng gui file thuong bao 503. */
  supabase: SupabaseConfig | null;
}

export interface Configuration {
  app: AppConfig;
  auth: AuthConfig;
  storage: StorageConfig;
}

export const configuration = (): Configuration => {
  const nodeEnv = process.env.NODE_ENV as NodeEnv;

  return {
    app: {
      nodeEnv,
      port: Number(process.env.PORT),
      corsOrigin: process.env.CORS_ORIGIN!,
      publicBaseUrl: process.env.PUBLIC_BASE_URL!,
      isProduction: nodeEnv === NodeEnv.Production,
    },
    auth: {
      accessSecret: process.env.JWT_ACCESS_SECRET!,
      accessTtl: Number(process.env.JWT_ACCESS_TTL),
      refreshTtl: Number(process.env.REFRESH_TTL),
      refreshCookieName: process.env.REFRESH_COOKIE_NAME!,
    },
    storage: {
      cloudinary: {
        cloudName: process.env.CLOUDINARY_CLOUD_NAME!,
        apiKey: process.env.CLOUDINARY_API_KEY!,
        apiSecret: process.env.CLOUDINARY_API_SECRET!,
        // Mac dinh o day chu khong bat buoc trong .env: doi thu muc la lua chon ve
        // cach sap xep tai khoan Cloudinary, khong phai bi mat, va deploy nao khong
        // quan tam thi khong nen bi chan khoi dong vi thieu no.
        folder: process.env.CLOUDINARY_FOLDER ?? 'learnova/chat',
      },
      // env.validation.ts da bao dam: hoac ca ba bien deu co, hoac khong bien nao co.
      // Nen chi can kiem tra mot bien la du de biet tinh nang co duoc bat hay khong —
      // ba dieu kien o day chi de TypeScript thu hep kieu.
      supabase:
        process.env.SUPABASE_URL &&
        process.env.SUPABASE_SERVICE_ROLE_KEY &&
        process.env.SUPABASE_BUCKET
          ? {
              url: process.env.SUPABASE_URL,
              serviceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY,
              bucket: process.env.SUPABASE_BUCKET,
            }
          : null,
    },
  };
};
