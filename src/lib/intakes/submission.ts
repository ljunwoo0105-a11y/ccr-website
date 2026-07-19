import { z } from "zod";
import {
  buildIntakeAgreementSnapshot,
  IntakeAgreementValidationError,
  type IntakeAgreementPolicy,
  type IntakeAgreementSnapshot,
} from "@/lib/intake-agreement";
import { intakeSchema } from "@/lib/validation";
import type {
  IntakePricingSource,
  IntakeSubmissionDiagnosisRule,
  IntakeSubmissionInput,
  IntakeSubmissionPart,
  IntakeSubmissionRepository, IntakeSubmissionTransaction,
  PersistedIntakeSubmission,
} from "@/lib/intakes/types";

export type {
  IntakePricingSource,
  IntakeSubmissionCustomer,
  IntakeSubmissionCustomerDraft,
  IntakeSubmissionDiagnosisRule,
  IntakeSubmissionInput,
  IntakeSubmissionPart,
  IntakeSubmissionRepository,
  IntakeSubmissionTransaction,
  PersistedIntakeDraft,
  PersistedIntakeSubmission,
  PolicyAcknowledgement,
} from "@/lib/intakes/types";

const REQUIRED_POLICY_CATEGORIES = ["TERMS", "WARRANTY", "DATA"] as const;

export const intakeSubmissionSchema = intakeSchema
  .extend({
    partId: z.string().trim().min(1).optional(),
    diagnosisRuleId: z.string().trim().min(1).optional(),
    acceptedPolicyIds: z.array(z.string().trim().min(1)).min(3).max(20),
    preConditionAccuracyAccepted: z.literal(true),
  })
  .strict();

export async function createIntakeSubmission(input: {
  readonly staffId: string;
  readonly acceptedAt: string;
  readonly input: IntakeSubmissionInput;
  readonly repository: IntakeSubmissionRepository;
}): Promise<PersistedIntakeSubmission> {
  return input.repository.withTransaction(async (transaction) => {
    const [part, diagnosis, policies] = await Promise.all([
      resolvePart(transaction, input.input),
      resolveDiagnosis(transaction, input.input),
      transaction.listActivePolicies(),
    ]);
    const activePolicies = requireExactlyOnePolicyPerCategory(policies);
    const pricing = priceSubmission(input.input, part);
    validateDiagnosis(input.input, diagnosis, part);
    const agreementSnapshot = buildAgreementSnapshot({
      acceptedAt: input.acceptedAt,
      policies: activePolicies,
      acceptedPolicyIds: input.input.acceptedPolicyIds,
      preConditionAccuracyAccepted: input.input.preConditionAccuracyAccepted,
      warrantyDays: pricing.warrantyDays,
    });
    const customer =
      (await transaction.findCustomerByPhone(input.input.customer.phone)) ??
      (await transaction.createCustomer({
        name: input.input.customer.name,
        phone: input.input.customer.phone,
        email: input.input.customer.email ? input.input.customer.email : null,
        suburb: input.input.customer.suburb ? input.input.customer.suburb : null,
      }));

    return transaction.createIntake({
      customerId: customer.id,
      staffId: input.staffId,
      deviceType: input.input.deviceType,
      brand: input.input.brand,
      model: input.input.model,
      imei: input.input.imei ? input.input.imei : null,
      serialNo: input.input.serialNo ? input.input.serialNo : null,
      repairTypes: input.input.repairTypes,
      preCondition: input.input.preCondition,
      accessories: input.input.accessories ? input.input.accessories : null,
      conditionNotes: input.input.conditionNotes ? input.input.conditionNotes : null,
      partQuality: pricing.partQuality,
      warrantyDays: pricing.warrantyDays,
      quotedPrice: pricing.quotedPrice,
      depositPaid: input.input.depositPaid ?? false,
      customerSignature: input.input.customerSignature?.trim() || null,
      matchedPartId: part?.id ?? null,
      diagnosisRuleId: diagnosis?.id ?? null,
      diagnosisCode: diagnosis?.symptomCode ?? null,
      diagnosisLabel: diagnosis?.symptomLabel ?? null,
      diagnosisOutcome: diagnosis?.outcome ?? null,
      pricingSource: pricing.source,
      agreementSnapshot,
      policyAcknowledgements: agreementSnapshot.policies.map((policy) => ({
        policyId: policy.id,
        category: policy.category,
        version: policy.version,
        acceptedAt: input.acceptedAt,
      })),
      agreementAcceptedAt: input.acceptedAt,
      preConditionAccuracyAccepted: true,
    });
  });
}

