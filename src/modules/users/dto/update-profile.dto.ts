import { Transform } from 'class-transformer';
import { IsEmail, IsOptional, IsString, Length, Matches, MaxLength } from 'class-validator';

/**
 * Self-service profile edit. Avatar is intentionally absent — upload/storage is a
 * separate piece of work; this DTO only covers fields the account page can persist today.
 *
 * Both fields are optional so a client can patch one without re-sending the other.
 * The service rejects an empty body rather than treating it as a no-op, so a buggy
 * client does not get a silent 200.
 */
export class UpdateProfileDto {
  @IsOptional()
  @Transform(({ value }) =>
    typeof value === 'string' ? value.trim().toLowerCase() : value,
  )
  @IsEmail({}, { message: 'email must be a valid address' })
  @MaxLength(255)
  email?: string;

  @IsOptional()
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @IsString()
  @Length(2, 100)
  @Matches(/^[a-zA-Z0-9._-]+$/, {
    message:
      'username may only contain letters, digits, dot, underscore and hyphen',
  })
  username?: string;
}
