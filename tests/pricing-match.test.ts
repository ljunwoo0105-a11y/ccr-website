import assert from "node:assert/strict";
import test from "node:test";

import { matchDiagnosedPricing } from "../src/lib/pricing-match";
import type { DiagnosedPricingRequest, PricingCatalogPart, PricingDiagnosisRule, PricingRuleOutcome } from "../src/lib/pricing-match";

const request: DiagnosedPricingRequest = { deviceType: "Phone", brand: "Apple", model: "iPhone 15", symptomCode: "no-power" };

function rule(
  overrides: Partial<PricingDiagnosisRule> & { readonly id: string; readonly repairType: string }
): PricingDiagnosisRule {
  return {
    ...request,
    symptomLabel: "No power", outcome: "PART", priority: 1, active: true,
    updatedAt: "2026-07-01T00:00:00.000Z",
    ...overrides,
  };
}

function part(overrides: Partial<PricingCatalogPart>): PricingCatalogPart {
  return {
    id: "part-port-premium", deviceType: "Phone", brand: "Apple", model: "iPhone 15",
    repairType: "Charging Port Replacement",
    quality: "PREMIUM", colour: "Black", sellPrice: 189, warrantyDays: 180, active: true,
    ...overrides,
  };
}

test("chooses the most specific active diagnosis rule before priority ties", () => {
  // Given: device, brand, and exact-model rules all match the same symptom.
  const rules: PricingDiagnosisRule[] = [
    rule({ id: "rule-device", brand: null, model: null, repairType: "Device Power Service", priority: 500 }),
    rule({ id: "rule-brand", model: null, repairType: "Apple Power Service", priority: 100 }),
    rule({ id: "rule-model", repairType: "Charging Port Replacement", priority: 1 }),
  ];

  // When: pricing is resolved for the diagnosed issue.
  const result = matchDiagnosedPricing({
    request,
    rules,
    catalog: [part({ id: "part-port-premium" })],
  });

  // Then: model specificity beats less-specific higher-priority rules.
  assert.equal(result.kind, "priced");
  assert.equal(result.diagnosisRuleId, "rule-model");
  assert.equal(result.scope, "EXACT_MODEL");
  assert.equal(result.repairType, "Charging Port Replacement");
  assert.deepEqual(result.parts.map((catalogPart) => catalogPart.id), ["part-port-premium"]);
});

const tieBreakCatalog = [part({ id: "part-port-premium" })];
const tieBreakCases = [
  {
    name: "priority",
    rules: [
      rule({ id: "rule-low-priority", repairType: "Charging Port Replacement" }),
      rule({ id: "rule-high-priority", repairType: "Charging Port Replacement", priority: 9, updatedAt: "2026-06-01T00:00:00.000Z" }),
    ],
    expectedRuleId: "rule-high-priority",
  },
  {
    name: "updatedAt",
    rules: [
      rule({ id: "rule-older", repairType: "Charging Port Replacement", priority: 5, updatedAt: "2026-06-01T00:00:00.000Z" }),
      rule({ id: "rule-newer", repairType: "Charging Port Replacement", priority: 5, updatedAt: "2026-07-01T00:00:00.000Z" }),
    ],
    expectedRuleId: "rule-newer",
  },
  {
    name: "id",
    rules: [
      rule({ id: "rule-z", repairType: "Charging Port Replacement", priority: 5 }),
      rule({ id: "rule-a", repairType: "Charging Port Replacement", priority: 5 }),
    ],
    expectedRuleId: "rule-a",
  },
  {
    name: "malformed updatedAt",
    rules: [
      rule({ id: "rule-malformed-date", repairType: "Charging Port Replacement", priority: 5, updatedAt: "not-a-date" }),
      rule({ id: "rule-valid-date", repairType: "Charging Port Replacement", priority: 5, updatedAt: "2026-06-01T00:00:00.000Z" }),
    ],
    expectedRuleId: "rule-valid-date",
  },
] as const;

