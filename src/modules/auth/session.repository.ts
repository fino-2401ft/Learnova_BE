import { Injectable } from '@nestjs/common';
import { Session } from '@prisma/client';

import { PrismaService } from '@/database/prisma/prisma.service';

export interface CreateSessionData {
  userId: string;
  refreshTokenHash: string;
  expiresAt: Date;
  ipAddress?: string | null;
  userAgent?: string | null;
  deviceName?: string | null;
}

@Injectable()
export class SessionRepository {
  constructor(private readonly prisma: PrismaService) {}

  create(data: CreateSessionData): Promise<Session> {
    return this.prisma.session.create({ data });
  }

  findByAnyTokenHash(hash: string): Promise<Session | null> {
    return this.prisma.session.findFirst({
      where: { OR: [{ refreshTokenHash: hash }, { previousTokenHash: hash }] },
    });
  }

  /**
   * Returns false when another request rotated this session first. Matching on the
   * old hash inside WHERE makes the swap atomic — reading then writing would let two
   * concurrent refreshes both succeed and one of the issued tokens would be orphaned.
   */
  async rotate(
    sessionId: string,
    currentHash: string,
    nextHash: string,
  ): Promise<boolean> {
    const { count } = await this.prisma.session.updateMany({
      where: { sessionId, refreshTokenHash: currentHash, revokedAt: null },
      data: {
        previousTokenHash: currentHash,
        refreshTokenHash: nextHash,
        lastUsedAt: new Date(),
      },
    });

    return count === 1;
  }

  async revoke(sessionId: string): Promise<void> {
    await this.prisma.session.updateMany({
      where: { sessionId, revokedAt: null },
      data: { revokedAt: new Date() },
    });
  }
}
