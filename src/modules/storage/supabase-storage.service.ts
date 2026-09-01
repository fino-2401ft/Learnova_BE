import {
  Injectable,
  InternalServerErrorException,
  Logger,
  ServiceUnavailableException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { StorageProvider } from '@prisma/client';
import { createClient } from '@supabase/supabase-js';

import { ErrorCode } from '@/common/constants/error-codes';
import { StorageConfig, SupabaseConfig } from '@/config/configuration';
import { StoredObject, SupabaseUploadTarget } from './storage.types';

/**
 * Supabase Storage holds every attachment that is not an image or a video: pdf, docx,
 * xlsx, zip, and so on.
 *
 * Why not Cloudinary for these too — it does accept `resource_type: 'raw'`. Cloudinary
 * bills in "credits" that mix storage, bandwidth and transformations together, and a
 * 25MB zip consumes the same free-tier budget as the images the product actually needs
 * a CDN and a transform pipeline for. Supabase charges plain storage and egress, has a
 * 1GB free tier, and its dashboard makes a stray file easy to find and delete.
 *
 * The bucket must be created as PUBLIC. Its URLs are stored in `messages.content` and
 * re-read months later, while every signed URL Supabase issues expires — a private
 * bucket would leave the database full of dead links. Unguessability comes from the
 * UUID in the path instead, which is how Cloudinary serves images too. See
 * `buildStorageKey` in attachment.policy.ts.
 *
 * OPTIONAL. With no Supabase credentials configured this service stays dormant and
 * every method refuses with a 503; images and video are unaffected because they never
 * come here. That is the state the project ships in today — see .env.example.
 */
@Injectable()
export class SupabaseStorageService {
  private readonly logger = new Logger(SupabaseStorageService.name);
  private readonly config: SupabaseConfig | null;

  // Inferred rather than annotated `SupabaseClient`. The bare name defaults its schema
  // generics to a shape that does not match what createClient() actually returns, and
  // the resulting mismatch is reported as an unsafe `any` assignment.
  private readonly client: ReturnType<typeof createClient> | null;

  constructor(config: ConfigService) {
    this.config = config.get<StorageConfig>('storage')!.supabase;

    if (!this.config) {
      this.client = null;
      // At log level, not warn: this is a configured choice, not a problem. It is
      // logged at all so that "gửi file báo 503" has an answer visible in the boot
      // output rather than requiring someone to go read .env.
      this.logger.log(
        'Supabase chưa cấu hình — gửi ảnh và video vẫn chạy, gửi file thường sẽ báo 503',
      );
      return;
    }

    this.client = createClient(this.config.url, this.config.serviceRoleKey, {
      auth: {
        // This is a server process with a service_role key, not a browser session.
        // Left on, the client would try to persist and silently refresh a session
        // that does not exist, and keep a timer alive that stops Jest from exiting.
        persistSession: false,
        autoRefreshToken: false,
      },
    });
  }

  /**
   * The client and bucket, or a 503 explaining that the feature is switched off.
   *
   * A 503 rather than a 500: nothing is broken and nothing the caller did is wrong —
   * this half of the feature simply is not turned on, and the message says so instead
   * of leaving the composer to report "lỗi hệ thống" for a deliberate configuration.
   */
  private requireClient(): {
    client: ReturnType<typeof createClient>;
    bucket: string;
  } {
    if (!this.client || !this.config) {
      throw new ServiceUnavailableException({
        code: ErrorCode.SERVICE_UNAVAILABLE,
        message:
          'Gửi file đính kèm chưa được bật trên máy chủ này. Hiện chỉ gửi được ảnh và video.',
      });
    }

    return { client: this.client, bucket: this.config.bucket };
  }

  /**
   * Mint a one-shot upload URL for a path this API chose.
   *
   * Supabase's equivalent of a signature: the token is bound to `path`, so a client
   * cannot point its bytes anywhere else, and it is single-use. Upsert stays off — the
   * path contains a fresh UUID, so a second upload to it can only be a replay.
   */
  async createUploadTarget(path: string): Promise<SupabaseUploadTarget> {
    const { client, bucket } = this.requireClient();

    const { data, error } = await client.storage
      .from(bucket)
      .createSignedUploadUrl(path);

    if (error || !data) {
      // A wrong bucket name or an anon key instead of service_role both land here, and
      // both are misconfiguration rather than anything the caller did.
      this.logger.error(
        `Supabase từ chối ký URL upload cho ${path}: ${error?.message ?? 'không rõ lý do'}`,
      );

      throw new InternalServerErrorException({
        message: 'Storage service unavailable',
      });
    }

    return {
      provider: StorageProvider.SUPABASE,
      uploadUrl: data.signedUrl,
      token: data.token,
      path: data.path,
      bucket,
    };
  }

  /**
   * Ask Supabase what is actually stored at `path`, or null if nothing is.
   *
   * Null is the normal answer when a client posts a message for an upload that never
   * finished, so it is a return value rather than an exception.
   */
  async describe(path: string): Promise<StoredObject | null> {
    const { client, bucket } = this.requireClient();

    const { data, error } = await client.storage.from(bucket).info(path);

    if (error || !data) return null;

    const { publicUrl } = client.storage.from(bucket).getPublicUrl(path).data;

    return {
      url: publicUrl,
      // Both are typed optional because older Storage versions omitted them; the
      // `/object/info` endpoint this calls does return them. If one ever is missing,
      // the fallbacks fail OPEN on size — a file whose size cannot be read is not
      // rejected — which is the wrong direction, so it is worth knowing about. Nothing
      // observed it in practice, hence a fallback rather than a hard error.
      sizeBytes: data.size ?? 0,
      mimeType: data.contentType ?? 'application/octet-stream',
      // No transform pipeline on the raw-file side, so nothing to preview with. The
      // UI shows a file-type icon instead.
      thumbnailUrl: null,
    };
  }

  /** Best-effort delete — see the matching note on CloudinaryService.destroy.
   *
   *  Returns quietly when Supabase is switched off: this runs while a user deletes a
   *  message, and there can be no Supabase-backed message to delete in the first place,
   *  so a 503 here would only turn an impossible case into a broken delete button. */
  async destroy(path: string): Promise<void> {
    if (!this.client || !this.config) return;

    const { error } = await this.client.storage
      .from(this.config.bucket)
      .remove([path]);

    if (error) {
      this.logger.warn(
        `Không xoá được ${path} trên Supabase: ${error.message}`,
      );
    }
  }
}
