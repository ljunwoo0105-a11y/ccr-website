import "server-only";
import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import bcrypt from "bcryptjs";
import { db } from "@/lib/db";

/**
 * Session/auth for the staff portal and admin console.
 *
 * - Sessions are stateless JWTs (HS256, `jose`) carried in an httpOnly,
 *   sameSite=lax cookie — never readable by client-side JS.
 * - `src/middleware.ts` verifies the token at the edge for /staff, /admin
 *   and their APIs; route handlers re-check with `requireUser()` which also
 *   confirms the account still exists and is active in the database.
 */

export const SESSION_COOKIE = "ccr_session";
const SESSION_TTL_HOURS = 12;

export type Role = "ADMIN" | "STAFF";

export interface SessionPayload {
  sub: string; // user id
  email: string;
  name: string;
  role: Role;
}

function getSecret(): Uint8Array {
  const secret = process.env.AUTH_SECRET;
  if (!secret || secret.length < 32) {
    throw new Error(
      "AUTH_SECRET must be set to a random string of at least 32 characters."
    );
  }
  return new TextEncoder().encode(secret);
}

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12);
}

export async function verifyPassword(
  password: string,
  hash: string
): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export async function createSessionToken(
  payload: SessionPayload
): Promise<string> {
  return new SignJWT({ ...payload })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(`${SESSION_TTL_HOURS}h`)
    .sign(getSecret());
}

export async function verifySessionToken(
  token: string
): Promise<SessionPayload | null> {
  try {
    const { payload } = await jwtVerify(token, getSecret());
    if (
      typeof payload.sub !== "string" ||
      (payload.role !== "ADMIN" && payload.role !== "STAFF")
    ) {
      return null;
    }
    return {
      sub: payload.sub,
      email: String(payload.email ?? ""),
      name: String(payload.name ?? ""),
      role: payload.role as Role,
    };
  } catch {
    return null;
  }
}

/** Session from the request cookie (no DB hit). Null when absent/invalid. */
export async function getSession(): Promise<SessionPayload | null> {
  const token = cookies().get(SESSION_COOKIE)?.value;
  if (!token) return null;
  return verifySessionToken(token);
}

/**
 * Strict check for API routes and server components: token valid AND the
 * account still exists, is active, and holds a sufficient role.
 * Role hierarchy: ADMIN > STAFF.
 */
export async function requireUser(minRole: Role = "STAFF") {
  const session = await getSession();
  if (!session) return null;
  const user = await db.user.findUnique({ where: { id: session.sub } });
  if (!user || !user.active) return null;
  if (minRole === "ADMIN" && user.role !== "ADMIN") return null;
  return { id: user.id, email: user.email, name: user.name, role: user.role as Role };
}

export function sessionCookieOptions() {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    path: "/",
    maxAge: SESSION_TTL_HOURS * 60 * 60,
  };
}
