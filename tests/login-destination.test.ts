import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

import {
  defaultLoginDestination,
  safeLoginDestination,
} from "../src/lib/login-destination";

test("permits only root and staff/admin descendants", () => {
  // Given: safe staff return destinations and unsafe lookalikes.
  const allowed = ["/", "/staff", "/staff/quote?from=%2F", "/admin/users#top"];
  const rejected = [
    "https://evil.example/staff",
    "//evil.example/staff",
    "\\\\evil.example\\staff",
    "/staff.evil.example",
    "/staffish",
    "/admin%2fusers",
    "/staff%5creports",
    "/staff/login",
    "/staff/login?next=/staff/login",
  ];

  // When: destinations are normalized through the shared helper.
  const allowedResults = allowed.map((value) => safeLoginDestination(value));
  const rejectedResults = rejected.map((value) => safeLoginDestination(value));

  // Then: only exact root/staff/admin destinations survive.
  assert.deepEqual(allowedResults, allowed);
  assert.deepEqual(rejectedResults, rejected.map(() => null));
});

test("fresh logins default staff to the landing page and admins to the console", () => {
  // Given/When: no explicit next was carried through the login flow.
  // Then: staff land on "/" (pricing unlocks there); admins get the console.
  assert.equal(defaultLoginDestination("STAFF"), "/");
  assert.equal(defaultLoginDestination("ADMIN"), "/admin");
  assert.equal(defaultLoginDestination("anything-else"), "/");
});

test("LoginForm uses the shared login destination helper", () => {
  // Given: client and server login boundaries must share one allow-list.
  const source = readFileSync("src/components/staff/LoginForm.tsx", "utf8");

  // When/Then: the component imports and calls the shared helper instead of
  // carrying a separate prefix check.
  assert.match(source, /from ["']@\/lib\/login-destination["']/);
  assert.match(source, /safeLoginDestination\(next\)/);
  assert.doesNotMatch(source, /startsWith\(["']\/staff["']\)/);
});
