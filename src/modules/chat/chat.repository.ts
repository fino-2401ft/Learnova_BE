import { Injectable } from '@nestjs/common';
import {
  ConversationType,
  MessageType,
  Prisma,
  Role,
  StorageProvider,
} from '@prisma/client';

import { PrismaService } from '@/database/prisma/prisma.service';

/** Everything the UI needs to draw a bubble. Matches CourseAuthorDto so the frontend
 *  reuses its existing avatar component. */
const SENDER_SELECT = {
  userId: true,
  username: true,
  avatarUrl: true,
} satisfies Prisma.UserSelect;

const MESSAGE_SELECT = {
  messageId: true,
  conversationId: true,
  content: true,
  messageType: true,
  createdAt: true,
  deletedAt: true,
  attachmentName: true,
  attachmentMime: true,
  attachmentSize: true,
  thumbnailUrl: true,
  sender: { select: SENDER_SELECT },
} satisfies Prisma.MessageSelect;

export type MessageRow = Prisma.MessageGetPayload<{
  select: typeof MESSAGE_SELECT;
}>;

/** The file half of a message, absent on plain text.
 *
 *  `storageProvider` and `storageKey` are write-only from the API's point of view:
 *  they are stored so a withdrawn message can have its file deleted, and are left out
 *  of MESSAGE_SELECT so they cannot leak into a response. Knowing the Cloudinary
 *  public_id of someone else's file is not dangerous on its own, but it is internal
 *  plumbing, and the fewer places it appears the fewer places have to be checked. */
export interface AttachmentData {
  fileName: string;
  mimeType: string;
  sizeBytes: number;
  provider: StorageProvider;
  storageKey: string;
  thumbnailUrl: string | null;
}

export interface SendMessageData {
  conversationId: string;
  senderId: string;
  /** Text body, or — for an attachment — the public URL of the file. */
  content: string;
  messageType: MessageType;
  attachment?: AttachmentData;
}

@Injectable()
export class ChatRepository {
  constructor(private readonly prisma: PrismaService) {}

  isParticipant(conversationId: string, userId: string): Promise<boolean> {
    return this.prisma.conversationParticipant
      .findUnique({
        where: { conversationId_userId: { conversationId, userId } },
        select: { userId: true },
      })
      .then((row) => row !== null);
  }

  async participantIds(conversationId: string): Promise<string[]> {
    const rows = await this.prisma.conversationParticipant.findMany({
      where: { conversationId },
      select: { userId: true },
    });

    return rows.map((row) => row.userId);
  }

  send(data: SendMessageData): Promise<MessageRow> {
    return this.prisma.$transaction(async (tx) => {
      const message = await tx.message.create({
        data: {
          conversationId: data.conversationId,
          senderId: data.senderId,
          content: data.content,
          messageType: data.messageType,
          // Spread rather than six `?? null` lines: on a text message these columns
          // must stay untouched so their schema defaults apply, not be written as an
          // explicit NULL that a future non-null default would have to fight.
          ...(data.attachment
            ? {
                attachmentName: data.attachment.fileName,
                attachmentMime: data.attachment.mimeType,
                attachmentSize: data.attachment.sizeBytes,
                storageProvider: data.attachment.provider,
                storageKey: data.attachment.storageKey,
                thumbnailUrl: data.attachment.thumbnailUrl,
              }
            : {}),
        },
        select: MESSAGE_SELECT,
      });

      await tx.conversation.update({
        where: { conversationId: data.conversationId },
        data: { lastMessageAt: message.createdAt },
      });

      return message;
    });
  }

  listMessages(
    conversationId: string,
    limit: number,
    cursor?: string,
  ): Promise<MessageRow[]> {
    return this.prisma.message.findMany({
      where: { conversationId },
      select: MESSAGE_SELECT,
      orderBy: [{ createdAt: 'desc' }, { messageId: 'desc' }],
      take: limit,
      // `skip: 1` steps over the cursor row itself, which the client already has.
      ...(cursor ? { cursor: { messageId: cursor }, skip: 1 } : {}),
    });
  }

