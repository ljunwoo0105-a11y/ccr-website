import "server-only";
import { NextResponse } from "next/server";
import { ZodError, type ZodSchema } from "zod";
import { requireUser, type Role } from "@/lib/auth";

const PRIVATE_CACHE_CONTROL = "private, no-store";

function withPrivateCacheHeaders(init?: ResponseInit): ResponseInit {
  const headers = new Headers(init?.headers);
  headers.set("Cache-Control", PRIVATE_CACHE_CONTROL);
  const vary = headers.get("Vary");
  if (!vary) {
    headers.set("Vary", "Cookie");
  } else if (!vary.toLowerCase().split(",").map((item) => item.trim()).includes("cookie")) {
    headers.set("Vary", `${vary}, Cookie`);
  }
  return { ...init, headers };
}

/** Standard JSON success envelope. */
export function ok<T>(data: T, init?: ResponseInit) {
  return NextResponse.json({ ok: true, data }, init);
}

/** Standard JSON error envelope. Never leak internals in `message`. */
export function fail(message: string, status = 400, extra?: ResponseInit) {
  return NextResponse.json({ ok: false, error: message }, { status, ...extra });
}

export function privateOk<T>(data: T, init?: ResponseInit) {
  return ok(data, withPrivateCacheHeaders(init));
}

export function privateFail(message: string, status = 400, extra?: ResponseInit) {
  return fail(message, status, withPrivateCacheHeaders(extra));
}

/** Parse + validate a JSON body against a Zod schema. */
export async function parseBody<T>(
  req: Request,
  schema: ZodSchema<T>
): Promise<{ data: T; error: null } | { data: null; error: NextResponse }> {
  let raw: unknown;
  try {
    raw = await req.json();
  } catch {
    return { data: null, error: fail("Invalid JSON body", 400) };
  }
  try {
    return { data: schema.parse(raw), error: null };
  } catch (e) {
    const message =
      e instanceof ZodError
        ? e.errors.map((i) => `${i.path.join(".")}: ${i.message}`).join("; ")
        : "Invalid request";
    return { data: null, error: fail(message, 422) };
  }
}

/**
 * Authentication guard for protected route handlers. Middleware already
 * screens these paths, but each handler re-checks against the database.
 */
export async function guard(minRole: Role = "STAFF") {
  const user = await requireUser(minRole);
  if (!user) {
    return {
      user: null,
      error: privateFail(minRole === "ADMIN" ? "Forbidden" : "Unauthorised", minRole === "ADMIN" ? 403 : 401),
    };
  }
  return { user, error: null };
}
