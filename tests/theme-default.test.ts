import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const layoutPath = new URL("../src/app/layout.tsx", import.meta.url);
const togglePath = new URL(
  "../src/components/sheet/ThemeToggle.tsx",
  import.meta.url,
);

test("defaults the public manual to dark when no saved current theme exists", async () => {
  // Given: the root boot script and interactive toggle source.
  const [layoutSource, toggleSource] = await Promise.all([
    readFile(layoutPath, "utf8"),
    readFile(togglePath, "utf8"),
  ]);

  // When: no current ccr-theme-v2 value is available.
  // Then: both first paint and bfcache restoration fall back to dark.
  assert.match(layoutSource, /localStorage\.getItem\("ccr-theme-v2"\)/);
  assert.doesNotMatch(layoutSource, /localStorage\.getItem\("ccr-theme"\)/);
  assert.match(toggleSource, /const STORAGE_KEY = "ccr-theme-v2";/);
  assert.match(layoutSource, /if\(t!=="dark"&&t!=="light"\)\{t="dark"\}/);
  assert.match(toggleSource, /const DEFAULT_THEME = "dark";/);
  assert.match(toggleSource, /applyTheme\(DEFAULT_THEME\);/);
});