for (const tieBreakCase of tieBreakCases) {
  test(`breaks same-specificity diagnosis ties by ${tieBreakCase.name}`, () => {
    // Given: exact-model rules with identical match specificity.
    // When: the documented tie-break field differs.
    const result = matchDiagnosedPricing({
      request,
      rules: tieBreakCase.rules,
      catalog: tieBreakCatalog,
    });

    // Then: the winner is stable for the named tie-break level.
    assert.equal(result.kind, "priced");
    assert.equal(result.diagnosisRuleId, tieBreakCase.expectedRuleId);
  });
}

const outcomeCases: readonly {
  readonly outcome: PricingRuleOutcome;
  readonly expectedKind: "mainboard_required" | "data_recovery_required" | "inspection_required";
  readonly repairType: string;
  readonly reason?: "CATALOG_GAP" | "INSPECTION_RULE";
}[] = [
  { outcome: "MAINBOARD", expectedKind: "mainboard_required", repairType: "Board assessment", reason: "CATALOG_GAP" },
  { outcome: "DATA_RECOVERY", expectedKind: "data_recovery_required", repairType: "Data recovery triage", reason: "CATALOG_GAP" },
  { outcome: "INSPECTION", expectedKind: "inspection_required", repairType: "Counter inspection", reason: "INSPECTION_RULE" },
];

for (const outcomeCase of outcomeCases) {
  test(`returns the ${outcomeCase.outcome} diagnosis outcome contract`, () => {
    // Given: a diagnosis rule explicitly maps to a non-part outcome.
    const selectedRule = rule({ id: `rule-${outcomeCase.outcome.toLowerCase().replace("_", "-")}`, repairType: outcomeCase.repairType, outcome: outcomeCase.outcome });

    // When: pricing is resolved for the diagnosis.
    const result = matchDiagnosedPricing({
      request,
      rules: [selectedRule],
      catalog: [part({ id: "part-ignored" })],
    });

    // Then: the observable result is the typed outcome, not a fabricated price.
    assert.equal(result.kind, outcomeCase.expectedKind);
    assert.equal(result.diagnosisRuleId, selectedRule.id);
    assert.equal(result.scope, "EXACT_MODEL");
    assert.equal(result.repairType, outcomeCase.repairType);
    assert.deepEqual(result.parts, []);
    if (outcomeCase.reason) {
      assert.equal(result.reason, outcomeCase.reason);
    }
  });
}

const relatedOutcomeCases: readonly {
  readonly outcome: "MAINBOARD" | "DATA_RECOVERY";
  readonly expectedKind: "mainboard_required" | "data_recovery_required";
  readonly repairType: string;
}[] = [
  { outcome: "MAINBOARD", expectedKind: "mainboard_required", repairType: "Board assessment" },
  { outcome: "DATA_RECOVERY", expectedKind: "data_recovery_required", repairType: "Data recovery triage" },
];

for (const relatedCase of relatedOutcomeCases) {
  test(`returns exact catalog-backed related services for ${relatedCase.outcome}`, () => {
    // Given: a board-level/data rule has exact active catalog services and nearby non-matches.
    const selectedRule = rule({ id: `rule-related-${relatedCase.outcome.toLowerCase()}`, repairType: relatedCase.repairType, outcome: relatedCase.outcome });

    // When: pricing is resolved for the protected exact request.
    const result = matchDiagnosedPricing({
      request,
      rules: [selectedRule],
      catalog: [
        part({ id: "part-inactive-related", repairType: relatedCase.repairType, sellPrice: 1, active: false }),
        part({ id: "part-wrong-model-related", model: "iPhone 15 Pro", repairType: relatedCase.repairType, sellPrice: 2 }),
        part({ id: "part-exact-related-premium", repairType: relatedCase.repairType, sellPrice: 349, stockQty: 1 }),
        part({ id: "part-exact-related-standard", repairType: relatedCase.repairType, quality: "STANDARD", sellPrice: 299, stockQty: 2 }),
      ],
    });

    // Then: the semantic outcome is retained and exact active catalog rows are exposed.
    assert.equal(result.kind, relatedCase.expectedKind);
    assert.equal(result.diagnosisRuleId, selectedRule.id);
    assert.equal(result.scope, "EXACT_MODEL");
    assert.equal(result.repairType, relatedCase.repairType);
    assert.deepEqual(result.parts.map((catalogPart) => catalogPart.id), [
      "part-exact-related-standard",
      "part-exact-related-premium",
    ]);
  });
}

