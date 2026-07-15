import assert from "node:assert/strict";
import test from "node:test";

import { buildIntakeAgreementSnapshot } from "../src/lib/intake-agreement";
import type { AgreementPolicyCategory } from "../src/lib/intake-agreement";

interface MutablePolicyFixture {
  id: string;
  category: AgreementPolicyCategory;
  version: string;
  title: string;
  body: string;
  active: boolean;
}

function activePolicies(): MutablePolicyFixture[] {
  return [
    {
      id: "policy-terms",
      category: "TERMS",
      version: "2026-07-01.1",
      title: "Repair terms",
      body: "Terms accepted at intake.",
      active: true,
    },
    {
      id: "policy-warranty",
      category: "WARRANTY",
      version: "2026-07-01.1",
      title: "Warranty policy",
      body: "Warranty accepted at intake.",
      active: true,
    },
    {
      id: "policy-data",
      category: "DATA",
      version: "2026-07-01.1",
      title: "Data policy",
      body: "Data risk accepted at intake.",
      active: true,
    },
  ];
}

test("captures complete terms warranty and data policy snapshots for intake", () => {
  // Given: the customer accepted every active required policy and pre-condition accuracy.
  const policies = activePolicies();

  // When: the immutable intake agreement snapshot is built.
  const snapshot = buildIntakeAgreementSnapshot({
    acceptedAt: "2026-07-10T23:45:00.000Z",
    policies,
    acceptedPolicyIds: ["policy-terms", "policy-warranty", "policy-data"],
    preConditionAccuracyAccepted: true,
    warrantyDays: 180,
  });

  for (const policy of policies) {
    policy.version = `mutated-${policy.category}`;
    policy.title = `Mutated ${policy.category}`;
    policy.body = `Mutated ${policy.category} body.`;
  }

  // Then: every required category is stored with versioned text, not only ids.
  assert.deepEqual(
    snapshot.policies.map((policy) => ({
      id: policy.id,
      category: policy.category,
      version: policy.version,
      title: policy.title,
      body: policy.body,
    })),
    [
      {
        id: "policy-terms",
        category: "TERMS",
        version: "2026-07-01.1",
        title: "Repair terms",
        body: "Terms accepted at intake.",
      },
      {
        id: "policy-warranty",
        category: "WARRANTY",
        version: "2026-07-01.1",
        title: "Warranty policy",
        body: "Warranty accepted at intake.",
      },
      {
        id: "policy-data",
        category: "DATA",
        version: "2026-07-01.1",
        title: "Data policy",
        body: "Data risk accepted at intake.",
      },
    ]
  );
  assert.equal(snapshot.acceptedAt, "2026-07-10T23:45:00.000Z");
  assert.equal(snapshot.preConditionAccuracyAccepted, true);
  assert.equal(snapshot.warrantyDays, 180);
});

const missingAcknowledgementCases = [
  {
    category: "TERMS",
    acceptedPolicyIds: ["policy-warranty", "policy-data"],
    expectedRejection: /policy-terms|TERMS/i,
  },
  {
    category: "WARRANTY",
    acceptedPolicyIds: ["policy-terms", "policy-data"],
    expectedRejection: /policy-warranty|WARRANTY/i,
  },
  {
    category: "DATA",
    acceptedPolicyIds: ["policy-terms", "policy-warranty"],
    expectedRejection: /policy-data|DATA/i,
  },
] as const;

for (const missingAcknowledgement of missingAcknowledgementCases) {
  test(`rejects active ${missingAcknowledgement.category} policy when its id was not accepted`, () => {
    // Given: all active required policies were supplied, but one id was not acknowledged.
    const policies = activePolicies();

    // When/Then: the supplied-but-unaccepted active policy is rejected specifically.
    assert.throws(
      () =>
        buildIntakeAgreementSnapshot({
          acceptedAt: "2026-07-10T23:45:00.000Z",
          policies,
          acceptedPolicyIds: missingAcknowledgement.acceptedPolicyIds,
          preConditionAccuracyAccepted: true,
          warrantyDays: 180,
        }),
      missingAcknowledgement.expectedRejection
    );
  });
}

test("rejects intake agreement snapshots without pre-condition accuracy acceptance", () => {
  // Given: all policies are present but the customer did not accept the condition record.
  const policies = activePolicies();

  // When/Then: the snapshot cannot be created without the required acknowledgement.
  assert.throws(
    () =>
      buildIntakeAgreementSnapshot({
        acceptedAt: "2026-07-10T23:45:00.000Z",
        policies,
        acceptedPolicyIds: ["policy-terms", "policy-warranty", "policy-data"],
        preConditionAccuracyAccepted: false,
        warrantyDays: 180,
      }),
    /pre-condition/i
  );
});
