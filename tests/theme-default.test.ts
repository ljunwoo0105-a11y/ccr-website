import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const layoutPath = new URL("../src/app/layout.tsx", import.meta.url);
const togglePath = new URL(
  "../src/components/sheet/ThemeToggle.tsx",
  import.meta.url,
);

test("defaults the public manual to dark when no saved theme exists", async () => {
  // Given: the root boot script and interactive toggle source.
  const [layoutSource, toggleSource] = await Promise.all([
    readFile(layoutPath, "utf8"),
    readFile(togglePath, "utf8"),
  ]);

  // When: no ccr-theme value is available.
  // Then: both first paint and bfcache restoration fall back to dark.
  assert.match(layoutSource, /if\(t!=="dark"&&t!=="light"\)\{t="dark"\}/);
  assert.match(toggleSource, /const DEFAULT_THEME = "dark";/);
  assert.match(toggleSource, /applyTheme\(DEFAULT_THEME\);/);
});
