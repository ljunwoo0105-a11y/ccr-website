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
