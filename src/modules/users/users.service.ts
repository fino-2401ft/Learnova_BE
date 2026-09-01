import { Injectable } from '@nestjs/common';
import { User } from '@prisma/client';

import { CreateMenteeData, UsersRepository } from './users.repository';
import {
  DEFAULT_USER_SEARCH_LIMIT,
  SearchUsersQuery,
} from './dto/search-users.query';
import { UserSummaryDto } from './dto/user.dto';

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
}
