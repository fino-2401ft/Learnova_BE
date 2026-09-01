import { Transform } from 'class-transformer';
import { IsEmail, IsString, Length, Matches, MaxLength } from 'class-validator';

import { MAX_PASSWORD_LENGTH } from '@/common/utils/password.util';

export class RegisterDto {
  @Transform(({ value }) =>
    typeof value === 'string' ? value.trim().toLowerCase() : value,
  )
  @IsEmail({}, { message: 'email must be a valid address' })
  @MaxLength(255)
  email: string;

  @IsString()
  @Length(8, MAX_PASSWORD_LENGTH, {
    message: `password must be between 8 and ${MAX_PASSWORD_LENGTH} characters`,
  })
  @Matches(/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, {
    message:
      'password must contain a lowercase letter, an uppercase letter and a digit',
  })
  password: string;

  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @IsString()
  @Length(2, 100)
  @Matches(/^[a-zA-Z0-9._-]+$/, {
    message:
      'username may only contain letters, digits, dot, underscore and hyphen',
  })
  username: string;
}
