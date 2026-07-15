import assert from "node:assert/strict";
import test from "node:test";

import {
  projectPriceAccessLog,
  updateIntakeRecord,
  updateRepairFormRecord,
} from "../src/lib/admin-data/services";
import type {
  PriceAccessLogRecord,
  RecordRepository,
} from "../src/lib/admin-data/types";
import { now } from "./helpers/admin-data-fixtures";

test("record updates preserve legacy nullable agreement fields", async () => {
  const repo: RecordRepository = {
    async updateIntake(id, input) {
      return {
        id,
        status: input.status ?? "CHECKED_IN",
        customerId: "customer-1",
        customerName: input.customer?.name ?? "Taylor",
        customerPhone: input.customer?.phone ?? "0400000000",
        customerEmail: input.customer?.email ?? null,
        deviceType: input.deviceType ?? "Phone",
        brand: input.brand ?? "Apple",
        model: input.model ?? "iPhone 15",
        repairTypes: "[\"Screen\"]",
        agreementSnapshot: null,
        policyAcknowledgements: null,
        agreementAcceptedAt: null,
        preConditionAccuracyAccepted: false,
      };
    },
    async deleteIntake() {
      return true;
    },
    async updateRepairForm(id, input) {
      return {
        id,
        status: input.status ?? "QUOTED",
        customerName: input.customerName ?? "Taylor",
        customerEmail: input.customerEmail ?? "taylor@example.test",
        customerPhone: input.customerPhone ?? null,
        deviceType: input.deviceType ?? "Phone",
        brand: input.brand ?? "Apple",
        model: input.model ?? "iPhone 15",
      };
    },
    async deleteRepairForm() {
      return true;
    },
  };

  const intake = await updateIntakeRecord(repo, "intake-1", {
    status: "READY",
    customer: { name: "Alex", phone: "0411111111", email: null },
  });
  const form = await updateRepairFormRecord(repo, "form-1", {
    status: "ACCEPTED",
    customerName: "Alex",
  });

  assert.equal(intake.kind, "ok");
  if (intake.kind === "ok") {
    assert.equal(intake.record.agreementSnapshot, null);
    assert.equal(intake.record.policyAcknowledgements, null);
  }
  assert.equal(form.kind, "ok");
});

test("price access projection excludes raw IP and price payload data", () => {
  const raw: PriceAccessLogRecord = {
    id: "log-1",
    userId: "user-1",
    userName: "Admin",
    userEmail: "admin@example.test",
    deviceType: "Phone",
    brand: "Apple",
    model: "iPhone 15",
    symptomCode: "no-power",
    outcome: "PART",
    matchedPartCount: 2,
    ipHash: "abc123",
    userAgent: "Mozilla/5.0",
    createdAt: now,
  };

  const projected = projectPriceAccessLog(raw);

  assert.deepEqual(projected, {
    id: "log-1",
    user: { id: "user-1", name: "Admin", email: "admin@example.test" },
    context: {
      deviceType: "Phone",
      brand: "Apple",
      model: "iPhone 15",
      symptomCode: "no-power",
      outcome: "PART",
      matchedPartCount: 2,
    },
    hash: { ipHashPrefix: "abc123", userAgent: "Mozilla/5.0" },
    createdAt: "2026-07-11T00:00:00.000Z",
  });
});
