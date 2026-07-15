import assert from "node:assert/strict";
import test from "node:test";

import {
  createPolicy,
  deletePolicy,
  updatePolicy,
} from "../src/lib/admin-data/services";
import type {
  PolicyRecord,
  PolicyRepository,
} from "../src/lib/admin-data/types";
import {
  createPolicySchema,
  patchPolicySchema,
} from "../src/lib/admin-data/validation";
import { policy } from "./helpers/admin-data-fixtures";

function policyRepo(records: Map<string, PolicyRecord>, events: string[]): PolicyRepository {
  return {
    async transaction(work) {
      events.push("transaction:start");
      const result = await work({
        async lockCategory(category) {
          events.push(`lock:${category}`);
        },
        async deactivateCategory(category, exceptId) {
          events.push(`deactivate:${category}:${exceptId}`);
          for (const record of records.values()) {
            if (record.category === category && record.id !== exceptId) {
              records.set(record.id, { ...record, active: false });
            }
          }
        },
        async update(id, input) {
          events.push(`update:${id}`);
          const current = records.get(id);
          if (!current) return null;
          const next = { ...current, ...input };
          records.set(id, next);
          return next;
        },
        async create(input) {
          events.push(`create:${input.category}`);
          const record = policy({ id: "policy-new", ...input });
          records.set(record.id, record);
          return record;
        },
      });
      events.push("transaction:end");
      return result;
    },
    async create(input) {
      return policy({ id: "policy-new", ...input });
    },
    async update(id, input) {
      events.push(`update:${id}`);
      const current = records.get(id);
      if (!current) return null;
      const next = { ...current, ...input };
      records.set(id, next);
      return next;
    },
    async delete(id) {
      return records.delete(id);
    },
    async findById(id) {
      return records.get(id) ?? null;
    },
    async findDuplicate(category, version, excludeId) {
      return (
        [...records.values()].find(
          (record) =>
            record.category === category &&
            record.version === version &&
            record.id !== excludeId
        ) ?? null
      );
    },
    async countReferences(id) {
      return id === "policy-referenced" ? 1 : 0;
    },
    async lockCategory() {
      assert.fail("active changes must lock inside transaction");
    },
    async deactivateCategory() {
      assert.fail("active changes must use transaction");
    },
  };
}

test("policy validation accepts only required categories and dated revisions", () => {
  const valid = {
    category: "TERMS",
    version: "2026-07-11.1",
    title: "Repair terms",
    body: "Terms",
    active: true,
  };

  assert.equal(createPolicySchema.safeParse(valid).success, true);
  assert.equal(patchPolicySchema.safeParse({ category: "WARRANTY" }).success, true);
  assert.equal(createPolicySchema.safeParse({ ...valid, category: "repair" }).success, false);
  assert.equal(createPolicySchema.safeParse({ ...valid, category: "PRIVACY" }).success, false);
  assert.equal(createPolicySchema.safeParse({ ...valid, version: "2026.07" }).success, false);
  assert.equal(createPolicySchema.safeParse({ ...valid, version: "2026-07-11" }).success, false);
});

test("serializes active policy creation and update before deactivating siblings", async () => {
  const events: string[] = [];
  const records = new Map([
    ["policy-1", policy({ id: "policy-1", active: true })],
    ["policy-2", policy({ id: "policy-2", version: "2026-07-11.2", active: false })],
  ]);
  const repo = policyRepo(records, events);

  const update = await updatePolicy(repo, "policy-2", { active: true });
  const create = await createPolicy(repo, {
    category: "TERMS",
    version: "2026-07-12.1",
    title: "Terms v3",
    body: "Terms",
    active: true,
  });

  assert.equal(update.kind, "ok");
  assert.equal(create.kind, "created");
  assert.deepEqual(events, [
    "transaction:start",
    "lock:TERMS",
    "deactivate:TERMS:policy-2",
    "update:policy-2",
    "transaction:end",
    "transaction:start",
    "lock:TERMS",
    "deactivate:TERMS:",
    "create:TERMS",
    "transaction:end",
  ]);
});

test("active policy category move locks target category and preserves one active target", async () => {
  const events: string[] = [];
  const records = new Map([
    ["policy-terms", policy({ id: "policy-terms", category: "TERMS", active: true })],
    [
      "policy-warranty",
      policy({ id: "policy-warranty", category: "WARRANTY", version: "2026-07-10.1", active: true }),
    ],
  ]);
  const repo = policyRepo(records, events);

  const result = await updatePolicy(repo, "policy-terms", { category: "WARRANTY" });

  assert.equal(result.kind, "ok");
  assert.deepEqual(events, [
    "transaction:start",
    "lock:WARRANTY",
    "deactivate:WARRANTY:policy-terms",
    "update:policy-terms",
    "transaction:end",
  ]);
  assert.deepEqual(
    [...records.values()]
      .filter((record) => record.category === "WARRANTY" && record.active)
      .map((record) => record.id),
    ["policy-terms"]
  );
});

test("explicit inactive policy patch uses the plain update path", async () => {
  const events: string[] = [];
  const records = new Map([
    ["policy-terms", policy({ id: "policy-terms", category: "TERMS", active: true })],
  ]);
  const repo = policyRepo(records, events);

  const result = await updatePolicy(repo, "policy-terms", { active: false });

  assert.equal(result.kind, "ok");
  assert.deepEqual(events, ["update:policy-terms"]);
  assert.equal(records.get("policy-terms")?.active, false);
});

test("policy hard delete checks exact policy references and stale deletes", async () => {
  const events: string[] = [];
  const records = new Map([
    ["policy-target", policy({ id: "policy-target", active: false })],
    ["policy-referenced", policy({ id: "policy-referenced", active: false })],
  ]);
  const repo = policyRepo(records, events);
  const staleRepo: PolicyRepository = {
    ...repo,
    async findById(id) {
      return policy({ id, active: false });
    },
    async delete() {
      return false;
    },
  };

  const unrelatedReference = await deletePolicy(repo, "policy-target", true);
  const exactReference = await deletePolicy(repo, "policy-referenced", true);
  const stale = await deletePolicy(staleRepo, "policy-stale", true);

  assert.deepEqual(unrelatedReference, { kind: "deleted" });
  assert.deepEqual(exactReference, {
    kind: "conflict",
    message: "Policy is still referenced by repair intakes",
  });
  assert.deepEqual(stale, { kind: "not_found", message: "Policy not found" });
});
