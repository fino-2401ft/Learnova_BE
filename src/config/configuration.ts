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

/**
 * Truy cap Supabase Storage bang giao thuc S3.
 *
 * KHAC voi SupabaseConfig o tren: cai kia dung service_role key qua thu vien
 * @supabase/supabase-js, dung cho file dinh kem cua chat. Cai nay la cap khoa
 * S3-compatible RIENG (Storage → S3 Access Keys), va no ton tai vi mot ly do cu the:
 * LiveKit Egress tu tai file ghi hinh len kho luu tru, va no chi noi duoc giao thuc
 * S3. Backend khong dung cap khoa nay de doc ghi gi ca — no chi chuyen tiep xuong
 * LiveKit trong lenh bat dau ghi hinh.
 */
export interface SupabaseS3Config {
  accessKeyId: string;
  secretAccessKey: string;
  /** Vi du ap-southeast-1. Xem Storage → Settings tren dashboard. */
  region: string;
  /** Bucket chua video ghi hinh. Tach khoi bucket file chat: video nang hon nhieu
   *  bac, va tach ra thi doi chinh sach luu tru cua rieng no duoc. */
  bucket: string;
}

export interface StorageConfig {
  cloudinary: CloudinaryConfig;

  /**
   * Dia chi du an Supabase, DUNG RIENG khong kem theo khoa nao.
   *
   * Tach ra vi hai tinh nang doc no mot cach doc lap: dinh kem file trong chat can
   * `supabase` ben duoi (co service_role key), con ghi hinh chi can dia chi nay cong
   * cap khoa S3. Gop chung se bat nguoi dung phai dien service_role key va bucket cua
   * chat chi de bat ghi hinh — hai thu chang lien quan gi toi nhau.
   */
  supabaseUrl: string | null;

  /** `null` khi chua cau hinh Supabase. Hop le, va la trang thai mac dinh: gui anh
   *  va video van chay, chi rieng gui file thuong bao 503. */
  supabase: SupabaseConfig | null;
  /** `null` khi chua cau hinh cap khoa S3. Ghi hinh se bao 503; moi thu khac chay. */
  supabaseS3: SupabaseS3Config | null;
}

/**
 * LiveKit — SFU cho phong hop.
 *
 * Client-server chu khong phai P2P: moi luong video di qua may chu LiveKit roi phat
 * lai. Bat buoc phai vay khi co chia se man hinh cho nhieu nguoi, va la dieu kien de
 * ghi hinh phia server o dot 2 — P2P thi khong co cho nao dat may ghi.
 */
export interface LivekitConfig {
  /** wss://<project>.livekit.cloud — client dung de ket noi. */
  url: string;
  apiKey: string;
  /** Chi dung o server de ky access token. KHONG BAO GIO gui xuong client. */
  apiSecret: string;
}

export interface Configuration {
  app: AppConfig;
  auth: AuthConfig;
  storage: StorageConfig;
  /** `null` khi chua cau hinh LiveKit. Hop le: moi thu khac van chay, chi vao phong
   *  hop moi bao 503. */
  livekit: LivekitConfig | null;
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
      supabaseUrl: process.env.SUPABASE_URL ?? null,
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
      supabaseS3:
        process.env.SUPABASE_S3_ACCESS_KEY_ID &&
        process.env.SUPABASE_S3_SECRET_ACCESS_KEY &&
        process.env.SUPABASE_S3_REGION &&
        process.env.SUPABASE_RECORDING_BUCKET
          ? {
              accessKeyId: process.env.SUPABASE_S3_ACCESS_KEY_ID,
              secretAccessKey: process.env.SUPABASE_S3_SECRET_ACCESS_KEY,
              region: process.env.SUPABASE_S3_REGION,
              bucket: process.env.SUPABASE_RECORDING_BUCKET,
            }
          : null,
    },
    // env.validation.ts bao dam: hoac ca ba deu co, hoac khong bien nao co.
    livekit:
      process.env.LIVEKIT_URL &&
      process.env.LIVEKIT_API_KEY &&
      process.env.LIVEKIT_API_SECRET
        ? {
            url: process.env.LIVEKIT_URL,
            apiKey: process.env.LIVEKIT_API_KEY,
            apiSecret: process.env.LIVEKIT_API_SECRET,
          }
        : null,
  };
};
