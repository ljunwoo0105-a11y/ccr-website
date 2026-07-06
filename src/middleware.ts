import { NextRequest, NextResponse } from "next/server";
import { jwtVerify } from "jose";

/**
 * Edge gatekeeper for staff/admin surfaces.
 *
 * This is the first line of defence only — every protected API route ALSO
 * re-validates the session against the database via `requireUser()` in
 * src/lib/auth.ts (middleware can't reach Prisma on the edge runtime).
 */

const SESSION_COOKIE = "ccr_session";

async function verify(token: string) {
  try {
    const secret = new TextEncoder().encode(process.env.AUTH_SECRET ?? "");
    const { payload } = await jwtVerify(token, secret);
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
    return NextResponse.next();
  }

  const token = req.cookies.get(SESSION_COOKIE)?.value;
  const session = token ? await verify(token) : null;

  if (!session?.sub) {
    if (pathname.startsWith("/api/")) {
      return NextResponse.json({ error: "Unauthorised" }, { status: 401 });
    }
    const login = new URL("/staff/login", req.url);
    login.searchParams.set("next", pathname);
    return NextResponse.redirect(login);
  }

  if (isAdminArea && session.role !== "ADMIN") {
    if (pathname.startsWith("/api/")) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    return NextResponse.redirect(new URL("/staff", req.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/staff/:path*", "/admin/:path*", "/api/staff/:path*", "/api/admin/:path*"],
};