  findConversationsFor(userId: string) {
    return this.prisma.conversation.findMany({
      where: { participants: { some: { userId } } },
      select: {
        conversationId: true,
        type: true,
        lastMessageAt: true,
        courseId: true,
        course: { select: { title: true } },
        participants: {
          where: { userId: { not: userId } },
          select: { user: { select: SENDER_SELECT } },
        },
        messages: {
          orderBy: [{ createdAt: 'desc' }, { messageId: 'desc' }],
          take: 1,
          select: MESSAGE_SELECT,
        },
      },
      orderBy: [{ lastMessageAt: 'desc' }, { conversationId: 'desc' }],
    });
  }

  async unreadCounts(userId: string): Promise<Map<string, number>> {
    const rows = await this.prisma.$queryRaw<
      { conversation_id: string; unread: number }[]
    >`
      SELECT m.conversation_id, COUNT(*)::int AS unread
      FROM messages m
      JOIN conversation_participants p
        ON p.conversation_id = m.conversation_id
       AND p.user_id = ${userId}::uuid
      WHERE m.sender_id <> ${userId}::uuid
        AND m.deleted_at IS NULL
        AND (p.last_read_at IS NULL OR m.created_at > p.last_read_at)
      GROUP BY m.conversation_id
    `;

    return new Map(rows.map((row) => [row.conversation_id, row.unread]));
  }

  markRead(conversationId: string, userId: string): Promise<unknown> {
    return this.prisma.conversationParticipant.update({
      where: { conversationId_userId: { conversationId, userId } },
      data: { lastReadAt: new Date() },
    });
  }

  async upsertDirect(userA: string, userB: string) {
    const directKey = [userA, userB].sort().join(':');

    const existing = await this.prisma.conversation.findUnique({
      where: { directKey },
      select: { conversationId: true },
    });

    if (existing) return existing;

    return this.prisma.$transaction(async (tx) => {
      const conversation = await tx.conversation.create({
        data: {
          type: ConversationType.PRIVATE,
          directKey,
        },
        select: { conversationId: true },
      });

      await tx.conversationParticipant.createMany({
        data: [
          { conversationId: conversation.conversationId, userId: userA },
          { conversationId: conversation.conversationId, userId: userB },
        ],
      });

      return conversation;
    });
  }

  async upsertCourseConversation(courseId: string) {
    const course = await this.prisma.course.findUnique({
      where: { courseId },
      select: {
        courseId: true,
        status: true,
        mentorId: true,
        enrollments: { select: { menteeId: true } },
      },
    });

    if (!course) return null;

    const memberIds = [
      course.mentorId,
      ...course.enrollments.map((row) => row.menteeId),
    ];

    return this.prisma.$transaction(async (tx) => {
      let conversation = await tx.conversation.findFirst({
        where: { courseId, type: ConversationType.COURSE },
        select: { conversationId: true },
      });

      conversation ??= await tx.conversation.create({
        data: { type: ConversationType.COURSE, courseId },
        select: { conversationId: true },
      });

      const { conversationId } = conversation;

      await tx.conversationParticipant.createMany({
        data: memberIds.map((userId) => ({ conversationId, userId })),
        // Cheaper than reading the current rows first, and races between two people
        // opening the chat at once resolve to the same end state.
        skipDuplicates: true,
      });

      await tx.conversationParticipant.deleteMany({
        where: { conversationId, userId: { notIn: memberIds } },
      });

      return { conversationId, status: course.status, memberIds };
    });
  }

  findUser(userId: string) {
    return this.prisma.user.findUnique({
      where: { userId },
      select: { userId: true, isActive: true, role: true },
    });
  }

  /** Also returns the storage coordinates, so deleting a message can delete its file
   *  in the same pass instead of reading the row twice. */
  findMessageOwner(messageId: string) {
    return this.prisma.message.findUnique({
      where: { messageId },
      select: {
        messageId: true,
        senderId: true,
        conversationId: true,
        deletedAt: true,
        messageType: true,
        storageProvider: true,
        storageKey: true,
      },
    });
  }

  softDelete(messageId: string): Promise<MessageRow> {
    return this.prisma.message.update({
      where: { messageId },
      data: { deletedAt: new Date() },
      select: MESSAGE_SELECT,
    });
  }

  /** Admins are not participants of anything, but must be able to read a thread that
   *  gets reported. Kept here so the rule lives next to the queries it affects. */
  isPrivileged(role: Role): boolean {
    return role === Role.ADMIN;
  }
}
