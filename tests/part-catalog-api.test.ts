import assert from "node:assert/strict";
import test from "node:test";

import { deletePart, runPartAdminMutation, updatePart } from "../src/lib/parts/service";
import type {
  PartRecordWithReferences,
  PartRepository,
} from "../src/lib/parts/types";

const now = new Date("2026-07-11T00:00:00.000Z");

function part(overrides: Partial<PartRecordWithReferences> = {}): PartRecordWithReferences {
  return {
    id: "part-1",
    deviceType: "Phone",
    brand: "Apple",
    model: "iPhone 15",
    repairType: "Screen Replacement",
    quality: "OEM",
    colour: null,
    costPrice: 80,
    sellPrice: 160,
    warrantyDays: 90,
    stockQty: 2,
    sku: null,
    supplier: null,
    posItemId: null,
    notes: null,
    active: true,
    createdAt: now,
    updatedAt: now,
    _count: { repairFormItems: 0, matchedIntakes: 0 },
    ...overrides,
  };
}

function partRepo(seed: readonly PartRecordWithReferences[]): {
  readonly repo: PartRepository;
  readonly records: Map<string, PartRecordWithReferences>;
} {
  const records = new Map(seed.map((record) => [record.id, record]));
  return {
    records,
    repo: {
      async findById(id) {
        return records.get(id) ?? null;
      },
      async update(id, patch) {
        const current = records.get(id);
        if (!current) return null;
        const next = { ...current, ...patch, updatedAt: now };
        records.set(id, next);
        return next;
      },
      async deactivate(id) {
        const current = records.get(id);
        if (!current) return null;
        const next = { ...current, active: false, updatedAt: now };
        records.set(id, next);
        return next;
      },
      async hardDeleteInactiveUnreferenced(id) {
        const current = records.get(id);
        if (!current) return false;
        if (current.active) return false;
        if (current._count.repairFormItems + current._count.matchedIntakes > 0) return false;
        return records.delete(id);
      },
    },
  };
}

test("updatePart applies successful part patches through the repository", async () => {
  // Given: an existing catalog part.
  const { repo, records } = partRepo([part({ id: "part-update" })]);

  // When: an admin patch updates price and stock.
  const result = await updatePart(repo, "part-update", { sellPrice: 175, stockQty: 5 });

  // Then: the service returns the updated row and the fake repository is mutated.
  assert.equal(result.kind, "ok");
  if (result.kind === "ok") {
    assert.equal(result.record.sellPrice, 175);
    assert.equal(result.record.stockQty, 5);
  }
  assert.equal(records.get("part-update")?.sellPrice, 175);
});

test("deletePart deactivates parts by default", async () => {
  // Given: an active catalog part.
  const { repo, records } = partRepo([part({ id: "part-soft", active: true })]);

  // When: the default delete path runs without hard=1.
  const result = await deletePart(repo, "part-soft", false);

  // Then: the response contract is a soft delete and the row is inactive.
  assert.deepEqual(result, { kind: "deleted", mode: "soft" });
  assert.equal(records.get("part-soft")?.active, false);
});

test("updatePart rejects empty patches before writing", async () => {
  // Given: a writable repository with one catalog part.
  const { repo, records } = partRepo([part({ id: "part-empty", sellPrice: 160 })]);

  // When: an empty PATCH body reaches the mutation service.
  const result = await updatePart(repo, "part-empty", {});

  // Then: the mutation is rejected and the repository state is unchanged.
  assert.deepEqual(result, { kind: "invalid", message: "Update at least one part field" });
  assert.equal(records.get("part-empty")?.sellPrice, 160);
});

test("part mutations return not found for stale rows before and after the pre-read", async () => {
  // Given: one repository missing before read and two that lose the row after read.
  const missingBefore = partRepo([]).repo;
  const { repo: updateRaceRepo } = partRepo([part({ id: "part-race-update" })]);
  const { repo: deleteRaceRepo } = partRepo([part({ id: "part-race-delete" })]);
  const staleUpdateRepo: PartRepository = {
    ...updateRaceRepo,
    async update() {
      return null;
    },
  };
  const staleDeleteRepo: PartRepository = {
    ...deleteRaceRepo,
    async deactivate() {
      return null;
    },
  };

  // When: patch and default delete encounter stale rows.
  const before = await updatePart(missingBefore, "part-missing", { sellPrice: 170 });
  const afterPatch = await updatePart(staleUpdateRepo, "part-race-update", { sellPrice: 170 });
  const afterDelete = await deletePart(staleDeleteRepo, "part-race-delete", false);

  // Then: every stale outcome is a controlled 404 result.
  assert.deepEqual(before, { kind: "not_found", message: "Part not found" });
  assert.deepEqual(afterPatch, { kind: "not_found", message: "Part not found" });
  assert.deepEqual(afterDelete, { kind: "not_found", message: "Part not found" });
});

test("part mutations map repository P2025 misses to not found results", async () => {
  // Given: a repository that converts Prisma P2025 into null at the mutation seam.
  const { repo } = partRepo([part({ id: "part-p2025" })]);
  const p2025Repo: PartRepository = {
    ...repo,
    async update() {
      return null;
    },
    async deactivate() {
      return null;
    },
  };

  // When: update and soft delete see the repository-level P2025 miss.
  const patch = await updatePart(p2025Repo, "part-p2025", { stockQty: 1 });
  const softDelete = await deletePart(p2025Repo, "part-p2025", false);

  // Then: neither path leaks a server error.
  assert.deepEqual(patch, { kind: "not_found", message: "Part not found" });
  assert.deepEqual(softDelete, { kind: "not_found", message: "Part not found" });
});

test("deletePart blocks hard deletes for active or referenced parts", async () => {
  // Given: active and referenced catalog rows.
  const { repo } = partRepo([
    part({ id: "part-active", active: true }),
    part({
      id: "part-referenced",
      active: false,
      _count: { repairFormItems: 1, matchedIntakes: 0 },
    }),
    part({ id: "part-hard", active: false }),
  ]);

  // When: hard delete is requested for each row.
  const active = await deletePart(repo, "part-active", true);
  const referenced = await deletePart(repo, "part-referenced", true);
  const deleted = await deletePart(repo, "part-hard", true);

  // Then: active/referenced rows are protected and inactive unreferenced rows delete.
  assert.deepEqual(active, {
    kind: "conflict",
    message: "Deactivate the part before hard deleting it",
  });
  assert.deepEqual(referenced, {
    kind: "conflict",
    message: "Part is referenced by repair records",
  });
  assert.deepEqual(deleted, { kind: "deleted", mode: "hard" });
});

test("runPartAdminMutation requires ADMIN authority before mutation work", async () => {
  // Given: a guard that rejects the ADMIN check.
  let worked = false;
  const roles: string[] = [];

  // When: the authority wrapper runs.
  const response = await runPartAdminMutation({
    guard: async (role) => {
      roles.push(role);
      return { error: new Response("Forbidden", { status: 403 }) };
    },
    work: async () => {
      worked = true;
      return new Response(null, { status: 200 });
    },
  });

  // Then: mutation work never runs without ADMIN authority.
  assert.equal(response.status, 403);
  assert.deepEqual(roles, ["ADMIN"]);
  assert.equal(worked, false);
});
