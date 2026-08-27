import { NextRequest, NextResponse } from "next/server";
import { jwtVerify } from "jose";
import {
  AUTH_TOKEN_AUDIENCE,
  AUTH_TOKEN_ISSUER,
  authSecretBytes,
} from "@/lib/auth-token";

/**
 * Edge gatekeeper for staff/admin surfaces.
 *
 * Back-office PAGES (/staff portal + /admin console) are admin-only; a STAFF
 * session's whole surface is the pricing section on the public landing page,
 * so staff hitting a back-office page are sent to "/". /api/staff stays open
 * to any authenticated session — the landing-page pricing widgets call it,
 * and each route re-checks the required role itself.
 *
 * This is the first line of defence only — every protected API route ALSO
 * re-validates the session against the database via `requireUser()` in
 * src/lib/auth.ts (middleware can't reach Prisma on the edge runtime).
 */

const SESSION_COOKIE = "ccr_session";
const PRIVATE_CACHE_CONTROL = "private, no-store";

function privateResponse(response: NextResponse): NextResponse {
  response.headers.set("Cache-Control", PRIVATE_CACHE_CONTROL);
  response.headers.set("Vary", "Cookie");
  return response;
}

async function verify(token: string) {
  try {
    const { payload } = await jwtVerify(token, authSecretBytes(), {
      algorithms: ["HS256"],
      issuer: AUTH_TOKEN_ISSUER,
      audience: AUTH_TOKEN_AUDIENCE,
    });
    return payload as { sub?: string; role?: string };
  } catch {
    return null;
  }
}

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  const isStaffArea =
    pathname.startsWith("/staff") || pathname.startsWith("/api/staff");
  const isAdminArea =
    pathname.startsWith("/admin") || pathname.startsWith("/api/admin");

  if (!isStaffArea && !isAdminArea) return NextResponse.next();

  // The login screen and login API are the only unauthenticated staff routes.
  if (pathname === "/staff/login" || pathname === "/api/staff/login") {
    return privateResponse(NextResponse.next());
  }

  const token = req.cookies.get(SESSION_COOKIE)?.value;
  const session = token ? await verify(token) : null;

  if (!session?.sub) {
    if (pathname.startsWith("/api/")) {
      return privateResponse(NextResponse.json({ error: "Unauthorised" }, { status: 401 }));
    }
    const login = new URL("/staff/login", req.url);
    login.searchParams.set("next", pathname);
    return privateResponse(NextResponse.redirect(login));
  }

  const isBackOfficePage =
    (isAdminArea || isStaffArea) && !pathname.startsWith("/api/");
  if (isBackOfficePage && session.role !== "ADMIN") {
    return privateResponse(NextResponse.redirect(new URL("/", req.url)));
  }
  if (isAdminArea && session.role !== "ADMIN") {
    return privateResponse(NextResponse.json({ error: "Forbidden" }, { status: 403 }));
  }

  return privateResponse(NextResponse.next());
}

export const config = {
  matcher: ["/staff/:path*", "/admin/:path*", "/api/staff/:path*", "/api/admin/:path*"],
};
