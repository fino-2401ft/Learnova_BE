import { Inject, Logger, forwardRef } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { SkipThrottle } from '@nestjs/throttler';
import {
  ConnectedSocket,
  MessageBody,
  OnGatewayConnection,
  OnGatewayDisconnect,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';

import { Public } from '@/common/decorators/public.decorator';
import { AuthenticatedUser } from '@/common/types/authenticated-user.type';
import { AuthConfig } from '@/config/configuration';
import { JwtPayloadWithClaims } from '@/modules/auth/types/jwt-payload.type';
import { UsersService } from '@/modules/users/users.service';
import { ChatEvent, conversationRoom, userRoom } from './chat.events';
import { ChatService } from './chat.service';
import { MessageDto } from './dto/message.dto';

interface ChatSocket extends Socket {
  data: {
    user?: AuthenticatedUser;
    /** Resolves once handshake verification has finished. See handleConnection. */
    authenticated?: Promise<void>;
  };
}

@WebSocketGateway({ namespace: '/chat' })
export class ChatGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(ChatGateway.name);

  constructor(
    private readonly jwt: JwtService,
    private readonly config: ConfigService,
    private readonly users: UsersService,

    @Inject(forwardRef(() => ChatService))
    private readonly chat: ChatService,
  ) {}

  /**
   * Socket.IO tells the client `connect` as soon as the transport is up. It does NOT
   * wait for this method, and Nest does not await it either — message handlers are
   * bound in the same tick and start accepting packets immediately.
   *
   * So a client that emits `conversation:join` from inside its own `connect` handler
   * can arrive BEFORE verification below has assigned `client.data.user`, and the
   * handler then sees no user and answers BAD_REQUEST. The socket is authenticated;
   * it just asked one turn too early.
   *
   * That is a race, which means it fails only sometimes — on a fast network, or when
   * the database lookup is slow. Reproducing it by hand is close to impossible; the
   * end-to-end test that found it emitted `join` immediately after `connect`.
   *
   * The promise is assigned SYNCHRONOUSLY here, before any await, so it exists by the
   * time any packet from this socket can be processed. Every @SubscribeMessage that
   * reads `client.data.user` must await it first — see `join` below.
   *
   * The fuller fix is to verify the token in Socket.IO namespace middleware, which
   * runs during the handshake and makes the wait structural instead of a rule people
   * have to remember. That is a bigger change to ChatIoAdapter and is left alone here.
   */
  handleConnection(client: ChatSocket): void {
    client.data.authenticated = this.authenticate(client);
  }

  private async authenticate(client: ChatSocket): Promise<void> {
    try {
      const token = this.extractToken(client);

      if (!token) throw new Error('missing token');

      const payload = await this.jwt.verifyAsync<JwtPayloadWithClaims>(token, {
        secret: this.config.get<AuthConfig>('auth')!.accessSecret,
      });

      const user = await this.users.findById(payload.sub);

      if (!user || !user.isActive) throw new Error('inactive account');

      client.data.user = {
        userId: user.userId,
        email: user.email,
        role: user.role,
      };

      // Every device of the same user lands in this one room.
      await client.join(userRoom(user.userId));

      this.logger.debug(`socket ${client.id} connected as ${user.userId}`);
    } catch (error) {
      this.logger.debug(
        `socket ${client.id} rejected: ${(error as Error).message}`,
      );
      client.disconnect(true);
    }
  }

  handleDisconnect(client: ChatSocket): void {
    // Socket.IO removes the socket from all of its rooms automatically
    this.logger.debug(`socket ${client.id} disconnected`);
  }

  @Public()
  @SkipThrottle()
  @SubscribeMessage(ChatEvent.JOIN)
  async join(
    @ConnectedSocket() client: ChatSocket,
    @MessageBody() body: { conversationId?: string },
  ): Promise<{ joined: string } | { error: string }> {
    // Wait for the handshake check that may still be in flight — see handleConnection.
    // Without this line, joining straight after `connect` is a coin flip.
    await client.data.authenticated;

    const user = client.data.user;

    if (!user || !body?.conversationId) return { error: 'BAD_REQUEST' };

    try {
      // Avoid stranger join room
      await this.chat.assertParticipant(body.conversationId, user);
    } catch {
      return { error: 'NOT_A_PARTICIPANT' };
    }

    await client.join(conversationRoom(body.conversationId));
    return { joined: body.conversationId };
  }

  @Public()
  @SkipThrottle()
  @SubscribeMessage(ChatEvent.LEAVE)
  async leave(
    @ConnectedSocket() client: ChatSocket,
    @MessageBody() body: { conversationId?: string },
  ): Promise<{ left: string } | { error: string }> {
    if (!body?.conversationId) return { error: 'BAD_REQUEST' };

    await client.leave(conversationRoom(body.conversationId));
    return { left: body.conversationId };
  }

  publishMessage(
    conversationId: string,
    participantIds: string[],
    message: MessageDto,
  ): void {
    this.server
      .to(conversationRoom(conversationId))
      .emit(ChatEvent.MESSAGE_NEW, message);

    this.server
      .to(participantIds.map(userRoom))
      .emit(ChatEvent.CONVERSATION_UPDATED, {
        conversationId,
        lastMessage: message,
      });
  }

  private extractToken(client: Socket): string | undefined {
    const fromAuth = (client.handshake.auth as { token?: unknown })?.token;

    if (typeof fromAuth === 'string' && fromAuth.length > 0) return fromAuth;

    const fromQuery = client.handshake.query?.token;

    return typeof fromQuery === 'string' && fromQuery.length > 0
      ? fromQuery
      : undefined;
  }
}
