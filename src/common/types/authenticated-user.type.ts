import { Role } from '@prisma/client';

/** What JwtStrategy.validate() puts on req.user. */
export interface AuthenticatedUser {
  userId: string;
  email: string;
  role: Role;
}
