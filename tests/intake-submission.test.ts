import assert from "node:assert/strict";
import test from "node:test";
import * as ReactRuntime from "react";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";

import { IntakeDetailAgreement } from "../src/components/staff/intake/IntakeDetailAgreement";
import { buildIntakeDetailAgreementProjection } from "../src/lib/intakes/detail";
import { IntakeSubmissionValidationError, createIntakeSubmission, intakeSubmissionSchema, type IntakeSubmissionInput, type IntakeSubmissionPart, type IntakeSubmissionRepository, type IntakeSubmissionTransaction, type PersistedIntakeSubmission } from "../src/lib/intakes/submission";
import { defaultPreCondition } from "../src/components/staff/precondition";
import type { IntakeAgreementPolicy } from "../src/lib/intake-agreement";

const preCondition = { ...defaultPreCondition(), findMyDisabled: true, dataBackedUp: true, simRemoved: true, batteryHealthPct: 91 };

function policies(): IntakeAgreementPolicy[] {
  return [policy("policy-terms", "TERMS", "Repair terms"), policy("policy-warranty", "WARRANTY", "Warranty terms"), policy("policy-data", "DATA", "Data terms")];
}

function policy(id: string, category: IntakeAgreementPolicy["category"], title: string): IntakeAgreementPolicy {
  return { id, category, version: "2026-07-01.1", title, body: `${title} body`, active: true };
}

function part(overrides: Partial<IntakeSubmissionPart> = {}): IntakeSubmissionPart {
  return { id: "part-screen-genuine", deviceType: "Phone", brand: "Apple", model: "iPhone 15", repairType: "Screen Replacement", quality: "GENUINE", sellPrice: 329, warrantyDays: 365, active: true, ...overrides };
}

function input(overrides: Partial<IntakeSubmissionInput> = {}): IntakeSubmissionInput {
  return {
    customer: { name: "Ada Lovelace", phone: "0452 385 321", email: "ada@example.com", suburb: "Springfield Central" },
    deviceType: "Phone",
    brand: "Apple",
    model: "iPhone 15",
    imei: "359881234567890",
    serialNo: "C39YW0ABCDEF",
    repairTypes: ["Screen Replacement"],
    preCondition,
    accessories: "Case",
    conditionNotes: "Hairline crack",
    partQuality: "AFTERMARKET",
    warrantyDays: 30,
    quotedPrice: 1,
    depositPaid: true,
    customerSignature: "Ada Lovelace",
    partId: "part-screen-genuine",
    diagnosisRuleId: "rule-screen",
    acceptedPolicyIds: ["policy-terms", "policy-warranty", "policy-data"],
    preConditionAccuracyAccepted: true,
    ...overrides,
  };
}

class MemoryIntakeRepository implements IntakeSubmissionRepository {
  readonly parts = new Map<string, IntakeSubmissionPart>([
    ["part-screen-genuine", part()],
  ]);
  readonly policies = policies();
  readonly saved: PersistedIntakeSubmission[] = [];
  failCreateIntake = false;

  async withTransaction<T>(work: (transaction: IntakeSubmissionTransaction) => Promise<T>): Promise<T> {
    const before = [...this.saved];
    try {
      return await work(this.transaction());
    } catch (error) {
      this.saved.splice(0, this.saved.length, ...before);
      throw error;
    }
  }

  private transaction(): IntakeSubmissionTransaction {
    return {
      findCustomerByPhone: async () => null,
      createCustomer: async (customer) => ({
        id: `customer-${this.saved.length + 1}`,
        ...customer,
      }),
      findActivePartById: async (partId) => {
        const catalogPart = this.parts.get(partId);
        return catalogPart?.active ? catalogPart : null;
      },
      findActiveDiagnosisRuleById: async (ruleId) =>
        ruleId === "rule-screen"
          ? { id: "rule-screen", deviceType: "Phone", brand: "Apple", model: "iPhone 15", symptomCode: "screen-cracked", symptomLabel: "Cracked screen", repairType: "Screen Replacement", outcome: "PART", active: true }
          : null,
      listActivePolicies: async () => this.policies,
      createIntake: async (draft) => {
        if (this.failCreateIntake) {
          throw new Error("interrupted create");
        }
        const saved = { id: `intake-${this.saved.length + 1}`, ...draft };
        this.saved.push(saved);
        return saved;
      },
    };
  }
}

function saved(repository: MemoryIntakeRepository): PersistedIntakeSubmission {
  return repository.saved[0] ?? assert.fail("expected saved intake");
}

