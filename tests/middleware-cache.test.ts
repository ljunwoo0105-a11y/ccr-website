import assert from "node:assert/strict";
import test from "node:test";

import { SignJWT } from "jose";
import { NextRequest } from "next/server";

import { middleware } from "../src/middleware";

const secret = "0123456789abcdef0123456789abcdef";

function request(path: string, token?: string): NextRequest {
  const headers = new Headers();
  if (token) headers.set("cookie", `ccr_session=${token}`);
  return new NextRequest(`http://127.0.0.1:3002${path}`, { headers });
}

async function staffToken(): Promise<string> {
  return new SignJWT({ sub: "staff-user", role: "STAFF" })
    .setProtectedHeader({ alg: "HS256" })
    .sign(new TextEncoder().encode(secret));
}

async function adminToken(): Promise<string> {
  return new SignJWT({ sub: "admin-user", role: "ADMIN" })
    .setProtectedHeader({ alg: "HS256" })
    .sign(new TextEncoder().encode(secret));
}

test("anonymous protected API responses are private no-store and vary on Cookie", async () => {
  // Given: no session cookie on a protected staff API path.
  process.env.AUTH_SECRET = secret;

  // When: middleware rejects the request.
  const response = await middleware(request("/api/staff/session"));

  // Then: the auth decision is not cacheable across users.
  assert.equal(response.status, 401);
  assert.equal(response.headers.get("Cache-Control"), "private, no-store");
  assert.equal(response.headers.get("Vary"), "Cookie");
});

test("staff-on-admin API responses are private no-store and vary on Cookie", async () => {
  // Given: a valid STAFF token on an admin API path.
  process.env.AUTH_SECRET = secret;
  const token = await staffToken();

  // When: middleware denies the admin request.
  const response = await middleware(request("/api/admin/users", token));

  // Then: the 403 is not cacheable across users.
  assert.equal(response.status, 403);
  assert.equal(response.headers.get("Cache-Control"), "private, no-store");
  assert.equal(response.headers.get("Vary"), "Cookie");
});

test("anonymous protected page redirects are private no-store and preserve safe next", async () => {
  // Given: an anonymous staff page request.
  process.env.AUTH_SECRET = secret;

  // When: middleware redirects to login.
  const response = await middleware(request("/staff"));

  // Then: the redirect is private and sends the user back to the safe root.
  assert.equal(response.status, 307);
  assert.equal(response.headers.get("Cache-Control"), "private, no-store");
  assert.equal(response.headers.get("Vary"), "Cookie");
  assert.equal(response.headers.get("location"), "http://localhost:3002/staff/login?next=%2Fstaff");
});

test("STAFF session on portal pages is sent to the landing page", async () => {
  // Given: back-office pages are admin-only; staff pricing lives on "/".
  process.env.AUTH_SECRET = secret;
  const token = await staffToken();

  for (const path of ["/staff", "/staff/price-list", "/admin", "/admin/users"]) {
    // When: a STAFF session requests a back-office page.
    const response = await middleware(request(path, token));

    // Then: they land on the public home page, uncacheable across users.
    assert.equal(response.status, 307, path);
    assert.equal(response.headers.get("location"), "http://localhost:3002/", path);
    assert.equal(response.headers.get("Cache-Control"), "private, no-store");
  }
});

test("STAFF session still passes to staff APIs for landing-page pricing", async () => {
  // Given: the landing-page pricing widgets call /api/staff/* with STAFF.
  process.env.AUTH_SECRET = secret;
  const token = await staffToken();

  // When: a STAFF session hits a staff API path.
  const response = await middleware(request("/api/staff/session", token));

  // Then: middleware passes it through (the route re-checks role itself).
  assert.equal(response.status, 200);
  assert.equal(response.headers.get("Cache-Control"), "private, no-store");
});

test("ADMIN session passes to portal and admin pages", async () => {
  // Given: the back office remains fully available to admins.
  process.env.AUTH_SECRET = secret;
  const token = await adminToken();

  for (const path of ["/staff", "/admin/users"]) {
    // When: an ADMIN session requests a back-office page.
    const response = await middleware(request(path, token));

    // Then: the request continues to the page.
    assert.equal(response.status, 200, path);
  }
});
