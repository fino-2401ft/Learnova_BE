import { Role } from '@prisma/client';

/** What we sign into the access token. Shared by the signer and the verifier so a
 *  field-name drift becomes a compile error instead of a runtime undefined. */
export interface JwtPayload {
  sub: string; //id
  email: string;
  role: Role;
}

/** What comes back after verification: jsonwebtoken adds iat/exp itself. */
export type JwtPayloadWithClaims = JwtPayload & { iat: number; exp: number };
