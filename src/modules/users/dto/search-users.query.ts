import { Role } from '@prisma/client';
import { Transform } from 'class-transformer';
import {
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  MaxLength,
  Min,
  MinLength,
} from 'class-validator';

/** A picker shows a handful of names, not a page of them. */
export const DEFAULT_USER_SEARCH_LIMIT = 10;
export const MAX_USER_SEARCH_LIMIT = 25;

/** Below this, a query matches too much of the user base to be a search. */
export const MIN_USER_SEARCH_LENGTH = 2;

export class SearchUsersQuery {
  /**
   * REQUIRED, unlike every other search in this API.
   *
   * The course catalogue with no `search` is a catalogue; a user directory with no
   * `search` is a dump of everyone who ever registered. Making the term mandatory —
   * and at least two characters — is what keeps this endpoint a lookup tool rather
   * than an export tool. The result cap does the rest.
   */
  @Transform(({ value }): unknown =>
    typeof value === 'string' ? value.trim() : value,
  )
  @IsString()
  @MinLength(MIN_USER_SEARCH_LENGTH)
  @MaxLength(100)
  search: string;

  /** Narrow to mentors when the caller is looking for a teacher specifically. */
  @IsOptional()
  @IsEnum(Role)
  role?: Role;

  /**
   * Clamped rather than rejected above the cap, matching ListCoursesQuery: a client
   * asking for 1000 means "as many as possible", and a 400 helps nobody.
   */
  @Transform(({ value }): unknown => {
    if (value === undefined || value === null || value === '') return undefined;

    const parsed = Number(value);
    // NaN passes through so @IsInt rejects `?limit=abc` instead of this transform
    // silently turning it into the default.
    return Number.isFinite(parsed)
      ? Math.min(Math.trunc(parsed), MAX_USER_SEARCH_LIMIT)
      : parsed;
  })
  @IsOptional()
  @IsInt()
  @Min(1)
  limit?: number;
}
