import type {
  DiagnosisRecord,
  PolicyRecord,
} from "../../src/lib/admin-data/types";

export const now = new Date("2026-07-11T00:00:00.000Z");

export function diagnosis(overrides: Partial<DiagnosisRecord>): DiagnosisRecord {
  return {
    id: "diag-1",
    deviceType: "Phone",
    brand: "Apple",
    model: "iPhone 15",
    symptomCode: "no-power",
    symptomLabel: "No power",
    repairType: "Charging Port Replacement",
    outcome: "PART",
    priority: 0,
    active: true,
    notes: null,
    createdAt: now,
    updatedAt: now,
    ...overrides,
  };
}

export function policy(overrides: Partial<PolicyRecord>): PolicyRecord {
  return {
    id: "policy-1",
    category: "TERMS",
    version: "2026-07-11.1",
    title: "Repair terms",
    body: "Terms",
    active: true,
    createdAt: now,
    updatedAt: now,
    ...overrides,
  };
}
