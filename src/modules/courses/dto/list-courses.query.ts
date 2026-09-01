import { CourseLevel } from '@prisma/client';
import { Transform } from 'class-transformer';
import {
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  MaxLength,
  Min,
} from 'class-validator';

export const MAX_PAGE_SIZE = 50;
export const DEFAULT_PAGE_SIZE = 12;

export class ListCoursesQuery {
  /**
   * Free-text search over the course title.
   *
   * Trimmed, and an all-whitespace value becomes undefined: `title ILIKE '%%'` would
   * match every row while still paying for the trigram lookup.
   */
  @Transform(({ value }): string | undefined => {
    // A repeated `?search=` arrives as an array, not a string. Treat that as no
    // search rather than as an error — it is a client quirk, not a user mistake.
    if (typeof value !== 'string') return undefined;

    const trimmed = value.trim();
    return trimmed.length > 0 ? trimmed : undefined;
  })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  search?: string;

  @IsOptional()
  @IsEnum(CourseLevel)
  level?: CourseLevel;

  @IsOptional()
  @IsInt()
  @Min(1)
  page?: number;

  /**
   * Clamped, not rejected, above the cap. A client asking for 1000 means "as many as
   * possible", and answering that with a 400 helps nobody. The cap still holds — it
   * is what stops one request from selecting the whole table.
   */
  @Transform(({ value }): number | undefined => {
    if (value === undefined || value === null || value === '') return undefined;

    const parsed = Number(value);
    // NaN passes straight through as NaN so @IsInt rejects `?limit=abc` instead of
    // this transform turning it into a silent default.
    return Number.isFinite(parsed)
      ? Math.min(Math.trunc(parsed), MAX_PAGE_SIZE)
      : parsed;
  })
  @IsOptional()
  @IsInt()
  @Min(1)
  limit?: number;
}
