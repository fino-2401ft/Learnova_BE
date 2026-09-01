import { ConversationType, MessageType, StorageProvider } from '@prisma/client';

import { UploadTarget } from '@/modules/storage/storage.types';

/** Sender shown next to a bubble. Same shape as CourseAuthorDto, which the frontend
 *  already renders — no second avatar component needed. */
export interface MessageAuthorDto {
  userId: string;
  username: string;
  avatarUrl: string | null;
}

/** The file on an IMAGE/VIDEO/FILE message. Its URL is not repeated here — that is
 *  `MessageDto.content`, which for an attachment message IS the link to the file. */
export interface MessageAttachmentDto {
  /** Original name. The URL is a UUID, so this is the only thing worth showing. */
  fileName: string;
  mimeType: string;
  sizeBytes: number;
  /** Cloudinary preview for images and video, null for everything else. Letting the
   *  chat list render a 100MB video's first frame instead of pulling the video. */
  thumbnailUrl: string | null;
}

export interface MessageDto {
  messageId: string;
  conversationId: string;
  /** TEXT: the body. IMAGE/VIDEO/FILE: the URL of the file, with `attachment` holding
   *  its name and size. Null once deleted, whichever kind it was. */
  content: string | null;
  messageType: MessageType;
  createdAt: Date;
  /** True once the sender deletes it. `content` is null in that case — the row stays
   *  so the surrounding messages keep their order and the UI can show a tombstone. */
  isDeleted: boolean;
  sender: MessageAuthorDto;
  /** Null for TEXT messages and for deleted ones. */
  attachment: MessageAttachmentDto | null;
}

/**
 * Answer to "where do I put this file?".
 *
 * `upload` is the provider-specific part the client POSTs to, and `uploadTicket` is
 * what it must hand back afterwards to turn the upload into a message. The storage key
 * is deliberately absent: it is sealed inside the ticket.
 */
export interface AttachmentUploadTicketDto {
  uploadTicket: string;
  /** After this, the ticket AND the upload target are both dead. */
  expiresAt: Date;
  provider: StorageProvider;
  /** What the message will be typed as — lets the composer draw the right placeholder
   *  bubble while the upload is in flight. */
  messageType: MessageType;
  /** Sanitised name the file will be stored and downloaded under. Worth echoing: it
   *  can differ from what was sent, and the UI should show what recipients will see. */
  fileName: string;
  upload: UploadTarget;
}

export interface ConversationDto {
  conversationId: string;
  type: ConversationType;
  /** Title to show in the list: the course title, or the other person's username. */
  title: string;
  /**
   * The course this thread belongs to. Null for 1-1 threads.
   *
   * Without it the client cannot tell WHICH course a COURSE conversation is for — the
   * only other handle is the title, and matching threads to courses by display name
   * breaks the moment two courses share one. The chat tab that lists a learner's
   * courses alongside their existing threads needs exactly this join key.
   */
  courseId: string | null;
  lastMessageAt: Date | null;
  lastMessage: MessageDto | null;
  unreadCount: number;
}

export interface CursorPageDto<T> {
  items: T[];
  /** Pass back as `?cursor=` to fetch older messages. Null means start of history. */
  nextCursor: string | null;
}
