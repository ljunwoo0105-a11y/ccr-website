import assert from "node:assert/strict";
import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { extname, join, sep } from "node:path";
import test from "node:test";

const SOURCE_SURFACES = [
  "src/app/(public)",
  "src/components/public",
  "src/components/sheet",
  "src/components/staff/StaffPricingWorkbench.tsx",
  "src/components/staff/pricing-workbench",
] as const;

const BUILD_SURFACES = ["dist/assets"] as const;

const SCANNED_EXTENSIONS = new Set([
  ".cjs",
  ".css",
  ".html",
  ".js",
  ".json",
  ".mjs",
  ".rsc",
  ".ts",
  ".tsx",
]);

const SEEDED_FINGERPRINTS = [
  { model: "iPhone 15", price: "219" },
  { model: "iPad Air 5", price: "249" },
  { model: "MacBook Air M1", price: "229" },
  { model: "Mini 3 Pro", price: "289" },
] as const;

const STATIC_PRICE_CONSTANT_PATTERN =
  /\b(?:const|let|var)\s+\w*(?:price|catalog|parts)\w*\s*=\s*(?:\[[\s\S]{0,300}\]|\{[\s\S]{0,300}\})/i;

const SERVER_MODULE_PATTERN = /@\/(?:lib\/(?:db|pricing|pricing-match)|app\/api\/staff|prisma)/;

function filesUnder(root: string): string[] {
  const pending = [root];
  const files: string[] = [];

  while (pending.length > 0) {
    const current = pending.pop();
    if (current === undefined) continue;

    const stats = statSync(current);
    if (stats.isDirectory()) {
      for (const entry of readdirSync(current)) {
        pending.push(join(current, entry));
      }
      continue;
    }

    if (SCANNED_EXTENSIONS.has(extname(current))) files.push(current);
  }

  return files.sort();
}

function safeFilesUnder(root: string): string[] {
  if (!existsSync(root)) return [];
  return filesUnder(root);
}

function isAnonymousPublicBuild(file: string): boolean {
  const normalized = file.split(sep).join("/");
  return (
    !normalized.includes("/app/staff/") &&
    !normalized.includes("/app/admin/") &&
    !normalized.includes("/pages/staff/") &&
    !normalized.includes("/pages/admin/")
  );
}

function leakedFingerprints(file: string): string[] {
  const source = readFileSync(file, "utf8");
  const hits: string[] = [];
  for (const fingerprint of SEEDED_FINGERPRINTS) {
    const modelThenPrice = new RegExp(
      `${fingerprint.model.replaceAll(" ", "\\s+")}[\\s\\S]{0,240}\\b${fingerprint.price}\\b`
    );
    const priceThenModel = new RegExp(
      `\\b${fingerprint.price}\\b[\\s\\S]{0,240}${fingerprint.model.replaceAll(" ", "\\s+")}`
    );
    if (modelThenPrice.test(source) || priceThenModel.test(source)) {
      hits.push(`${file}: ${fingerprint.model} + ${fingerprint.price}`);
    }
  }
  return hits;
}

function serializedCatalogHits(file: string): string[] {
  const source = readFileSync(file, "utf8");
  const hits: string[] = [];
  for (const fingerprint of SEEDED_FINGERPRINTS) {
    const modelValue = fingerprint.model.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const priceValue = fingerprint.price.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const patterns = [
      new RegExp(
        `["']model["']\\s*:\\s*["']${modelValue}["'][\\s\\S]{0,240}["']sellPrice["']\\s*:\\s*${priceValue}`
      ),
      new RegExp(
        `model\\s*:\\s*["']${modelValue}["'][\\s\\S]{0,240}sellPrice\\s*:\\s*${priceValue}`
      ),
    ];
    if (patterns.some((pattern) => pattern.test(source))) {
      hits.push(`${file}: serialized ${fingerprint.model} sell price`);
    }
  }
  return hits;
}

function serverStaticHits(file: string): string[] {
  const source = readFileSync(file, "utf8");
  const hits: string[] = [];
  if (SERVER_MODULE_PATTERN.test(source)) {
    hits.push(`${file}: public source imports server pricing module`);
  }
  if (STATIC_PRICE_CONSTANT_PATTERN.test(source)) {
    hits.push(`${file}: static price/catalog constant`);
  }

  return hits;
}

test("keeps anonymous public source free of seeded price fingerprints", () => {
  // Given: the public source roots and current built asset surface.
  for (const surface of SOURCE_SURFACES) {
    assert.ok(existsSync(surface), `${surface} should exist for leak scanning`);
  }

  // When: public source files are scanned for real seeded model+price pairs.
  const leaks = SOURCE_SURFACES.flatMap((surface) =>
    filesUnder(surface).flatMap((file) => [
      ...leakedFingerprints(file),
      ...serializedCatalogHits(file),
      ...serverStaticHits(file),
    ])
  );

  // Then: field identifiers alone are allowed, but values and server constants are not.
  assert.deepEqual(
    leaks,
    [],
    `anonymous public source must not serialize staff price values:\n${leaks
      .slice(0, 20)
      .join("\n")}`
  );
});

test("keeps anonymous public build assets free of seeded price fingerprints", () => {
  // Given: a possibly stale build tree from a prior task.
  const buildFiles = BUILD_SURFACES.flatMap((surface) =>
    safeFilesUnder(surface).filter(isAnonymousPublicBuild)
  );

  // When: anonymous build files are scanned for model+sell-price fingerprints.
  const leaks = buildFiles.flatMap((file) => [
    ...leakedFingerprints(file),
    ...serializedCatalogHits(file),
  ]);

  // Then: stale staff/admin chunks are ignored, but anonymous public chunks stay clean.
  assert.deepEqual(
    leaks,
    [],
    `anonymous build assets must not carry seeded price values:\n${leaks
      .slice(0, 20)
      .join("\n")}`
  );
});