function submit(repository: MemoryIntakeRepository, body: IntakeSubmissionInput = input(), acceptedAt = "2026-07-11T01:00:00.000Z"): Promise<PersistedIntakeSubmission> {
  return createIntakeSubmission({ staffId: "staff-1", acceptedAt, input: body, repository });
}

async function assertServiceRejects(repository: MemoryIntakeRepository, body: IntakeSubmissionInput, match: RegExp): Promise<void> {
  await assert.rejects(submit(repository, body, "2026-07-11T01:10:00.000Z"), (error) => error instanceof IntakeSubmissionValidationError && match.test(error.message));
  assert.equal(repository.saved.length, 0);
}

test("persists matched part pricing when the client tampers with price and warranty", async () => {
  // Given: a staff submission points at an active catalog part but sends fake price fields.
  const repository = new MemoryIntakeRepository();

  // When: the intake is created through the authoritative service.
  const result = await submit(repository);

  // Then: price, warranty, quality, diagnosis, and agreement fields come from server data.
  const intake = saved(repository);
  assert.equal(result.id, "intake-1");
  assert.equal(intake.quotedPrice, 329);
  assert.equal(intake.warrantyDays, 365);
  assert.equal(intake.partQuality, "GENUINE");
  assert.equal(intake.matchedPartId, "part-screen-genuine");
  assert.equal(intake.pricingSource, "MATCHED");
  assert.equal(intake.diagnosisCode, "screen-cracked");
  assert.equal(intake.diagnosisLabel, "Cracked screen");
  assert.equal(intake.diagnosisOutcome, "PART");
  assert.equal(intake.agreementAcceptedAt, "2026-07-11T01:00:00.000Z");
  assert.equal(intake.agreementSnapshot.warrantyDays, 365);
  assert.equal(intake.agreementSnapshot.policies.length, 3);
  assert.equal(buildIntakeDetailAgreementProjection({ agreementSnapshot: intake.agreementSnapshot, policyAcknowledgements: intake.policyAcknowledgements, agreementAcceptedAt: intake.agreementAcceptedAt, warrantyDays: intake.warrantyDays }).warrantyDays, 365);
});

test("preserves manual quoted price warranty and quality without a part id", async () => {
  // Given: the counter quote is a manual intake with no matched catalog part.
  const repository = new MemoryIntakeRepository();

  // When: the intake is submitted.
  await submit(
    repository,
    input({
      partId: undefined,
      diagnosisRuleId: undefined,
      partQuality: "OEM",
      warrantyDays: 180,
      quotedPrice: 249,
    }),
    "2026-07-11T01:05:00.000Z"
  );

  // Then: manual pricing fields are retained and no matched part is attached.
  const intake = saved(repository);
  assert.equal(intake.quotedPrice, 249);
  assert.equal(intake.warrantyDays, 180);
  assert.equal(intake.partQuality, "OEM");
  assert.equal(intake.matchedPartId, null);
  assert.equal(intake.pricingSource, "MANUAL");
});

test("preserves unspecified manual warranty through snapshot detail and rendering", async () => {
  // Given: a valid manual intake leaves warranty days unspecified.
  const repository = new MemoryIntakeRepository();

  // When: the intake is submitted without a matched part or manual warranty.
  await submit(repository, input({ partId: undefined, diagnosisRuleId: undefined, warrantyDays: undefined, quotedPrice: 249 }), "2026-07-11T01:06:00.000Z");

  // Then: persistence, the snapshot, projection, and rendered staff detail all keep it unspecified.
  const intake = saved(repository);
  assert.equal(intake.warrantyDays, null);
  assert.equal(intake.agreementSnapshot.warrantyDays, null);

  const agreement = buildIntakeDetailAgreementProjection({ agreementSnapshot: intake.agreementSnapshot, policyAcknowledgements: intake.policyAcknowledgements, agreementAcceptedAt: intake.agreementAcceptedAt, warrantyDays: intake.warrantyDays });
  assert.equal(agreement.warrantyDays, null);
  assert.equal(agreement.policies.length, 3);

  Object.defineProperty(globalThis, "React", { value: ReactRuntime, configurable: true });
  const markup = renderToStaticMarkup(createElement(IntakeDetailAgreement, { agreement, customerSignature: intake.customerSignature, createdAt: new Date("2026-07-11T01:06:00.000Z") }));
  assert.match(markup, /Not specified/);
  assert.doesNotMatch(markup, /0 days/);
});

