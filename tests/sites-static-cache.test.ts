import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const nextConfigPath = new URL("../next.config.mjs", import.meta.url);

test("uses a deterministic asset hash salt for Sites static chunks", async () => {
  // Given: a custom domain edge may cache misses for immutable chunk URLs.
  const source = await readFile(nextConfigPath, "utf8");

  // When: the Next build emits shared runtime chunks.
  // Then: their names include the current deployment salt and bypass stale 404s.
  assert.match(source, /hashSalt = "ccr-dark-default-v2"/);
});
