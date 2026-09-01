import { MessageType } from '@prisma/client';
import { Transform } from 'class-transformer';
import {
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  MaxLength,
  Min,
} from 'class-validator';

export const DEFAULT_MESSAGE_PAGE = 30;
export const MAX_MESSAGE_PAGE = 100;

export class SendMessageDto {
  @Transform(({ value }): unknown =>
    typeof value === 'string' ? value.trim() : value,
  )
  @IsString()
  @IsNotEmpty()
  @MaxLength(4000)
  content: string;

  @IsOptional()
  @IsEnum(MessageType)
  messageType?: MessageType;
}

/**
 * Step 1 of sending a file: describe it, get somewhere to put it.
 *
 * Every value here is a CLAIM by the client, checked twice. Once now, so an obviously
 * wrong file is refused before the user waits through an upload, and again after the
 * bytes land, against what the provider reports — see ChatService.sendAttachmentMessage.
 * The browser uploads straight to Cloudinary/Supabase without passing through this API,
 * so nothing said here can be the last word.
 */
export class SignAttachmentDto {
  /** Original name, used for display and for the download filename. */
  @Transform(({ value }): unknown =>
    typeof value === 'string' ? value.trim() : value,
  )
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  fileName: string;

  /** Decides both the allowlist check and which provider the file goes to. */
  @IsString()
  @IsNotEmpty()
  @MaxLength(150)
  mimeType: string;

  @IsInt()
  @Min(1)
  sizeBytes: number;
}

/**
 * Step 2: the upload finished, turn it into a message.
 *
 * Deliberately just the ticket. The storage key, the sender, the conversation and the
 * file kind all come out of its signed payload — see AttachmentTicketService — so there
 * is no field here for a client to aim at someone else's file.
 */
export class ConfirmAttachmentDto {
  @IsString()
  @IsNotEmpty()
  uploadTicket: string;
}

export class CreateDirectDto {
  /** The other person. The caller is always taken from the access token. */
  @IsUUID()
  userId: string;
}

export class ListMessagesQuery {
  /** `messageId` of the oldest message already on screen. */
  @IsOptional()
  @IsUUID()
  cursor?: string;

  /** Clamped rather than rejected above the cap, matching ListCoursesQuery. */
  @Transform(({ value }): unknown => {
    if (value === undefined || value === null || value === '') return undefined;

    const parsed = Number(value);
    return Number.isFinite(parsed)
      ? Math.min(Math.trunc(parsed), MAX_MESSAGE_PAGE)
      : parsed;
  })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(MAX_MESSAGE_PAGE)
  limit?: number;
}
