import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import test from "node:test";

import { assertStaffPricingPrismaContract } from "./helpers/prisma-contract";

const root = process.cwd();
const schemaPath = join(root, "prisma", "schema.prisma");
const seedPath = join(root, "prisma", "seed.ts");
const migrationPath = join(root, "prisma", "migrations", "20260711053000_staff_pricing_intake_admin", "migration.sql");

const schema = readFileSync(schemaPath, "utf8");
const seed = readFileSync(seedPath, "utf8");
const migration = readFileSync(migrationPath, "utf8");

function escapeRegex(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function mutateModel(source: string, modelName: string, from: string, to: string): string {
  const regex = new RegExp(`model ${modelName} \\{[\\s\\S]*?\\n\\}`);
  const block = source.match(regex);
  assert.ok(block, `Missing model ${modelName}`);
  const mutatedBlock = block[0]
    .split("\n")
    .map((line) => (line.trim().replace(/\s+/g, " ") === from ? line.replace(from.match(/^\S+/)?.[0] ?? from, to) : line))
    .join("\n");
  const mutated = source.replace(block[0], mutatedBlock);
  assert.notEqual(mutated, source, `Mutation target not found in ${modelName}`);
  return mutated;
}

function mutateTable(source: string, tableName: string, from: string, to: string): string {
  const regex = new RegExp(`(CREATE TABLE "${tableName}" \\([\\s\\S]*?)${escapeRegex(from)}([\\s\\S]*?\\n\\);)`);
  const mutated = source.replace(regex, `$1${to}$2`);
  assert.notEqual(mutated, source, `Mutation target not found in ${tableName}`);
  return mutated;
}

function assertIncludes(haystack: string, needle: string): void {
  assert.ok(haystack.includes(needle), `Missing contract fragment: ${needle}`);
}

function assertNoDuplicateValues(values: readonly string[], label: string): void {
  const seen = new Set<string>();
  for (const value of values) {
    assert.ok(!seen.has(value), `Duplicate ${label}: ${value}`);
    seen.add(value);
  }
}

test("Todo 2 Prisma schema and migration match the exact approved contract", () => {
  // Given: production schema and SQL migration are the durable Todo 2 boundary.
  // When/Then: parsers assert exact full field, column, index, and FK contracts.
  assertStaffPricingPrismaContract(schema, migration);
});

const schemaMutationCases = [
  {
    name: "PolicyDocument.active defaulting false",
    schema: mutateModel(schema, "PolicyDocument", "active Boolean @default(true)", "active Boolean @default(false)"),
    expected: /PolicyDocument field contract drifted/,
  },
  {
    name: "DiagnosisRule gaining a sellPrice field",
    schema: mutateModel(schema, "DiagnosisRule", "updatedAt DateTime @updatedAt", "sellPrice Float\n  updatedAt DateTime @updatedAt"),
    expected: /DiagnosisRule field contract drifted/,
  },
  {
    name: "RepairIntake gaining a pricingPayload field",
    schema: mutateModel(schema, "RepairIntake", "createdAt DateTime @default(now())", "pricingPayload Json?\n  createdAt DateTime @default(now())"),
    expected: /RepairIntake field contract drifted/,
  },
] as const;

for (const mutationCase of schemaMutationCases) {
  test(`contract parser rejects ${mutationCase.name}`, () => {
    // Given: an in-memory schema mutation matching a verifier-proven false positive.
    // When/Then: the contract parser fails before any production file is changed.
    assert.throws(
      () => assertStaffPricingPrismaContract(mutationCase.schema, migration),
      mutationCase.expected
    );
  });
}

const migrationMutationCases = [
  {
    name: "DiagnosisRule.outcome becoming nullable in SQL",
    migration: mutateTable(migration, "DiagnosisRule", '"outcome" TEXT NOT NULL', '"outcome" TEXT'),
    expected: /DiagnosisRule SQL columns drifted/,
  },
  {
    name: "PriceAccessLog.deviceType becoming NOT NULL in SQL",
    migration: mutateTable(migration, "PriceAccessLog", '"deviceType" TEXT', '"deviceType" TEXT NOT NULL'),
    expected: /PriceAccessLog SQL columns drifted/,
  },
] as const;

for (const mutationCase of migrationMutationCases) {
  test(`contract parser rejects ${mutationCase.name}`, () => {
    // Given: an in-memory migration mutation matching the SQL false positive class.
    // When/Then: the migration parser rejects the altered column nullability.
    assert.throws(
      () => assertStaffPricingPrismaContract(schema, mutationCase.migration),
      mutationCase.expected
    );
  });
}

test("seed policies and diagnosis rules are idempotent and non-priced", () => {
  // Given: seed may create rules and active policies, but not staff-visible prices.
  for (const fragment of [
    "SEED_STAFF_EMAIL",
    "SEED_STAFF_PASSWORD",
    "seedPolicyDocuments",
    "seedDiagnosisRules",
    "policy-terms-current",
    "policy-warranty-current",
    "policy-data-current",
    "db.$transaction",
    "updateMany",
    "version: { not: policy.version }",
    "active: false",
    "Board-Level Repair",
    "Data Recovery",
    "Inspection",
  ] as const) {
    assertIncludes(seed, fragment);
  }

  const policyVersions = [...seed.matchAll(/version: "([^"]+)"/g)].map((match) => match[1]);
  assert.ok(policyVersions.length >= 3, "Expected seeded policy versions");
  for (const version of policyVersions) {
    assert.match(version, /^\d{4}-\d{2}-\d{2}\.\d+$/, `Malformed policy version ${version}`);
  }

  const policyCategories = [...seed.matchAll(/category: "([^"]+)"/g)].map((match) => match[1]);
  assert.deepEqual([...new Set(policyCategories)].sort(), ["DATA", "TERMS", "WARRANTY"] as const);

  const policyIds = [...seed.matchAll(/id: "(policy-[^"]+)"/g)].map((match) => match[1]);
  const ruleIds = [...seed.matchAll(/id: "(rule-[^"]+)"/g)].map((match) => match[1]);
  assertNoDuplicateValues(policyIds, "policy id");
  assertNoDuplicateValues(ruleIds, "diagnosis rule id");

  assert.doesNotMatch(seed, /console\.log\([^)]*password/i);
  assert.doesNotMatch(seed, /sellPrice:\s*\d+[^,}]*diagnosis/i);
});
