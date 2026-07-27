import assert from "node:assert/strict";
import test from "node:test";

import { parseLoginRequest, redirectUrlForRequest } from "../src/lib/login-request";

async function parsedNextFor(next: string): Promise<string | null> {
  const req = new Request("http://127.0.0.1:3000/api/staff/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      email: "staff@ccr.local",
      password: "CCRLocal2026!",
      next,
    }),
  });

  const result = await parseLoginRequest(req);

  if (result.ok) return result.data.next;
  assert.fail(result.message);
}

test("parses form login requests when JavaScript submit does not run", async () => {
  const body = new URLSearchParams({
    email: " STAFF@CCR.LOCAL ",
    password: "CCRLocal2026!",
    next: "/staff",
  });
  const req = new Request("http://127.0.0.1:3000/api/staff/login", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body,
  });

  const result = await parseLoginRequest(req);

  assert.equal(result.ok, true);
  if (result.ok) {
    assert.deepEqual(result.data, {
      email: "staff@ccr.local",
      password: "CCRLocal2026!",
      // /staff pages no longer exist, so the destination falls back to the
      // role default instead of surviving the parse.
      next: null,
      wantsHtmlRedirect: true,
    });
  }
});

test("parses JSON login requests for hydrated client submits", async () => {
  const req = new Request("http://127.0.0.1:3000/api/staff/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      email: " STAFF@CCR.LOCAL ",
      password: "CCRLocal2026!",
    }),
  });

  const result = await parseLoginRequest(req);

  assert.equal(result.ok, true);
  if (result.ok) {
    assert.deepEqual(result.data, {
      email: "staff@ccr.local",
      password: "CCRLocal2026!",
      next: null,
      wantsHtmlRedirect: false,
    });
  }
});

test("builds login redirects from the browser origin when present", () => {
  const req = new Request("http://localhost:3000/api/staff/login", {
    headers: { origin: "http://127.0.0.1:3000" },
  });

  const url = redirectUrlForRequest(req, "/staff");

  assert.equal(url.href, "http://127.0.0.1:3000/staff");
});

test("accepts only root and admin console descendants as shared login destinations", async () => {
  // Given: login destinations, including retired /staff paths that must now
  // fall back to the role default rather than land on a 404.
  const destinations = [
    "/",
    "/staff",
    "/staff/intake/new?from=login",
    "/admin",
    "/admin/users#invite",
  ];
  const parsedDestinations: Array<readonly [string, string | null]> = [];

  // When: each destination is submitted through the public login request parser.
  for (const destination of destinations) {
    parsedDestinations.push([destination, await parsedNextFor(destination)]);
  }

  // Then: only root and console paths survive the parse.
  assert.deepEqual(parsedDestinations, [
    ["/", "/"],
    ["/staff", null],
    ["/staff/intake/new?from=login", null],
    ["/admin", "/admin"],
    ["/admin/users#invite", "/admin/users#invite"],
  ]);
});

test("rejects external, encoded, backslash, and lookalike login destinations", async () => {
  // Given: malformed next values that must not cross the login boundary.
  const rejectedDestinations = [
    "https://evil.example/staff",
    "//evil.example/staff",
    "\\\\evil.example\\staff",
    "/\\evil",
    "/%2fadmin",
    "/admin%2fusers",
    "/staff%5creports",
    "/staff.evil.example",
    "/staffish",
    "/administrator",
  ];

  // When/Then: each value is parsed to a null destination, never a redirect.
  for (const destination of rejectedDestinations) {
    assert.equal(
      await parsedNextFor(destination),
      null,
      `${destination} should be rejected as an unsafe login destination`
    );
  }
});
