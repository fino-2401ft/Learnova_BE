import { MessageType, StorageProvider } from '@prisma/client';

import {
  buildStorageKey,
  classifyMime,
  providerFor,
  sanitiseFileName,
} from './attachment.policy';

/** The routing and sanitising rules are pure functions with no I/O, which is exactly
 *  why they are worth pinning: they decide where a file goes and what its path looks
 *  like, and both are things a later refactor could quietly change. */

describe('classifyMime', () => {
  it('routes each family to its message type', () => {
    expect(classifyMime('image/png')).toBe(MessageType.IMAGE);
    expect(classifyMime('video/mp4')).toBe(MessageType.VIDEO);
    expect(classifyMime('application/pdf')).toBe(MessageType.FILE);
  });

  it('tolerates the parameters browsers append', () => {
    expect(classifyMime('text/csv;charset=utf-8')).toBe(MessageType.FILE);
    expect(classifyMime('IMAGE/PNG')).toBe(MessageType.IMAGE);
  });

  it('refuses anything not on the allowlist', () => {
    expect(classifyMime('application/x-msdownload')).toBeNull();
    expect(classifyMime('application/octet-stream')).toBeNull();
    expect(classifyMime('')).toBeNull();
  });
});

describe('providerFor', () => {
  it('sends media to Cloudinary and everything else to Supabase', () => {
    expect(providerFor(MessageType.IMAGE)).toBe(StorageProvider.CLOUDINARY);
    expect(providerFor(MessageType.VIDEO)).toBe(StorageProvider.CLOUDINARY);
    expect(providerFor(MessageType.FILE)).toBe(StorageProvider.SUPABASE);
  });
});

describe('sanitiseFileName', () => {
  it('keeps a plain name intact', () => {
    expect(sanitiseFileName('report.pdf')).toBe('report.pdf');
  });

  it('strips Vietnamese accents instead of erasing the whole name', () => {
    expect(sanitiseFileName('Báo cáo cuối kỳ.pdf')).toBe('Bao-cao-cuoi-ky.pdf');
  });

  // The name becomes a path segment in a public bucket, so these are the cases that
  // decide whether a filename can escape its folder or break the URL.
  it('cannot escape its folder', () => {
    expect(sanitiseFileName('../../../etc/passwd')).toBe('passwd');
    expect(sanitiseFileName('..\\..\\windows\\system32\\config')).toBe(
      'config',
    );
    expect(sanitiseFileName('a/b/c.txt')).toBe('c.txt');
  });

  it('drops characters that would break a URL', () => {
    expect(sanitiseFileName('a b?c#d&e.txt')).toBe('a-b-c-d-e.txt');
  });

  it('never returns an empty name', () => {
    expect(sanitiseFileName('???')).toBe('file');
    expect(sanitiseFileName('')).toBe('file');
  });

  it('keeps the extension, which is what opens the right app on download', () => {
    expect(sanitiseFileName('bảng điểm.xlsx').endsWith('.xlsx')).toBe(true);
  });
});

describe('buildStorageKey', () => {
  const conversationId = '018f0000-0000-7000-8000-000000000001';

  it('puts each file in its own folder under the conversation', () => {
    const { dir } = buildStorageKey(conversationId, 'a.pdf');

    expect(dir).toMatch(new RegExp(`^${conversationId}/[0-9a-f-]{36}$`));
  });

  it('never repeats a folder, so two uploads of one name cannot collide', () => {
    const first = buildStorageKey(conversationId, 'a.pdf');
    const second = buildStorageKey(conversationId, 'a.pdf');

    expect(first.dir).not.toBe(second.dir);
    expect(first.safeFileName).toBe(second.safeFileName);
  });
});
