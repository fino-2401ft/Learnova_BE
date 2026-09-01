import { Injectable } from '@nestjs/common';
import { StorageProvider } from '@prisma/client';

import { buildStorageKey, providerFor } from './attachment.policy';
import { CloudinaryService } from './cloudinary.service';
import { SupabaseStorageService } from './supabase-storage.service';
import { AttachmentKind, StoredObject, UploadTarget } from './storage.types';

/** What a caller gets back after asking for somewhere to put a file. */
export interface PreparedUpload {
  provider: StorageProvider;
  /** `public_id` (Cloudinary) or object path (Supabase). Goes into the upload ticket
   *  and later into `Message.storageKey`. */
  storageKey: string;
  /** The filename after sanitising — what the recipient will see and download. */
  fileName: string;
  target: UploadTarget;
}

/**
 * One door in front of the two storage back-ends.
 *
 * Everything above this line — the chat service, the controller — decides WHAT to
 * store and never WHERE. The routing rule (images and video to Cloudinary, the rest to
 * Supabase) lives in attachment.policy.ts and is applied here, so adding a third
 * provider, or moving raw files off Supabase, touches these two files and nothing else.
 */
@Injectable()
export class StorageService {
  constructor(
    private readonly cloudinary: CloudinaryService,
    private readonly supabase: SupabaseStorageService,
  ) {}

  /** Pick a home for the file and mint the credentials the browser uploads with. */
  async prepareUpload(
    conversationId: string,
    kind: AttachmentKind,
    fileName: string,
  ): Promise<PreparedUpload> {
    const { dir, safeFileName } = buildStorageKey(conversationId, fileName);
    const provider = providerFor(kind);

    if (provider === StorageProvider.CLOUDINARY) {
      const target = this.cloudinary.signUpload(kind, dir);

      return {
        provider,
        storageKey: target.publicId,
        fileName: safeFileName,
        target,
      };
    }

    const path = `${dir}/${safeFileName}`;
    const target = await this.supabase.createUploadTarget(path);

    return { provider, storageKey: path, fileName: safeFileName, target };
  }

  /** What the provider is actually holding, or null if the upload never landed. */
  describe(
    provider: StorageProvider,
    storageKey: string,
    kind: AttachmentKind,
  ): Promise<StoredObject | null> {
    return provider === StorageProvider.CLOUDINARY
      ? this.cloudinary.describe(storageKey, kind)
      : this.supabase.describe(storageKey);
  }

  /** Best-effort delete. Neither branch throws — see the note on CloudinaryService. */
  destroy(
    provider: StorageProvider,
    storageKey: string,
    kind: AttachmentKind,
  ): Promise<void> {
    return provider === StorageProvider.CLOUDINARY
      ? this.cloudinary.destroy(storageKey, kind)
      : this.supabase.destroy(storageKey);
  }
}
