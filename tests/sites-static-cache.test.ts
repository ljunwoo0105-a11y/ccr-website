import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const nextConfigPath = new URL("../next.config.mjs", import.meta.url);
const sitesBuildPath = new URL("../scripts/build-sites.mjs", import.meta.url);

test("uses a deterministic asset hash salt for Sites static chunks", async () => {
  // Given: a custom domain edge may cache misses for immutable chunk URLs.
  const source = await readFile(nextConfigPath, "utf8");

  // When: the Next build emits shared runtime chunks.
  // Then: their names include the current deployment salt and bypass stale 404s.
  assert.match(source, /hashSalt = "ccr-dark-default-v3"/);
});

test("packages dynamic routes and versioned assets from one OpenNext build", async () => {
  // Given: every public, staff, admin, and API route now runs on Sites.
  const source = await readFile(sitesBuildPath, "utf8");

  // When: the deployable Sites artifact is assembled.
  // Then: the Worker entrypoint and its exact assets come from the same build.
  assert.match(source, /openNextCli, "build", "--skipNextBuild"/);
  assert.match(
    source,
    /join\(rawServerDir, "open-next-worker\.js"\)/,
  );
  assert.match(source, /Symbol\.for\("ccr\.worker\.env"\)/);
  assert.match(source, /openNextWorker\.fetch\(request, env, ctx\)/);
  assert.match(source, /query_compiler_bg\.wasm/);
  assert.match(source, /wranglerCli,[\s\S]*"deploy",[\s\S]*"--dry-run"/);
  assert.match(
    source,
    /cp\(join\(openNextDir, "assets"\), assetsDir, \{ recursive: true \}\)/,
  );
  assert.doesNotMatch(source, /CCR_NODE_ORIGIN|proxyToNode/);
});
