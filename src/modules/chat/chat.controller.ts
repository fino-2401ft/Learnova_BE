import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Post,
  Query,
} from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { MessageType } from '@prisma/client';

import { CurrentUser } from '@/common/decorators/current-user.decorator';
import { ChatService } from './chat.service';
import {
  ConfirmAttachmentDto,
  CreateDirectDto,
  ListMessagesQuery,
  SendMessageDto,
  SignAttachmentDto,
} from './dto/chat.request';
import {
  AttachmentUploadTicketDto,
  ConversationDto,
  CursorPageDto,
  MessageDto,
} from './dto/message.dto';

import type { AuthenticatedUser } from '@/common/types/authenticated-user.type';

@Controller()
export class ChatController {
  constructor(private readonly chat: ChatService) {}

  @Get('me/conversations')
  listConversations(
    @CurrentUser('userId') userId: string,
  ): Promise<ConversationDto[]> {
    return this.chat.listConversations(userId);
  }

  /**
   * Open (or reopen) the 1-1 thread with someone.
   *
   * POST because the first call creates a row, @HttpCode(OK) because most calls do
   * not — the client cannot tell in advance and should not have to branch on 200 vs
   * 201.
   *
   * Throttled well below the global 120/min: this is the one endpoint that lets any
   * user create rows attached to any other user, so it is the natural target for
   * someone spraying conversations across the user base.
   */
  @Post('me/conversations/direct')
  @HttpCode(HttpStatus.OK)
  @Throttle({ default: { limit: 20, ttl: 60_000 } })
  openDirect(
    @Body() dto: CreateDirectDto,
    @CurrentUser('userId') userId: string,
  ): Promise<{ conversationId: string }> {
    return this.chat.openDirect(userId, dto.userId);
  }

  /** Open the group chat of a course. Creates it on first use — see the service. */
  @Post('courses/:courseId/conversation')
  @HttpCode(HttpStatus.OK)
  openCourseConversation(
    @Param('courseId', ParseUUIDPipe) courseId: string,
    @CurrentUser() viewer: AuthenticatedUser,
  ): Promise<{ conversationId: string }> {
    return this.chat.openCourseConversation(courseId, viewer);
  }

  @Get('conversations/:conversationId/messages')
  listMessages(
    @Param('conversationId', ParseUUIDPipe) conversationId: string,
    @Query() query: ListMessagesQuery,
    @CurrentUser() viewer: AuthenticatedUser,
  ): Promise<CursorPageDto<MessageDto>> {
    return this.chat.listMessages(conversationId, query, viewer);
  }

  @Post('conversations/:conversationId/messages')
  @Throttle({ default: { limit: 60, ttl: 60_000 } })
  sendMessage(
    @Param('conversationId', ParseUUIDPipe) conversationId: string,
    @Body() dto: SendMessageDto,
    @CurrentUser() viewer: AuthenticatedUser,
  ): Promise<MessageDto> {
    return this.chat.sendMessage(
      conversationId,
      dto.content,
      dto.messageType ?? MessageType.TEXT,
      viewer,
    );
  }

  /**
   * Step 1 of sending a file: ask where to put it.
   *
   * POST despite reading nothing and creating no row — it mints a signed credential,
   * which is not something that belongs in a URL or a proxy cache.
   *
   * Throttled harder than sending a message. Each call costs a round trip to Cloudinary
   * or Supabase, so it is the endpoint in this controller that can turn one client into
   * load on a third-party account. 30/min is well past what a person picking files can
   * reach and well short of what a loop can.
   */
  @Post('conversations/:conversationId/attachments/sign')
  @HttpCode(HttpStatus.OK)
  @Throttle({ default: { limit: 30, ttl: 60_000 } })
  signAttachmentUpload(
    @Param('conversationId', ParseUUIDPipe) conversationId: string,
    @Body() dto: SignAttachmentDto,
    @CurrentUser() viewer: AuthenticatedUser,
  ): Promise<AttachmentUploadTicketDto> {
    return this.chat.signAttachmentUpload(conversationId, dto, viewer);
  }

  /** Step 2: the upload landed, post it as a message. 201 like any other send. */
  @Post('conversations/:conversationId/attachments')
  @Throttle({ default: { limit: 30, ttl: 60_000 } })
  sendAttachment(
    @Param('conversationId', ParseUUIDPipe) conversationId: string,
    @Body() dto: ConfirmAttachmentDto,
    @CurrentUser() viewer: AuthenticatedUser,
  ): Promise<MessageDto> {
    return this.chat.sendAttachmentMessage(conversationId, dto, viewer);
  }

  @Post('conversations/:conversationId/read')
  @HttpCode(HttpStatus.NO_CONTENT)
  markRead(
    @Param('conversationId', ParseUUIDPipe) conversationId: string,
    @CurrentUser() viewer: AuthenticatedUser,
  ): Promise<void> {
    return this.chat.markRead(conversationId, viewer);
  }

  @Delete('messages/:messageId')
  @HttpCode(HttpStatus.NO_CONTENT)
  deleteMessage(
    @Param('messageId', ParseUUIDPipe) messageId: string,
    @CurrentUser() viewer: AuthenticatedUser,
  ): Promise<void> {
    return this.chat.deleteMessage(messageId, viewer);
  }
}
