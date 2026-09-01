import * as bcrypt from 'bcrypt';

const COST = 12;

/** bcrypt silently truncates anything past 72 bytes, so DTOs must cap length there. */
export const MAX_PASSWORD_LENGTH = 72;

/**
 * Hash of a random string nobody holds. Compared against when an email is not found,
 * so a failed login costs the same time whether or not the account exists.
 */
export const DUMMY_HASH =
  '$2b$12$aiHYweqoBFz9i0aMVhuS0ebrKZlsG1EiTIZ7IFMNs2URk9q1jvVZq';

export function hashPassword(plain: string): Promise<string> {
  return bcrypt.hash(plain, COST);
}

export function verifyPassword(plain: string, hash: string): Promise<boolean> {
  return bcrypt.compare(plain, hash);
}
