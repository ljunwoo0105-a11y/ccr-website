import assert from "node:assert/strict";
import { stat } from "node:fs/promises";
import test from "node:test";
import sharp from "sharp";

const LOGO_PATH = "public/images/ccr/ccr-logo-4k.png";
const MARK_PATH = "public/images/ccr/ccr-mark-4k.png";
const LOGO_ASSETS = [
  { label: "full logo", path: LOGO_PATH },
  { label: "mark logo", path: MARK_PATH },
] as const;

for (const asset of LOGO_ASSETS) {
  test(`CCR ${asset.label} asset is a transparent 4K PNG`, async () => {
    const metadata = await sharp(asset.path).metadata();
    const file = await stat(asset.path);

    assert.equal(metadata.format, "png");
    assert.equal(metadata.width, 4096);
    assert.equal(metadata.height, 4096);
    assert.equal(metadata.hasAlpha, true);
    assert.ok(file.size > 0);
  });
}
