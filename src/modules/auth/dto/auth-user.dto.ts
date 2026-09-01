import { Role, User } from '@prisma/client';

export class AuthUserDto {
  userId: string;
  username: string;
  email: string;
  role: Role;
  avatarUrl: string | null;
}

export function toAuthUserDto(user: User): AuthUserDto {
  return {
    userId: user.userId,
    username: user.username,
    email: user.email,
    role: user.role,
    avatarUrl: user.avatarUrl,
  };
}
