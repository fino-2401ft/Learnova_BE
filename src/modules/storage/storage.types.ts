import { MessageType, StorageProvider } from '@prisma/client';

/** The three MessageType values that carry a file. TEXT is deliberately excluded so
 *  a switch over this type cannot forget to handle it. */
export type AttachmentKind =
  typeof MessageType.IMAGE | typeof MessageType.VIDEO | typeof MessageType.FILE;

/**
 * Everything the browser needs to POST the bytes straight to Cloudinary.
 *
 * The client builds a multipart form with exactly these fields plus `file`, and sends
 * it to `uploadUrl`. `signature` is an HMAC of the other signed fields made with the
 * API secret, which is why the secret itself never leaves the server: Cloudinary
 * accepts the upload because the signature proves we authorised THESE parameters —
 * this public_id, this timestamp — and nothing else.
 */
export interface CloudinaryUploadTarget {
  provider: typeof StorageProvider.CLOUDINARY;
  uploadUrl: string;
  apiKey: string;
  /** Unix seconds. Cloudinary rejects a signature older than one hour. */
  timestamp: number;
  publicId: string;
  signature: string;
}

/**
 * Supabase issues a one-shot upload URL instead of a signature.
 *
 * The client can either PUT the raw bytes at `uploadUrl`, or — simpler if it already
 * has the Supabase JS client — call
 * `supabase.storage.from(bucket).uploadToSignedUrl(path, token, file)`.
 */
export interface SupabaseUploadTarget {
  provider: typeof StorageProvider.SUPABASE;
  uploadUrl: string;
  token: string;
  path: string;
  bucket: string;
}

export type UploadTarget = CloudinaryUploadTarget | SupabaseUploadTarget;

/**
 * What the provider reports about a file that has actually landed.
 *
 * Read back from the provider AFTER the client says it finished uploading, never
 * taken from the client. In a direct-upload flow the browser talks to Cloudinary and
 * Supabase without passing through this API, so the numbers it reports are a claim,
 * not a fact — a modified client can announce a 2KB text file and upload 500MB of
 * video. This struct is the fact.
 */
export interface StoredObject {
  /** Publicly reachable URL. Goes straight into `Message.content`. */
  url: string;
  sizeBytes: number;
  mimeType: string;
  /** Cloudinary-generated preview. Null for Supabase — it has no transform pipeline. */
  thumbnailUrl: string | null;
}
