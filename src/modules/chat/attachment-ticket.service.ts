import { BadRequestException, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { StorageProvider } from '@prisma/client';

import { ErrorCode } from '@/common/constants/error-codes';
import { AuthConfig } from '@/config/configuration';
import { UPLOAD_TICKET_TTL_SECONDS } from '@/modules/storage/attachment.policy';
import { AttachmentKind } from '@/modules/storage/storage.types';

/** What the server remembers about an upload it authorised. Short keys because this
 *  is signed and round-tripped through the browser on every attachment. */
interface TicketPayload {
  /** Người gửi. */
  sub: string;
  /** Conversation. */
  cid: string;
  prv: StorageProvider;
  /** public_id hoặc object path. */
  key: string;
  knd: AttachmentKind;
  /** Tên file đã làm sạch. */
  nam: string;
}

/**
 * The link between "the server said this upload was allowed" and "a message now exists
 * for it".
 *
 * In a direct-upload flow those are two separate requests with a third-party upload in
 * between, and nothing about the second request inherently proves the first ever
 * happened. Without a ticket, the confirm endpoint would have to take the storage key
 * from the client — and a client that can name its own key can point a message at
 * ANY file in the bucket, including one from a conversation it was never part of.
 *
 * So the key never travels as plain data. It is signed here, on the way out, and the
 * signature is checked on the way back: the confirm endpoint reads the key from the
 * verified payload and ignores anything else the request body has to say about it.
 *
 * Signed with the access-token secret and the same JwtService the gateway uses. A
 * separate secret would be marginally tidier, but it is one more required environment
 * variable for no change in what an attacker would need — either secret leaking is
 * already a full compromise.
 */
@Injectable()
export class AttachmentTicketService {
  private readonly secret: string;

  constructor(
    private readonly jwt: JwtService,
    config: ConfigService,
  ) {
    this.secret = config.get<AuthConfig>('auth')!.accessSecret;
  }

  async issue(
    payload: TicketPayload,
  ): Promise<{ ticket: string; expiresAt: Date }> {
    const ticket = await this.jwt.signAsync(payload, {
      secret: this.secret,
      expiresIn: UPLOAD_TICKET_TTL_SECONDS,
    });

    return {
      ticket,
      expiresAt: new Date(Date.now() + UPLOAD_TICKET_TTL_SECONDS * 1000),
    };
  }

  /**
   * Verify a ticket and confirm it belongs to this caller, in this conversation.
   *
   * The two equality checks are not redundant with the signature. A valid ticket is
   * still only valid for the person and thread it was issued for: without them, someone
   * could take their own legitimately signed ticket and post the file into a different
   * conversation, or replay a ticket lifted from another user.
   */
  async verify(
    ticket: string,
    senderId: string,
    conversationId: string,
  ): Promise<TicketPayload> {
    let payload: TicketPayload;

    try {
      payload = await this.jwt.verifyAsync<TicketPayload>(ticket, {
        secret: this.secret,
      });
    } catch {
      // Covers both a forged signature and an expired ticket. They are deliberately
      // not distinguished to the client: the fix for either is the same — pick the
      // file again — and saying which one it was only helps someone probing.
      throw new BadRequestException({
        code: ErrorCode.UPLOAD_TICKET_INVALID,
        message:
          'Phiên tải lên không hợp lệ hoặc đã hết hạn, vui lòng chọn lại file',
      });
    }

    if (payload.sub !== senderId || payload.cid !== conversationId) {
      throw new BadRequestException({
        code: ErrorCode.UPLOAD_TICKET_INVALID,
        message: 'Phiên tải lên không thuộc về cuộc trò chuyện này',
      });
    }

    return payload;
  }
}
