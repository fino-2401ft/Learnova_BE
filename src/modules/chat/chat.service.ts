import {
  BadRequestException,
  ForbiddenException,
  Inject,
  Injectable,
  NotFoundException,
  forwardRef,
} from '@nestjs/common';
import {
  ConversationType,
  CourseStatus,
  MessageType,
  Role,
} from '@prisma/client';

import { ErrorCode } from '@/common/constants/error-codes';
import { AuthenticatedUser } from '@/common/types/authenticated-user.type';
import {
  classifyMime,
  formatMegabytes,
  maxBytesFor,
} from '@/modules/storage/attachment.policy';
import { StorageService } from '@/modules/storage/storage.service';
import { AttachmentKind } from '@/modules/storage/storage.types';
import { AttachmentTicketService } from './attachment-ticket.service';
import { ChatGateway } from './chat.gateway';
import { ChatRepository, MessageRow } from './chat.repository';
import {
  ConfirmAttachmentDto,
  DEFAULT_MESSAGE_PAGE,
  ListMessagesQuery,
  SignAttachmentDto,
} from './dto/chat.request';
import {
  AttachmentUploadTicketDto,
  ConversationDto,
  CursorPageDto,
  MessageDto,
} from './dto/message.dto';

@Injectable()
export class ChatService {
  constructor(
    private readonly repo: ChatRepository,
    private readonly storage: StorageService,
    private readonly tickets: AttachmentTicketService,

    @Inject(forwardRef(() => ChatGateway))
    private readonly gateway: ChatGateway,
  ) {}

  // CONVERSATION

  async listConversations(userId: string): Promise<ConversationDto[]> {
    const rows = await this.repo.findConversationsFor(userId);

    if (rows.length === 0) return [];

    const unread = await this.repo.unreadCounts(userId);

    return rows.map((row) => {
      const peer = row.participants[0]?.user;

      return {
        conversationId: row.conversationId,
        type: row.type,
        title:
          row.type === ConversationType.COURSE
            ? (row.course?.title ?? 'Khoá học')
            : (peer?.username ?? 'Người dùng đã rời đi'),
        courseId: row.courseId,
        lastMessageAt: row.lastMessageAt,
        lastMessage: row.messages[0] ? this.toDto(row.messages[0]) : null,
        unreadCount: unread.get(row.conversationId) ?? 0,
      };
    });
  }

  //1-1 THREAD with another user, if not exist before -> creat new conv
  async openDirect(
    meId: string,
    peerId: string,
  ): Promise<{ conversationId: string }> {
    if (meId === peerId) {
      throw new BadRequestException({
        code: ErrorCode.CANNOT_MESSAGE_SELF,
        message: 'Cannot open a conversation with yourself',
      });
    }

    const peer = await this.repo.findUser(peerId);

    if (!peer || !peer.isActive) {
      throw new NotFoundException({ message: 'User not found' });
    }

    return this.repo.upsertDirect(meId, peerId);
  }

  async openCourseConversation(
    courseId: string,
    viewer: AuthenticatedUser,
  ): Promise<{ conversationId: string }> {
    const result = await this.repo.upsertCourseConversation(courseId);

    if (!result) throw new NotFoundException({ message: 'Course not found' });

    if (result.status !== CourseStatus.PUBLISHED) {
      throw new ForbiddenException({
        code: ErrorCode.COURSE_NOT_PUBLISHED,
        message: 'This course has no chat yet',
      });
    }

    if (
      viewer.role !== Role.ADMIN &&
      !result.memberIds.includes(viewer.userId)
    ) {
      throw new ForbiddenException({
        code: ErrorCode.NOT_ENROLLED,
        message: 'Enrol in this course to join its chat',
      });
    }

    return { conversationId: result.conversationId };
  }

  // -------------------------------------------------------------------------
  // Messages
  // -------------------------------------------------------------------------

  async listMessages(
    conversationId: string,
    query: ListMessagesQuery,
    viewer: AuthenticatedUser,
  ): Promise<CursorPageDto<MessageDto>> {
    await this.assertParticipant(conversationId, viewer);

    const limit = query.limit ?? DEFAULT_MESSAGE_PAGE;

    // One extra row is fetched purely to learn whether another page exists. Asking
    // for a count instead would scan the whole conversation on every scroll.
    const rows = await this.repo.listMessages(
      conversationId,
      limit + 1,
      query.cursor,
    );

    const hasMore = rows.length > limit;
    const items = hasMore ? rows.slice(0, limit) : rows;

    return {
      items: items.map((row) => this.toDto(row)),
      nextCursor: hasMore ? items[items.length - 1].messageId : null,
    };
  }

