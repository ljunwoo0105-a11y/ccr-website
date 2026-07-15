import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const headerPath = new URL(
  "../src/components/sheet/ManualHeader.tsx",
  import.meta.url
);

test("keeps the compact header navigation through the 1024px viewport", async () => {
  const source = await readFile(headerPath, "utf8");

  assert.match(source, /matchMedia\("\(min-width: 1280px\)"\)/);
  assert.match(source, /hidden items-center gap-5 xl:flex/);
  assert.match(source, /mnl-chip xl:hidden/);
  assert.match(source, /shadow-\[0_14px_0_0_rgb\(var\(--carbon-950\)\/0\.08\)\] xl:hidden/);

  assert.doesNotMatch(source, /matchMedia\("\(min-width: 1024px\)"\)/);
  assert.doesNotMatch(source, /hidden items-center gap-5 lg:flex/);
});
