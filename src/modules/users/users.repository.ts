import { Injectable } from '@nestjs/common';
import { Role, User } from '@prisma/client';

import { PrismaService } from '@/database/prisma/prisma.service';
import { UserSummaryDto } from './dto/user.dto';

export interface CreateMenteeData {
  username: string;
  email: string;
  passwordHash: string;
}

export interface SearchUsersFilter {
  /** Already trimmed and length-checked by the DTO. */
  search: string;
  /** The caller. Nobody needs to find themselves in a "who to message" list. */
  excludeUserId: string;
  role?: Role;
  take: number;
}

@Injectable()
export class UsersRepository {
  constructor(private readonly prisma: PrismaService) {}

  findByEmail(email: string): Promise<User | null> {
    return this.prisma.user.findUnique({ where: { email } });
  }

  findById(userId: string): Promise<User | null> {
    return this.prisma.user.findUnique({ where: { userId } });
  }

  /**
   * Find people by handle.
   *
   * Searches `username` ONLY, never `email`. Matching on email would let anyone
   * confirm whether a given address has an account here, which is a disclosure the
   * feature does not need — the picker shows handles.
   *
   * `contains` compiles to `username ILIKE '%term%'`. The leading wildcard makes a
   * B-tree index useless, hence the trigram index added in the
   * `20260828000000_users_username_trgm` migration — same reasoning as courses.title.
   *
   * Inactive accounts are excluded here rather than filtered later: a deactivated
   * user must not be reachable, and openDirect would reject them anyway.
   */
  searchByUsername(filter: SearchUsersFilter): Promise<UserSummaryDto[]> {
    return this.prisma.user.findMany({
      where: {
        isActive: true,
        userId: { not: filter.excludeUserId },
        username: { contains: filter.search, mode: 'insensitive' },
        ...(filter.role ? { role: filter.role } : {}),
      },
      // The select IS the DTO — no mapping layer, and no way for passwordHash or
      // email to reach a response by someone later widening this query.
      select: { userId: true, username: true, avatarUrl: true, role: true },
      // Alphabetical rather than by match quality. Ranking by similarity needs raw
      // SQL, and with a cap of 25 rows the ordering barely matters — what matters is
      // that it is stable, so the list does not reshuffle between keystrokes.
      orderBy: { username: 'asc' },
      take: filter.take,
    });
  }

  createMentee(data: CreateMenteeData): Promise<User> {
    return this.prisma.user.create({
      data: { ...data, role: Role.MENTEE, mentee: { create: {} } },
    });
  }

  updateProfile(
    userId: string,
    data: { email?: string; username?: string },
  ): Promise<User> {
    return this.prisma.user.update({
      where: { userId },
      data,
    });
  }
}