test("ignores inactive rules and inactive catalog parts", () => {
  // Given: an inactive exact rule and inactive cheapest part would be wrong winners.
  const rules: PricingDiagnosisRule[] = [
    rule({ id: "rule-inactive-exact", repairType: "Board assessment", outcome: "MAINBOARD", priority: 999, active: false }),
    rule({ id: "rule-active-brand", model: null, repairType: "Battery Replacement" }),
  ];

  // When: an active brand rule and active catalog row are available.
  const result = matchDiagnosedPricing({
    request,
    rules,
    catalog: [
      part({ id: "part-inactive-battery", repairType: "Battery Replacement", sellPrice: 1, active: false }),
      part({ id: "part-active-battery", repairType: "Battery Replacement", sellPrice: 149 }),
    ],
  });

  // Then: inactive rule and part rows are both excluded from the outcome.
  assert.equal(result.kind, "priced");
  assert.equal(result.diagnosisRuleId, "rule-active-brand");
  assert.equal(result.scope, "BRAND");
  assert.deepEqual(result.parts.map((catalogPart) => catalogPart.id), ["part-active-battery"]);
});

test("falls back to a device-wide diagnosis rule when exact and brand candidates do not match", () => {
  // Given: exact-model and brand-wide candidates exist but do not match the request.
  const deviceRule = rule({ id: "rule-device-fallback", brand: null, model: null, repairType: "Battery Replacement" });

  // When: only the device-wide rule matches the diagnosed issue.
  const result = matchDiagnosedPricing({
    request,
    rules: [
      rule({ id: "rule-wrong-exact-model", model: "iPhone 15 Pro", repairType: "OLED Display Replacement", priority: 999 }),
      rule({ id: "rule-wrong-brand", brand: "Samsung", model: null, repairType: "Galaxy Power Service", priority: 999 }),
      deviceRule,
    ],
    catalog: [part({ id: "part-device-battery", repairType: "Battery Replacement" })],
  });

  // Then: the observable match records the device scope and exact catalog parts.
  assert.equal(result.kind, "priced");
  assert.equal(result.diagnosisRuleId, deviceRule.id);
  assert.equal(result.scope, "DEVICE");
  assert.equal(result.repairType, "Battery Replacement");
  assert.deepEqual(result.parts.map((catalogPart) => catalogPart.id), ["part-device-battery"]);
});

test("returns a catalog-gap inspection when no exact active catalog row exists", () => {
  // Given: a PART rule maps to a repair type without an active exact catalog row.
  const selectedRule = rule({ id: "rule-screen-gap", repairType: "OLED Display Replacement" });

  // When: nearby, wrong-repair, and inactive rows are the only catalog entries.
  const result = matchDiagnosedPricing({
    request,
    rules: [selectedRule],
    catalog: [
      part({ id: "part-wrong-repair" }),
      part({ id: "part-inactive-display", repairType: "OLED Display Replacement", active: false }),
      part({ id: "part-nearby-model-display", model: "iPhone 15 Pro", repairType: "OLED Display Replacement" }),
    ],
  });

  // Then: pricing is not fabricated and the catalog gap is explicit.
  assert.deepEqual(result, {
    kind: "inspection_required",
    diagnosisRuleId: "rule-screen-gap",
    scope: "EXACT_MODEL",
    repairType: "OLED Display Replacement",
    parts: [],
    reason: "CATALOG_GAP",
  });
});
