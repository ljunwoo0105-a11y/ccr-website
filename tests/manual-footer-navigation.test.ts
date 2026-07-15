import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const footerPath = new URL(
  "../src/components/sheet/ManualFooter.tsx",
  import.meta.url,
);

test("uses Next links for internal footer navigation", async () => {
  const source = await readFile(footerPath, "utf8");

  assert.match(source, /<Link\s+href=\{`\/#\$\{s\.id\}`\}/);
  assert.match(source, /<Link\s+href="\/#services"/);
  assert.doesNotMatch(source, /<a[\s\S]{0,160}href=(?:\{`\/#|"\/#)/);
});
