import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const cookieConsumers = [
  "src/app/api/staff/login/route.ts",
  "src/app/api/staff/logout/route.ts",
  "src/lib/auth.ts",
] as const;

const asyncContextConsumers = [
  "src/app/api/admin/ai-models/[id]/route.ts",
  "src/app/api/admin/diagnoses/[id]/route.ts",
  "src/app/api/admin/policies/[id]/route.ts",
  "src/app/api/admin/records/intakes/[id]/route.ts",
  "src/app/api/admin/records/repair-forms/[id]/route.ts",
  "src/app/api/admin/reviews/[id]/route.ts",
  "src/app/api/admin/users/[id]/reset-password/route.ts",
  "src/app/api/admin/users/[id]/route.ts",
  "src/app/api/staff/intakes/[id]/route.ts",
  "src/app/api/staff/leads/[id]/resend/route.ts",
  "src/app/api/staff/leads/[id]/route.ts",
  "src/app/api/staff/parts/[id]/route.ts",
  "src/app/api/staff/quote/[id]/resend/route.ts",
  "src/app/admin/intake/[id]/page.tsx",
  "src/app/admin/intake/new/page.tsx",
  "src/app/staff/login/page.tsx",
] as const;

test("awaits the Next request cookie store before reading or mutating it", async () => {
  // Given: every server module that calls the asynchronous Next cookies API.
  const sources = await Promise.all(
    cookieConsumers.map(async (file) => ({ file, source: await readFile(file, "utf8") }))
  );

  // When: the modules are checked for direct Promise member access.
  const directAccess = sources.filter(({ source }) =>
    /cookies\(\)\.(?:get|set|delete)\(/u.test(source)
  );

  // Then: each call awaits cookies() before using the returned store.
  assert.deepEqual(
    directAccess.map(({ file }) => file),
    []
  );
  for (const { source } of sources) {
    assert.match(source, /await cookies\(\)/u);
  }
});

test("models dynamic route params and page search params as promises", async () => {
  // Given: every App Router module with dynamic params or search params.
  const sources = await Promise.all(
    asyncContextConsumers.map(async (file) => ({
      file,
      source: await readFile(file, "utf8"),
    }))
  );

  // When: the modules are checked for synchronous request context types.
  const synchronousContexts = sources.filter(({ source }) =>
    /(?:params|searchParams)\s*:\s*\{/u.test(source)
  );

  // Then: every context is asynchronous and awaited before use.
  assert.deepEqual(
    synchronousContexts.map(({ file }) => file),
    []
  );
  for (const { source } of sources) {
    assert.match(source, /Promise</u);
  }
});