// A blank signature is deliberately absent from these cases: acknowledgement
// is the agree-all tick box now, and no typed name is collected.
test("rejects missing policy accuracy and acknowledgement contracts", async () => {
  const cases = [
    { mutate: (repo: MemoryIntakeRepository) => repo.policies.pop(), body: input(), match: /active DATA/i },
    { body: input({ acceptedPolicyIds: ["policy-terms", "policy-warranty"] }), match: /active policy documents|DATA|policy-data/i },
    { body: input({ acceptedPolicyIds: ["policy-terms", "policy-warranty", "policy-data", "policy-old"] }), match: /exactly the active policy/i },
    { body: input({ preConditionAccuracyAccepted: false }), match: /pre-condition/i },
  ] satisfies readonly {
    readonly body: IntakeSubmissionInput;
    readonly match: RegExp;
    readonly mutate?: (repository: MemoryIntakeRepository) => unknown;
  }[];

  for (const rejection of cases) {
    // Given: one required intake agreement condition is missing.
    const repository = new MemoryIntakeRepository();
    rejection.mutate?.(repository);

    // When/Then: the service rejects before persistence.
    await assertServiceRejects(repository, rejection.body, rejection.match);
  }
});

test("rejects stale part and invalid diagnosis associations", async () => {
  const cases = [
    { name: "part", body: input(), mutate: (repo: MemoryIntakeRepository) => repo.parts.set("part-screen-genuine", part({ model: "iPhone 15 Pro" })), match: /part/i },
    { name: "diagnosis", body: input({ diagnosisRuleId: "rule-missing" }), mutate: () => undefined, match: /diagnosis/i },
  ] as const;

  for (const rejection of cases) {
    // Given: the submitted ids no longer match active server-side data.
    const repository = new MemoryIntakeRepository();
    rejection.mutate(repository);

    // When/Then: the association is rejected and nothing is saved.
    await assertServiceRejects(repository, rejection.body, rejection.match);
  }
});

test("rejects malformed submission bodies at the strict route boundary", () => {
  // Given: a client submits trusted-looking policy text that is not part of the API contract.
  const body = { ...input(), policyText: "tampered" };
  // When: the route schema parses the body.
  const parsed = intakeSubmissionSchema.safeParse(body);
  // Then: unknown body fields are rejected before persistence.
  assert.equal(parsed.success, false);
});

test("keeps agreement snapshots immutable when source policies mutate later", async () => {
  // Given: active policy rows exist when the intake is accepted.
  const repository = new MemoryIntakeRepository();

  // When: the source policy body changes after persistence.
  await submit(repository, input(), "2026-07-11T01:20:00.000Z");
  const firstPolicy = repository.policies[0] ?? assert.fail("expected policy");
  repository.policies.splice(0, 1, { ...firstPolicy, body: "mutated body" });

  // Then: the persisted detached snapshot still contains the original text.
  assert.equal(saved(repository).agreementSnapshot.policies[0]?.body, "Repair terms body");
});

test("rolls back customer and intake persistence when creation is interrupted", async () => {
  // Given: the repository fails during intake creation inside the transaction.
  const repository = new MemoryIntakeRepository();
  repository.failCreateIntake = true;

  // When/Then: the interrupted transaction leaves no persisted intake.
  await assert.rejects(submit(repository), /interrupted create/);
  assert.equal(repository.saved.length, 0);
});

test("projects agreement details while legacy null rows still render", () => {
  // Given: one legacy intake has no agreement fields and one current intake has snapshots.
  const legacy = buildIntakeDetailAgreementProjection({
    agreementSnapshot: null,
    policyAcknowledgements: null,
    agreementAcceptedAt: null,
    warrantyDays: null,
  });
  const current = buildIntakeDetailAgreementProjection({
    agreementSnapshot: {
      acceptedAt: "2026-07-11T01:30:00.000Z",
      preConditionAccuracyAccepted: true,
      warrantyDays: 365,
      policies: policies().map(({ id, category, version, title, body }) => ({
        id,
        category,
        version,
        title,
        body,
      })),
    },
    policyAcknowledgements: ["policy-terms", "policy-warranty", "policy-data"],
    agreementAcceptedAt: "2026-07-11T01:30:00.000Z",
    warrantyDays: 365,
  });

  // When/Then: legacy output is empty-safe and current output exposes printable details.
  assert.deepEqual(legacy, { acceptedAt: null, warrantyDays: null, policies: [], preConditionAccuracyAccepted: false });
  assert.equal(current.acceptedAt, "2026-07-11T01:30:00.000Z");
  assert.equal(current.warrantyDays, 365);
  assert.equal(current.policies[1]?.title, "Warranty terms");
});
