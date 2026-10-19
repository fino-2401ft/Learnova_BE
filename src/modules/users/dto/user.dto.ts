import { Role, User } from '@prisma/client';

/**
 * A person as everyone else is allowed to see them.
 *
 * `email` is deliberately absent. It is the login identifier, and an endpoint that
 * returns it turns any account into a way to harvest addresses. `username` is the
 * public handle — it is what the whole product already shows next to courses and
 * messages, so it is what a directory search may return.
 *
 * Same shape as MessageAuthorDto plus `role`, so the frontend renders both with one
 * avatar component.
 */
export interface UserSummaryDto {
  userId: string;
  username: string;
  avatarUrl: string | null;
  /** Lets the picker label mentors without a second request. */
  role: Role;
}

/**
 * The caller's own account — the only place `email` is allowed to leave the API
 * outside of auth responses. Same fields as AuthUserDto so the frontend can swap
 * the session user without a second shape.
 */
export interface MeDto {
  userId: string;
  username: string;
  email: string;
  role: Role;
  avatarUrl: string | null;
}

export function toMeDto(user: User): MeDto {
  return {
    userId: user.userId,
    username: user.username,
    email: user.email,
    role: user.role,
    avatarUrl: user.avatarUrl,
  };
}
