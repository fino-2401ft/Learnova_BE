import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { MessageType, StorageProvider } from '@prisma/client';
import { v2 as cloudinary } from 'cloudinary';

import { CloudinaryConfig, StorageConfig } from '@/config/configuration';
import {
  AttachmentKind,
  CloudinaryUploadTarget,
  StoredObject,
} from './storage.types';

/** The subset of Cloudinary's Admin API response this code reads. The SDK types
 *  `api.resource()` as `Promise<any>`, so the shape is pinned here instead. */
interface CloudinaryResource {
  public_id: string;
  secure_url: string;
  bytes: number;
  format: string;
  resource_type: string;
}

/**
 * Cloudinary's own error shape. `http_code` is how a missing asset is told apart from
 * a network failure or a bad API key — all three arrive as a thrown plain object, not
 * as an Error, so none of them has a `.message` worth reading.
 *
 * The Admin API nests the status one level down, under `error`, while other paths in
 * the SDK put it at the top. Both are handled: reading only the top level made a
 * missing asset look like an outage, which turned "upload chưa tới nơi" — an ordinary
 * thing that happens when a tab is closed mid-upload — into a 500.
 */
interface CloudinaryError {
  http_code?: number;
  error?: { http_code?: number; message?: string };
}

/**
 * Signs direct browser-to-Cloudinary uploads, and reads back what actually landed.
 *
 * Images and video only. Everything else goes to Supabase — see attachment.policy.ts.
 *
 * Nothing here ever touches the file bytes: the browser POSTs them straight to
 * Cloudinary's upload endpoint using a signature produced by `signUpload`, which keeps
 * a 100MB video off this server's bandwidth entirely.
 */
@Injectable()
export class CloudinaryService implements OnModuleInit {
  private readonly logger = new Logger(CloudinaryService.name);
  private readonly config: CloudinaryConfig;

  constructor(config: ConfigService) {
    this.config = config.get<StorageConfig>('storage')!.cloudinary;
  }

  /**
   * The Cloudinary SDK keeps its credentials in module-level global state rather than
   * in an instance, so this must run once before any call. onModuleInit rather than the
   * constructor: Nest guarantees it has finished for every provider before the first
   * request is served, which the constructor of a lazily-resolved provider does not.
   */
  onModuleInit(): void {
    cloudinary.config({
      cloud_name: this.config.cloudName,
      api_key: this.config.apiKey,
      api_secret: this.config.apiSecret,
      secure: true,
    });
  }

  /**
   * Build the signed parameters the browser needs to upload one file.
   *
   * Only `public_id` and `timestamp` are signed, and both matter. Signing `public_id`
   * pins the upload to the exact path this API chose — a client cannot redirect its
   * bytes over an existing asset. Signing `timestamp` is what gives the target a
   * lifetime: Cloudinary refuses a signature whose timestamp is more than an hour old.
   *
   * What a signature CANNOT do is cap the file size — Cloudinary offers that only
   * through upload presets, which live in the dashboard rather than in this repo, so
   * the real size check happens in `describe()` after the upload instead. That check is
   * the one that counts; anything before it is a claim from the client.
   */
  signUpload(
    kind: AttachmentKind,
    dir: string,
  ): CloudinaryUploadTarget & { publicId: string } {
    const resourceType = this.resourceTypeFor(kind);
    const publicId = `${this.config.folder}/${dir}`;
    const timestamp = Math.floor(Date.now() / 1000);

    const signature = cloudinary.utils.api_sign_request(
      { public_id: publicId, timestamp },
      this.config.apiSecret,
    );

    return {
      provider: StorageProvider.CLOUDINARY,
      uploadUrl: `https://api.cloudinary.com/v1_1/${this.config.cloudName}/${resourceType}/upload`,
      apiKey: this.config.apiKey,
      timestamp,
      publicId,
      signature,
    };
  }

  /**
   * Ask Cloudinary what it actually stored, or null if nothing is there.
   *
   * Null means the client asked to post a message for an upload that never completed —
   * it failed, or it was never attempted. Either way there is no file to talk about.
   */
  async describe(
    publicId: string,
    kind: AttachmentKind,
  ): Promise<StoredObject | null> {
    const resourceType = this.resourceTypeFor(kind);

    let resource: CloudinaryResource;

    try {
      resource = (await cloudinary.api.resource(publicId, {
        resource_type: resourceType,
      })) as CloudinaryResource;
    } catch (error) {
      const failure = error as CloudinaryError;
      const httpCode = failure.error?.http_code ?? failure.http_code;

      if (httpCode === 404) return null;

      // A bad API key or an outage is not the caller's fault and must not be reported
      // as "your upload did not arrive" — rethrow and let the 500 be a 500.
      throw error;
    }

    return {
      url: resource.secure_url,
      sizeBytes: resource.bytes,
      // Cloudinary reports a format ("jpg", "mp4"), not a MIME type. Rebuilding it
      // from the resource type is exact enough for the two families handled here, and
      // is preferable to trusting the value the client declared.
      mimeType: `${resourceType}/${resource.format}`,
      thumbnailUrl: this.thumbnailFor(publicId, kind),
    };
  }

  /**
   * Best-effort delete. Used when a message is withdrawn, and when a file turns out to
   * be over its limit after upload.
   *
   * Never throws: a file left behind on Cloudinary costs storage, while an exception
   * here would fail the user's delete and leave a message they cannot remove on screen.
   * The wrong one to prioritise is obvious, so the failure is logged and swallowed.
   *
   * `invalidate` purges the CDN, but ASYNCHRONOUSLY — measured against a real account,
   * the asset is gone from the Admin API immediately while edge nodes keep serving a
   * cached copy for a few minutes. Inside the product this is invisible: the message
   * becomes a tombstone with `content: null` for everyone at once. It only shows up for
   * someone who copied the raw URL out of the page before the recall, and no
   * client-side call can shorten it.
   */
  async destroy(publicId: string, kind: AttachmentKind): Promise<void> {
    try {
      await cloudinary.uploader.destroy(publicId, {
        resource_type: this.resourceTypeFor(kind),
        // Xoá luôn bản đã nằm trên CDN, không chỉ bản gốc.
        invalidate: true,
      });
    } catch (error) {
      this.logger.warn(
        `Không xoá được ${publicId} trên Cloudinary: ${(error as Error).message}`,
      );
    }
  }

  /** A resized still the chat list can render without pulling the full asset. For a
   *  video this is the first frame — Cloudinary renders it on demand from the URL. */
  private thumbnailFor(publicId: string, kind: AttachmentKind): string {
    const isVideo = kind === MessageType.VIDEO;

    return cloudinary.url(publicId, {
      resource_type: this.resourceTypeFor(kind),
      secure: true,
      // A video's thumbnail is a still, so the delivery extension has to be forced.
      // `fetch_format: 'auto'` is deliberately NOT set alongside it — auto wins over
      // an explicit format and would hand back the video again.
      ...(isVideo ? { format: 'jpg' } : {}),
      transformation: [
        // `limit` never enlarges, so a 100x100 avatar-sized image is left alone.
        { width: 480, height: 480, crop: 'limit' },
        { quality: 'auto', ...(isVideo ? {} : { fetch_format: 'auto' }) },
      ],
    });
  }

  private resourceTypeFor(kind: AttachmentKind): 'image' | 'video' {
    return kind === MessageType.VIDEO ? 'video' : 'image';
  }
}
