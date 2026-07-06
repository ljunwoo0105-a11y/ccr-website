import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { ok, fail } from "@/lib/api";
import {
  createSessionToken,
  verifyPassword,
  sessionCookieOptions,
  SESSION_COOKIE,
  type Role,
} from "@/lib/auth";
import {
  parseLoginRequest,
  redirectUrlForRequest,
  type LoginRequestInput,
} from "@/lib/login-request";
import { rateLimit, clientIp } from "@/lib/rate-limit";

function loginRedirect(req: Request, input: LoginRequestInput): NextResponse {
  return NextResponse.redirect(
    redirectUrlForRequest(req, input.next ?? "/staff"),
    { status: 303 }
  );
}

function loginFailure(req: Request, input: LoginRequestInput): NextResponse {
  if (!input.wantsHtmlRedirect) return fail("Invalid email or password", 401);
  const login = new URL("/staff/login", req.url);
  if (input.next) login.searchParams.set("next", input.next);
  login.searchParams.set("error", "invalid");
  return NextResponse.redirect(login, { status: 303 });
}

/**
 * Staff login. Rate limited per IP; identical error for unknown email and
 * wrong password so accounts can't be enumerated.
 */
export async function POST(req: Request) {
  const limited = rateLimit(`login:${clientIp(req)}`, 5, 15 * 60_000);
  if (!limited.ok) {
    return fail(
      `Too many login attempts. Try again in ${Math.max(1, Math.ceil(limited.retryAfterSeconds / 60))} minute(s).`,
      429
    );
  }

  const parsed = await parseLoginRequest(req);
  if (!parsed.ok) {
    if (!parsed.wantsHtmlRedirect) return fail(parsed.message, parsed.status);
    const login = new URL("/staff/login", req.url);
    if (parsed.next) login.searchParams.set("next", parsed.next);
    login.searchParams.set("error", "invalid");
    return NextResponse.redirect(login, { status: 303 });
  }

  const { data } = parsed;
  const email = data.email;
  const user = await db.user.findUnique({ where: { email } });
  if (!user || !user.active) {
    return loginFailure(req, data);
  }

  const valid = await verifyPassword(data.password, user.passwordHash);
  if (!valid) {
    return loginFailure(req, data);
  }

  const token = await createSessionToken({
    sub: user.id,
    email: user.email,
    name: user.name,
    role: user.role as Role,
  });
  cookies().set(SESSION_COOKIE, token, sessionCookieOptions());

  if (data.wantsHtmlRedirect) return loginRedirect(req, data);
  return ok({ role: user.role });
}
