import { Transform } from 'class-transformer';
import { IsEmail, IsNotEmpty, IsString, MaxLength } from 'class-validator';

import { MAX_PASSWORD_LENGTH } from '@/common/utils/password.util';

export class LoginDto {
  @Transform(({ value }) =>
    typeof value === 'string' ? value.trim().toLowerCase() : value,
  )
  @IsEmail({}, { message: 'email must be a valid address' })
  @MaxLength(255)
  email: string;

  @IsString()
  @IsNotEmpty({ message: 'password must not be empty' })
  @MaxLength(MAX_PASSWORD_LENGTH)
  password: string;
}
