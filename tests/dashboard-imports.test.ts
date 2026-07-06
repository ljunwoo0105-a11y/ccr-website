import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import test from "node:test";

const DASHBOARD_FILES = [
  "src/app/admin/page.tsx",
  "src/app/staff/(portal)/page.tsx",
] as const;

test("dashboard routes avoid importing the full AI client for spend totals", () => {
  for (const file of DASHBOARD_FILES) {
    const source = readFileSync(file, "utf8");
    assert.doesNotMatch(
      source,
      /@\/lib\/ai\/client/,
      `${file} should use the lightweight AI usage helper instead`
    );
  }
});

test("admin overview route uses a cached server data helper", () => {
  const pageSource = readFileSync("src/app/admin/page.tsx", "utf8");

  assert.match(pageSource, /@\/lib\/admin\/overview/);
  assert.doesNotMatch(pageSource, /@\/lib\/db/);
  assert.doesNotMatch(pageSource, /\bdb\./);
  assert.doesNotMatch(pageSource, /\bgetSetting\b/);

  const helperPath = "src/lib/admin/overview.ts";
  assert.ok(existsSync(helperPath), `${helperPath} should exist`);

  const helperSource = readFileSync(helperPath, "utf8");
  assert.match(helperSource, /unstable_cache/);
  assert.match(helperSource, /revalidate: ADMIN_OVERVIEW_REVALIDATE_SECONDS/);
  assert.match(helperSource, /select:\s*{/);
  assert.doesNotMatch(helperSource, /@\/lib\/ai\/client/);
});
