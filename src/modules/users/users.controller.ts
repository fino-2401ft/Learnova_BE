import { Controller, Get, Query } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';

import { CurrentUser } from '@/common/decorators/current-user.decorator';
import { SearchUsersQuery } from './dto/search-users.query';
import { UserSummaryDto } from './dto/user.dto';
import { UsersService } from './users.service';

/**
 * The user directory.
 *
 * Not `@Public()`: the global JwtAuthGuard applies, so an anonymous request gets 401
 * before reaching the handler. That is load-bearing here — this is the one endpoint
 * that describes people rather than content.
 */
@Controller('users')
export class UsersController {
  constructor(private readonly users: UsersService) {}

  /**
   * Find people to start a conversation with.
   *
   * Throttled well below the global 120/min. The endpoint is cheap per call but is
   * the natural tool for walking the user base two letters at a time, and 30/min is
   * still far more than a human typing into a search box will ever need.
   *
   * Three things keep it a lookup rather than an export: `search` is mandatory and at
   * least 2 characters, results are capped at 25, and the response carries no email.
   */
  @Get()
  @Throttle({ default: { limit: 30, ttl: 60_000 } })
  search(
    @Query() query: SearchUsersQuery,
    @CurrentUser('userId') viewerId: string,
  ): Promise<UserSummaryDto[]> {
    return this.users.search(query, viewerId);
  }
}
