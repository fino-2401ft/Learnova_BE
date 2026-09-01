import { MessageType, StorageProvider } from '@prisma/client';
import { randomUUID } from 'node:crypto';
import { extname } from 'node:path';

import { AttachmentKind } from './storage.types';

/**
 * Every rule about what may be uploaded, and where it goes, in one file.
 *
 * Pure functions on purpose — no injected config, no I/O. The rules are the part most
 * likely to be argued over and changed ("cho gửi file 50MB được không?"), and keeping
 * them free of Nest wiring means they can be read, reviewed and unit-tested without
 * standing up a module.
 */

/** MIME types accepted for each kind of attachment.
 *
 *  An allowlist, never a blocklist. A blocklist of dangerous extensions is a losing
 *  game — the interesting ones are the extensions nobody thought of, and a chat where
 *  a mentor can hand a mentee an .exe is a malware channel with a nice UI. */
const ALLOWED_MIME: Readonly<Record<AttachmentKind, readonly string[]>> = {
  [MessageType.IMAGE]: [
    'image/jpeg',
    'image/png',
    'image/webp',
    'image/gif',
    'image/avif',
    // iPhone chụp ra .heic. Cloudinary chuyển được sang jpeg khi phục vụ.
    'image/heic',
    'image/heif',
  ],
  [MessageType.VIDEO]: ['video/mp4', 'video/webm', 'video/quicktime'],
  [MessageType.FILE]: [
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'application/vnd.ms-powerpoint',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    'text/plain',
    'text/csv',
    'text/markdown',
    'application/json',
    'application/zip',
    'application/x-zip-compressed',
    'application/vnd.rar',
    'application/x-rar-compressed',
    'application/x-7z-compressed',
  ],
} as const;

/** Hạn mức kích thước, theo byte.
 *
 *  Ảnh 10MB khớp trần của gói Cloudinary miễn phí, nên vượt mức sẽ bị chặn ở đây với
 *  một thông báo đọc được, thay vì bị Cloudinary trả về lỗi giữa chừng lúc tải lên. */
const MAX_BYTES: Readonly<Record<AttachmentKind, number>> = {
  [MessageType.IMAGE]: 10 * 1024 * 1024,
  [MessageType.VIDEO]: 100 * 1024 * 1024,
  [MessageType.FILE]: 25 * 1024 * 1024,
} as const;

/** Cloudinary cho ảnh và video: có CDN, có transform, sinh sẵn ảnh xem trước.
 *  Supabase cho phần còn lại — Cloudinary tính "credit" theo băng thông và biến đổi,
 *  thứ mà một file zip 25MB không dùng tới nhưng vẫn bị tính. */
const PROVIDER: Readonly<Record<AttachmentKind, StorageProvider>> = {
  [MessageType.IMAGE]: StorageProvider.CLOUDINARY,
  [MessageType.VIDEO]: StorageProvider.CLOUDINARY,
  [MessageType.FILE]: StorageProvider.SUPABASE,
} as const;

/** How long a signed upload target stays usable, in seconds.
 *
 *  Long enough for a 100MB video on a slow connection, short enough that a ticket
 *  captured from a browser's network tab is worthless by the time anyone finds it. */
export const UPLOAD_TICKET_TTL_SECONDS = 15 * 60;

/** Which kind of attachment a MIME type maps to, or null when it is not allowed. */
export function classifyMime(mimeType: string): AttachmentKind | null {
  // Trình duyệt gửi kèm charset với vài loại: "text/csv;charset=utf-8".
  const normalised = mimeType.split(';')[0].trim().toLowerCase();

  for (const kind of Object.keys(ALLOWED_MIME) as AttachmentKind[]) {
    if (ALLOWED_MIME[kind].includes(normalised)) return kind;
  }

  return null;
}

export function maxBytesFor(kind: AttachmentKind): number {
  return MAX_BYTES[kind];
}

export function providerFor(kind: AttachmentKind): StorageProvider {
  return PROVIDER[kind];
}

/** Human-readable cap, for the message that goes back to the composer. */
export function formatMegabytes(bytes: number): string {
  return `${Math.round(bytes / (1024 * 1024))}MB`;
}

/**
 * Strip a user-supplied filename down to something safe to put in a URL path.
 *
 * The name arrives from the client and ends up as the last segment of a Supabase
 * object path, so it must not be able to escape its folder (`../../`), start a query
 * string, or carry control characters. Anything outside a conservative set becomes a
 * hyphen; the extension is preserved because that is what makes the browser open a
 * downloaded file with the right application.
 */
export function sanitiseFileName(fileName: string): string {
  // basename() alone is not enough: it is platform-aware, and on Linux it happily
  // keeps a backslash, which Windows clients do send.
  const base = fileName.replace(/^.*[\\/]/, '').trim();
  const ext = extname(base).slice(0, 12);
  const stem = ext ? base.slice(0, -ext.length) : base;

  const safeStem =
    stem
      // NFKD tách "ế" thành "e" + dấu rời, replace ngay dưới bỏ phần dấu rời đi.
      // Không có bước này thì mọi tên file tiếng Việt biến thành một chuỗi gạch nối.
      .normalize('NFKD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-zA-Z0-9._-]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .slice(0, 80) || 'file';

  return `${safeStem}${ext.replace(/[^a-zA-Z0-9.]/g, '')}`;
}

/**
 * The folder the file will live in: `<conversationId>/<uuid>`.
 *
 * The UUID is what makes the URL unguessable, which matters because both buckets serve
 * publicly: knowing a conversation id must not be enough to enumerate the files inside
 * it. It also means two people uploading `bao-cao.pdf` in the same thread never
 * collide, and — because the segment is fresh on every signing call — a stolen upload
 * target can only ever overwrite its own dead-end folder, never someone else's file.
 *
 * The filename comes back separately rather than already joined on, because the two
 * providers want it in different places: Supabase makes it the last path segment (so
 * the browser downloads `bao-cao.pdf`, not a UUID), while Cloudinary must NOT see it —
 * a `public_id` ending in `.pdf` gets a second extension appended from the detected
 * format, and the file ends up served as `bao-cao.pdf.pdf`.
 */
export function buildStorageKey(
  conversationId: string,
  fileName: string,
): { dir: string; safeFileName: string } {
  return {
    dir: `${conversationId}/${randomUUID()}`,
    safeFileName: sanitiseFileName(fileName),
  };
}
