import assert from "node:assert/strict";
import test from "node:test";

import { bulkMutateParts } from "../src/lib/parts/service";
import type {
  PartRecord,
  PartRecordWithReferences,
  PartRepository,
} from "../src/lib/parts/types";

function part(
  id: string,
  overrides: Partial<PartRecordWithReferences> = {}
): PartRecordWithReferences {
  return {
    id,
    deviceType: "Phone",
    brand: "Apple",
    model: "iPhone 15",
    repairType: "Screen Replacement",
    quality: "AFTERMARKET",
    colour: null,
    costPrice: 50,
    sellPrice: 219,
    warrantyDays: 90,
    stockQty: 3,
    sku: null,
    supplier: null,
    posItemId: null,
    notes: null,
    active: false,
    createdAt: new Date(0),
    updatedAt: new Date(0),
    _count: { repairFormItems: 0, matchedIntakes: 0 },
    ...overrides,
  } as PartRecordWithReferences;
}

function repository(rows: readonly PartRecordWithReferences[]): {
  readonly repo: PartRepository;
  readonly deleted: string[];
} {
  const byId = new Map(rows.map((row) => [row.id, row]));
  const deleted: string[] = [];
  const repo: PartRepository = {
    async findById(id) {
      return byId.get(id) ?? null;
    },
    async update(id, patch) {
      const current = byId.get(id);
      if (!current) return null;
      const next = { ...current, ...patch } as PartRecordWithReferences;
      byId.set(id, next);
      return next as PartRecord;
    },
    async deactivate(id) {
      const current = byId.get(id);
      if (!current) return null;
      const next = { ...current, active: false };
      byId.set(id, next);
      return next as PartRecord;
    },
    async hardDeleteInactiveUnreferenced(id) {
      const current = byId.get(id);
      if (!current || current.active) return false;
      if (current._count.repairFormItems + current._count.matchedIntakes > 0) {
        return false;
      }
      byId.delete(id);
      deleted.push(id);
      return true;
    },
  };
  return { repo, deleted };
}

test("bulk hard delete removes only inactive, unreferenced parts", async () => {
  // Given: one deletable part, one still active, one referenced by a repair.
  const { repo, deleted } = repository([
    part("safe"),
    part("still-active", { active: true }),
    part("referenced", {
      _count: { repairFormItems: 0, matchedIntakes: 2 },
    }),
  ]);

  // When: all three are hard deleted in one bulk call.
  const result = await bulkMutateParts(
    repo,
    ["safe", "still-active", "referenced"],
    "hard-delete"
  );

  // Then: the guards hold per part and the refusals carry their reasons.
  assert.deepEqual(result.succeeded, ["safe"]);
  assert.deepEqual(deleted, ["safe"]);
  assert.equal(result.failed.length, 2);
  assert.match(
    result.failed.find((f) => f.id === "still-active")?.reason ?? "",
    /deactivate/i
  );
  assert.match(
    result.failed.find((f) => f.id === "referenced")?.reason ?? "",
    /referenced/i
  );
});

test("bulk deactivate and reactivate flip active without deleting", async () => {
  // Given: two active parts.
  const { repo, deleted } = repository([
    part("a", { active: true }),
    part("b", { active: true }),
  ]);

  // When: they are deactivated, then reactivated.
  const off = await bulkMutateParts(repo, ["a", "b"], "deactivate");
  const on = await bulkMutateParts(repo, ["a", "b"], "reactivate");

  // Then: both succeed each way and nothing is removed from the catalog.
  assert.deepEqual(off.succeeded, ["a", "b"]);
  assert.deepEqual(on.succeeded, ["a", "b"]);
  assert.equal(off.failed.length, 0);
  assert.equal(on.failed.length, 0);
  assert.deepEqual(deleted, []);
});

test("bulk reports unknown ids instead of failing the whole batch", async () => {
  // Given: a selection containing an id that no longer exists.
  const { repo } = repository([part("real")]);

  // When: the batch is deleted.
  const result = await bulkMutateParts(repo, ["real", "ghost"], "hard-delete");

  // Then: the real part still goes, and the missing one is reported.
  assert.deepEqual(result.succeeded, ["real"]);
  assert.equal(result.failed.length, 1);
  assert.match(result.failed[0]?.reason ?? "", /not found/i);
});