  async sendMessage(
    conversationId: string,
    content: string,
    messageType: MessageType,
    viewer: AuthenticatedUser,
  ): Promise<MessageDto> {
    await this.assertParticipant(conversationId, viewer);

    const row = await this.repo.send({
      conversationId,
      senderId: viewer.userId,
      content,
      messageType,
    });

    const dto = this.toDto(row);
    const participantIds = await this.repo.participantIds(conversationId);

    this.gateway.publishMessage(conversationId, participantIds, dto);

    return dto;
  }

  // -------------------------------------------------------------------------
  // Attachments
  //
  // Two steps, because the bytes never pass through this API: the browser uploads
  // straight to Cloudinary or Supabase. That keeps a 100MB video off the server's
  // bandwidth, and it is also the reason both methods below are written the way they
  // are — between them sits a request this API never sees, so step 2 trusts nothing
  // step 1 said and re-reads the truth from the provider.
  // -------------------------------------------------------------------------

  /**
   * Step 1. Decide where the file goes and hand back signed credentials for it.
   *
   * The size check here is a courtesy, not a defence — it is done against a number the
   * client supplied, purely so a 200MB video is refused now rather than after the user
   * has watched a progress bar for five minutes. The check that matters is in
   * `sendAttachmentMessage`.
   */
  async signAttachmentUpload(
    conversationId: string,
    dto: SignAttachmentDto,
    viewer: AuthenticatedUser,
  ): Promise<AttachmentUploadTicketDto> {
    await this.assertParticipant(conversationId, viewer);

    const kind = this.classifyOrReject(dto.mimeType);
    this.assertWithinLimit(dto.sizeBytes, kind);

    const prepared = await this.storage.prepareUpload(
      conversationId,
      kind,
      dto.fileName,
    );

    const { ticket, expiresAt } = await this.tickets.issue({
      sub: viewer.userId,
      cid: conversationId,
      prv: prepared.provider,
      key: prepared.storageKey,
      knd: kind,
      nam: prepared.fileName,
    });

    return {
      uploadTicket: ticket,
      expiresAt,
      provider: prepared.provider,
      messageType: kind,
      fileName: prepared.fileName,
      upload: prepared.target,
    };
  }

  /**
   * Step 2. The upload finished — turn it into a message.
   *
   * Order matters here. The provider is asked what it is holding BEFORE anything is
   * written, because that answer is the only trustworthy account of the file: in a
   * direct-upload flow the client could have signed for a 2MB pdf and uploaded a 500MB
   * one, and the ticket cannot tell the difference. So:
   *
   *   1. the ticket proves this caller was authorised to upload to this key,
   *   2. the provider says what actually arrived,
   *   3. an over-limit file is deleted rather than merely rejected — leaving it would
   *      turn a refused upload into free storage on someone else's bill.
   *
   * A missing file is a 400, not a 500: the usual cause is an upload that failed or was
   * cancelled, which is the client's situation to recover from by picking the file
   * again.
   */
  async sendAttachmentMessage(
    conversationId: string,
    dto: ConfirmAttachmentDto,
    viewer: AuthenticatedUser,
  ): Promise<MessageDto> {
    await this.assertParticipant(conversationId, viewer);

    const ticket = await this.tickets.verify(
      dto.uploadTicket,
      viewer.userId,
      conversationId,
    );

    const stored = await this.storage.describe(
      ticket.prv,
      ticket.key,
      ticket.knd,
    );

    if (!stored) {
      throw new BadRequestException({
        code: ErrorCode.UPLOAD_INCOMPLETE,
        message: 'Chưa thấy file trên hệ thống lưu trữ, vui lòng tải lên lại',
      });
    }

    const limit = maxBytesFor(ticket.knd);

    if (stored.sizeBytes > limit) {
      await this.storage.destroy(ticket.prv, ticket.key, ticket.knd);

      throw new BadRequestException({
        code: ErrorCode.ATTACHMENT_TOO_LARGE,
        message: `File vượt quá ${formatMegabytes(limit)}`,
      });
    }

    // `content` IS the link — that is the whole data model for attachments. The name,
    // size and MIME live in their own columns because a URL ending in a UUID cannot
    // carry them.
    const row = await this.repo.send({
      conversationId,
      senderId: viewer.userId,
      content: stored.url,
      messageType: ticket.knd,
      attachment: {
        fileName: ticket.nam,
        mimeType: stored.mimeType,
        sizeBytes: stored.sizeBytes,
        provider: ticket.prv,
        storageKey: ticket.key,
        thumbnailUrl: stored.thumbnailUrl,
      },
    });

    const message = this.toDto(row);
    const participantIds = await this.repo.participantIds(conversationId);

    this.gateway.publishMessage(conversationId, participantIds, message);

    return message;
  }

