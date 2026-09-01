import { AuthUserDto } from './auth-user.dto';

export class AuthResponseDto {
  /** Send back as `Authorization: Bearer <token>`. */
  accessToken: string;
  expiresIn: number;
  user: AuthUserDto;
}
