import assert from "node:assert/strict";
import test from "node:test";

import {
  createDiagnosis,
  deleteDiagnosis,
} from "../src/lib/admin-data/services";
import type {
  DiagnosisRecord,
  DiagnosisRepository,
} from "../src/lib/admin-data/types";
import { diagnosis } from "./helpers/admin-data-fixtures";

function diagnosisRepo(seed: readonly DiagnosisRecord[]): DiagnosisRepository {
  const records = new Map(seed.map((record) => [record.id, record]));
  return {
    async create(input) {
      const record = diagnosis({ id: "diag-new", ...input });
      records.set(record.id, record);
      return record;
    },
    async update(id, input) {
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
    async findDuplicate(input, excludeId) {
      return (
        [...records.values()].find(
          (record) =>
            record.deviceType === input.deviceType &&
            record.brand === input.brand &&
            record.model === input.model &&
            record.symptomCode === input.symptomCode &&
            record.repairType === input.repairType &&
            record.id !== excludeId
        ) ?? null
      );
    },
    async countIntakes(id) {
      return id === "diag-referenced" ? 1 : 0;
    },
  };
}

test("rejects duplicate diagnosis contracts before writing", async () => {
  const repo = diagnosisRepo([diagnosis({ id: "diag-existing" })]);

  const result = await createDiagnosis(repo, {
    deviceType: "Phone",
    brand: "Apple",
    model: "iPhone 15",
    symptomCode: "no-power",
    symptomLabel: "No power",
    repairType: "Charging Port Replacement",
    outcome: "PART",
    priority: 2,
    active: true,
    notes: null,
  });

  assert.deepEqual(result, { kind: "invalid", message: "Duplicate diagnosis rule" });
});

test("deactivates diagnosis by default and hard-deletes only inactive unreferenced records", async () => {
  const repo = diagnosisRepo([
    diagnosis({ id: "diag-active", active: true }),
    diagnosis({ id: "diag-referenced", active: false }),
    diagnosis({ id: "diag-unreferenced", active: false }),
  ]);

  const defaultDelete = await deleteDiagnosis(repo, "diag-active", false);
  const referencedHardDelete = await deleteDiagnosis(repo, "diag-referenced", true);
  const hardDelete = await deleteDiagnosis(repo, "diag-unreferenced", true);

  assert.equal(defaultDelete.kind, "ok");
  if (defaultDelete.kind === "ok") assert.equal(defaultDelete.record.active, false);
  assert.deepEqual(referencedHardDelete, {
    kind: "conflict",
    message: "Diagnosis rule is still referenced by repair intakes",
  });
  assert.deepEqual(hardDelete, { kind: "deleted" });
});

test("returns not found when diagnosis hard delete loses a stale row race", async () => {
  const repo = diagnosisRepo([diagnosis({ id: "diag-stale", active: false })]);
  const staleRepo: DiagnosisRepository = {
    ...repo,
    async delete() {
      return false;
    },
  };

  const result = await deleteDiagnosis(staleRepo, "diag-stale", true);

  assert.deepEqual(result, {
    kind: "not_found",
    message: "Diagnosis rule not found",
  });
});
