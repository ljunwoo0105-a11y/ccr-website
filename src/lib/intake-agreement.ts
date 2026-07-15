const REQUIRED_POLICY_CATEGORIES = ["TERMS", "WARRANTY", "DATA"] as const;

export type AgreementPolicyCategory =
  (typeof REQUIRED_POLICY_CATEGORIES)[number];

export interface IntakeAgreementPolicy {
  readonly id: string;
  readonly category: AgreementPolicyCategory;
  readonly version: string;
  readonly title: string;
  readonly body: string;
  readonly active: boolean;
}

export interface IntakeAgreementInput {
  readonly acceptedAt: string;
  readonly policies: readonly IntakeAgreementPolicy[];
  readonly acceptedPolicyIds: readonly string[];
  readonly preConditionAccuracyAccepted: boolean;
  readonly warrantyDays: number | null;
}

export interface IntakeAgreementPolicyRepository {
  readonly listActivePolicies: () => Promise<readonly IntakeAgreementPolicy[]>;
}

export interface IntakeAgreementSnapshotPolicy {
  readonly id: string;
  readonly category: AgreementPolicyCategory;
  readonly version: string;
  readonly title: string;
  readonly body: string;
}

export interface IntakeAgreementSnapshot {
  readonly acceptedAt: string;
  readonly policies: readonly IntakeAgreementSnapshotPolicy[];
  readonly preConditionAccuracyAccepted: true;
  readonly warrantyDays: number | null;
}

interface IntakeAgreementErrorDetails {
  readonly code: IntakeAgreementValidationError["code"];
  readonly message: string;
  readonly category?: AgreementPolicyCategory;
  readonly policyId?: string;
}

export async function buildIntakeAgreementSnapshotFromRepository(
  repository: IntakeAgreementPolicyRepository,
  input: Omit<IntakeAgreementInput, "policies">
): Promise<IntakeAgreementSnapshot> {
  const policies = await repository.listActivePolicies();

  return buildIntakeAgreementSnapshot({ ...input, policies });
}

export function buildIntakeAgreementSnapshot(
  input: IntakeAgreementInput
): IntakeAgreementSnapshot {
  if (!input.preConditionAccuracyAccepted) {
    throw new IntakeAgreementValidationError({
      code: "PRE_CONDITION_REQUIRED",
      message:
        "The customer must accept the pre-condition accuracy acknowledgement.",
    });
  }

  const acceptedPolicyIds = new Set(input.acceptedPolicyIds);
  const activePolicies = input.policies.filter((policy) => policy.active);
  const snapshots = REQUIRED_POLICY_CATEGORIES.map((category) => {
    const policy = findActivePolicy(activePolicies, category);

    if (!acceptedPolicyIds.has(policy.id)) {
      throw new IntakeAgreementValidationError({
        code: "POLICY_ACKNOWLEDGEMENT_REQUIRED",
        message: `Active ${category} policy ${policy.id} was not acknowledged.`,
        category,
        policyId: policy.id,
      });
    }

    return Object.freeze({
      id: policy.id,
      category: policy.category,
      version: policy.version,
      title: policy.title,
      body: policy.body,
    });
  });

  return Object.freeze({
    acceptedAt: input.acceptedAt,
    policies: Object.freeze(snapshots),
    preConditionAccuracyAccepted: true,
    warrantyDays: input.warrantyDays,
  });
}

function findActivePolicy(
  policies: readonly IntakeAgreementPolicy[],
  category: AgreementPolicyCategory
): IntakeAgreementPolicy {
  const policy = policies.find((candidate) => candidate.category === category);

  if (!policy) {
    throw new IntakeAgreementValidationError({
      code: "ACTIVE_POLICY_REQUIRED",
      message: `Active ${category} policy is required.`,
      category
    });
  }

  return policy;
}

export class IntakeAgreementValidationError extends Error {
  readonly code:
    | "ACTIVE_POLICY_REQUIRED"
    | "POLICY_ACKNOWLEDGEMENT_REQUIRED"
    | "PRE_CONDITION_REQUIRED";
  readonly category?: AgreementPolicyCategory;
  readonly policyId?: string;

  constructor(details: IntakeAgreementErrorDetails) {
    super(details.message);
    this.name = "IntakeAgreementValidationError";
    this.code = details.code;
    this.category = details.category;
    this.policyId = details.policyId;
  }
}