async function resolvePart(
  transaction: IntakeSubmissionTransaction,
  input: IntakeSubmissionInput
): Promise<IntakeSubmissionPart | null> {
  if (!input.partId) return null;
  const part = await transaction.findActivePartById(input.partId);
  if (!part) {
    throw new IntakeSubmissionValidationError("Active matched part is required.");
  }
  if (
    part.deviceType !== input.deviceType ||
    part.brand !== input.brand ||
    part.model !== input.model ||
    !input.repairTypes.includes(part.repairType)
  ) {
    throw new IntakeSubmissionValidationError(
      "Matched part is stale for this intake."
    );
  }
  return part;
}

async function resolveDiagnosis(
  transaction: IntakeSubmissionTransaction,
  input: IntakeSubmissionInput
): Promise<IntakeSubmissionDiagnosisRule | null> {
  if (!input.diagnosisRuleId) return null;
  const rule = await transaction.findActiveDiagnosisRuleById(
    input.diagnosisRuleId
  );
  if (!rule) {
    throw new IntakeSubmissionValidationError(
      "Active diagnosis rule is required."
    );
  }
  return rule;
}

function validateDiagnosis(
  input: IntakeSubmissionInput,
  rule: IntakeSubmissionDiagnosisRule | null,
  part: IntakeSubmissionPart | null
): void {
  if (!rule) return;
  const brandMatches = rule.brand === null || rule.brand === input.brand;
  const modelMatches = rule.model === null || rule.model === input.model;
  const repairMatches = part
    ? rule.repairType === part.repairType
    : input.repairTypes.includes(rule.repairType);
  if (
    !rule.active ||
    rule.deviceType !== input.deviceType ||
    !brandMatches ||
    !modelMatches ||
    !repairMatches
  ) {
    throw new IntakeSubmissionValidationError(
      "Diagnosis rule is stale for this intake."
    );
  }
}

function priceSubmission(
  input: IntakeSubmissionInput,
  part: IntakeSubmissionPart | null
): {
  readonly source: IntakePricingSource;
  readonly partQuality: string | null;
  readonly warrantyDays: number | null;
  readonly quotedPrice: number | null;
} {
  if (part) {
    return {
      source: "MATCHED",
      partQuality: part.quality,
      warrantyDays: part.warrantyDays,
      quotedPrice: part.sellPrice,
    };
  }
  return {
    source: "MANUAL",
    partQuality: input.partQuality ?? null,
    warrantyDays: input.warrantyDays ?? null,
    quotedPrice: input.quotedPrice ?? null,
  };
}

function requireExactlyOnePolicyPerCategory(
  policies: readonly IntakeAgreementPolicy[]
): readonly IntakeAgreementPolicy[] {
  return REQUIRED_POLICY_CATEGORIES.map((category) => {
    const matches = policies.filter(
      (policy) => policy.active && policy.category === category
    );
    const match = matches[0];
    if (matches.length !== 1 || !match) {
      throw new IntakeSubmissionValidationError(
        `Exactly one active ${category} policy is required.`
      );
    }
    return match;
  });
}

function buildAgreementSnapshot(input: {
  readonly acceptedAt: string;
  readonly policies: readonly IntakeAgreementPolicy[];
  readonly acceptedPolicyIds: readonly string[];
  readonly preConditionAccuracyAccepted: boolean;
  readonly warrantyDays: number | null;
}): IntakeAgreementSnapshot {
  try {
    requireExactPolicyAcknowledgements(input.policies, input.acceptedPolicyIds);
    return buildIntakeAgreementSnapshot(input);
  } catch (error) {
    if (error instanceof IntakeAgreementValidationError) {
      throw new IntakeSubmissionValidationError(error.message);
    }
    throw error;
  }
}

function requireExactPolicyAcknowledgements(
  policies: readonly IntakeAgreementPolicy[],
  acceptedPolicyIds: readonly string[]
): void {
  const policyIds = new Set(policies.map((policy) => policy.id));
  const acceptedIds = new Set(acceptedPolicyIds);

  if (
    acceptedPolicyIds.length !== policies.length ||
    acceptedIds.size !== policyIds.size
  ) {
    throw new IntakeSubmissionValidationError(
      "Exactly the active policy documents must be acknowledged."
    );
  }

  for (const policyId of acceptedIds) {
    if (!policyIds.has(policyId)) {
      throw new IntakeSubmissionValidationError(
        "Exactly the active policy documents must be acknowledged."
      );
    }
  }
}

export class IntakeSubmissionValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "IntakeSubmissionValidationError";
  }
}
