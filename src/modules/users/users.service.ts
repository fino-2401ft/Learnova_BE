import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { User } from '@prisma/client';

import { CreateMenteeData, UsersRepository } from './users.repository';
import {
  DEFAULT_USER_SEARCH_LIMIT,
  SearchUsersQuery,
} from './dto/search-users.query';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { MeDto, toMeDto, UserSummaryDto } from './dto/user.dto';

@Injectable()
export class UsersService {
  constructor(private readonly repository: UsersRepository) {}

  findByEmail(email: string): Promise<User | null> {
    return this.repository.findByEmail(email);
  }

  findById(userId: string): Promise<User | null> {
    return this.repository.findById(userId);
  }

  /**
   * Directory lookup behind the "who do you want to message" screen.
   *
   * Returns a plain array, not a page. Paginating would mean a COUNT(*) over an
   * ILIKE on every keystroke, and a picker never needs page 4 — the honest answer
   * to "too many matches" is for the user to type more, which the cap nudges them
   * towards.
   */
  search(query: SearchUsersQuery, viewerId: string): Promise<UserSummaryDto[]> {
    return this.repository.searchByUsername({
      search: query.search,
      excludeUserId: viewerId,
      role: query.role,
      take: query.limit ?? DEFAULT_USER_SEARCH_LIMIT,
    });
  }

  createMentee(data: CreateMenteeData): Promise<User> {
    return this.repository.createMentee(data);
  }

  /**
   * Update the caller's own username and/or email.
   *
   * Uniqueness conflicts surface as Prisma P2002 and are mapped by the global
   * filter — no need to pre-check, and a pre-check would race anyway.
   */
  async updateProfile(userId: string, dto: UpdateProfileDto): Promise<MeDto> {
    if (dto.email === undefined && dto.username === undefined) {
      throw new BadRequestException({
        code: 'EMPTY_UPDATE',
        message: 'Provide at least one of email or username',
      });
    }

    const existing = await this.repository.findById(userId);
    if (!existing) {
      throw new NotFoundException({
        code: 'USER_NOT_FOUND',
        message: 'User not found',
      });
    }

    const data: { email?: string; username?: string } = {};
    if (dto.email !== undefined && dto.email !== existing.email) {
      data.email = dto.email;
    }
    if (dto.username !== undefined && dto.username !== existing.username) {
      data.username = dto.username;
    }

    // Nothing actually changed (same values re-submitted) — still succeed with
    // the current row so the client can treat save as idempotent.
    if (Object.keys(data).length === 0) {
      return toMeDto(existing);
    }

    const updated = await this.repository.updateProfile(userId, data);
    return toMeDto(updated);
  }
}