  private classifyOrReject(mimeType: string): AttachmentKind {
    const kind = classifyMime(mimeType);

    if (!kind) {
      throw new BadRequestException({
        code: ErrorCode.ATTACHMENT_TYPE_NOT_ALLOWED,
        message: `Định dạng ${mimeType} không được hỗ trợ`,
      });
    }

    return kind;
  }

  private assertWithinLimit(sizeBytes: number, kind: AttachmentKind): void {
    const limit = maxBytesFor(kind);

    if (sizeBytes > limit) {
      throw new BadRequestException({
        code: ErrorCode.ATTACHMENT_TOO_LARGE,
        message: `File vượt quá ${formatMegabytes(limit)}`,
      });
    }
  }

  async deleteMessage(
    messageId: string,
    viewer: AuthenticatedUser,
  ): Promise<void> {
    const message = await this.repo.findMessageOwner(messageId);

    if (!message) throw new NotFoundException({ message: 'Message not found' });

    // Admins may remove reported content; nobody else touches another user's message.
    if (message.senderId !== viewer.userId && viewer.role !== Role.ADMIN) {
      throw new ForbiddenException({
        code: ErrorCode.MESSAGE_NOT_OWNED,
        message: 'You can only delete your own messages',
      });
    }

    // Deleting twice is a no-op rather than a 409: the second click of a
    // double-click should not surface an error the user cannot act on.
    if (message.deletedAt) return;

    const row = await this.repo.softDelete(messageId);

    // The row survives as a tombstone, but the file does not need to. `content` is
    // nulled for every reader from here on, so nothing in the product can reach the
    // file again — leaving it would just be paying to store something unreachable.
    //
    // After the soft delete, not before: if the delete fails, the message must stay
    // intact rather than becoming a bubble pointing at a file that is already gone.
    // `destroy` never throws, so a storage outage cannot block a user's delete.
    if (message.storageKey && message.storageProvider) {
      await this.storage.destroy(
        message.storageProvider,
        message.storageKey,
        message.messageType as AttachmentKind,
      );
    }

    const participantIds = await this.repo.participantIds(
      message.conversationId,
    );

    this.gateway.publishMessage(
      message.conversationId,
      participantIds,
      this.toDto(row),
    );
  }

  async markRead(
    conversationId: string,
    viewer: AuthenticatedUser,
  ): Promise<void> {
    await this.assertParticipant(conversationId, viewer);
    await this.repo.markRead(conversationId, viewer.userId);
  }

  async assertParticipant(
    conversationId: string,
    viewer: AuthenticatedUser,
  ): Promise<void> {
    if (viewer.role === Role.ADMIN) return;

    const ok = await this.repo.isParticipant(conversationId, viewer.userId);

    if (!ok) {
      throw new ForbiddenException({
        code: ErrorCode.NOT_A_PARTICIPANT,
        message: 'You are not part of this conversation',
      });
    }
  }

  private toDto(row: MessageRow): MessageDto {
    const isDeleted = row.deletedAt !== null;

    return {
      messageId: row.messageId,
      conversationId: row.conversationId,
      // For an attachment this is the file's URL, so hiding it on delete is not
      // cosmetic: it is what stops a withdrawn file from staying reachable in the
      // payload after its bubble turns into a tombstone.
      content: isDeleted ? null : row.content,
      messageType: row.messageType,
      createdAt: row.createdAt,
      isDeleted,
      sender: row.sender,
      // Guarded on attachmentName rather than on messageType: the three fields are
      // written together in one insert, so if the name is there the rest is too, and
      // TypeScript can narrow all of them from this one check.
      attachment:
        isDeleted || row.attachmentName === null
          ? null
          : {
              fileName: row.attachmentName,
              mimeType: row.attachmentMime ?? 'application/octet-stream',
              sizeBytes: row.attachmentSize ?? 0,
              thumbnailUrl: row.thumbnailUrl,
            },
    };
  }
}
