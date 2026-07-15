import { z } from "zod";

const activePolicySchema = z.object({
  id: z.string().trim().min(1).max(120),
  category: z.enum(["TERMS", "WARRANTY", "DATA"]),
  version: z.string().trim().min(1).max(80),
  title: z.string().trim().min(1).max(160),
  body: z.string().trim().min(1).max(10000),
});

const activePolicyEnvelopeSchema = z.object({
  ok: z.literal(true),
  data: z.object({
    policies: z.array(activePolicySchema),
  }),
});

export type ActivePolicy = z.infer<typeof activePolicySchema>;

export type AcknowledgementState = {
  readonly acceptedPolicyIds: readonly string[];
  readonly preConditionAccuracyAccepted: boolean;
};

export type PolicyLoadState =
  | { readonly kind: "loading"; readonly requestId: number }
  | {
      readonly kind: "ready";
      readonly requestId: number;
      readonly policies: readonly ActivePolicy[];
    }
  | {
      readonly kind: "failed";
      readonly requestId: number;
      readonly message: string;
    };

export type PolicyLoadResult =
  | { readonly kind: "ready"; readonly policies: readonly ActivePolicy[] }
  | { readonly kind: "failed"; readonly message: string };

export type IntakeReadinessInput = {
  readonly policyState: PolicyLoadState;
  readonly acceptedPolicyIds: readonly string[];
  readonly preConditionAccuracyAccepted: boolean;
  readonly repairs: readonly string[];
  readonly signature: string;
};

export type IntakeReadiness =
  | {
      readonly kind: "ready";
      readonly acceptedPolicyIds: readonly string[];
    }
  | {
      readonly kind: "blocked";
      readonly reason:
        | "loadingPolicies"
        | "policyLoadFailed"
        | "missingPolicies"
        | "missingAccuracy"
        | "missingRepair"
        | "missingSignature";
      readonly message: string;
    };

export const EMPTY_ACKNOWLEDGEMENT_STATE: AcknowledgementState = {
  acceptedPolicyIds: [],
  preConditionAccuracyAccepted: false,
};

export function parseActivePolicyResponse(raw: unknown): PolicyLoadResult {
  const parsed = activePolicyEnvelopeSchema.safeParse(raw);
  if (!parsed.success) {
    return {
      kind: "failed",
      message: "Required policies could not be loaded.",
    };
  }
  return { kind: "ready", policies: parsed.data.data.policies };
}

export function resolvePolicyLoad(
  currentState: PolicyLoadState,
  requestId: number,
  result: PolicyLoadResult
): PolicyLoadState {
  if (currentState.requestId !== requestId) return currentState;
  if (result.kind === "failed") {
    return { kind: "failed", requestId, message: result.message };
  }
  return { kind: "ready", requestId, policies: result.policies };
}

export function togglePolicyAcknowledgement(
  state: AcknowledgementState,
  policyId: string
): AcknowledgementState {
  const acceptedPolicyIds = state.acceptedPolicyIds.includes(policyId)
    ? state.acceptedPolicyIds.filter((acceptedId) => acceptedId !== policyId)
    : [...state.acceptedPolicyIds, policyId];
  return { ...state, acceptedPolicyIds };
}

export function resetAcknowledgements(
  state: AcknowledgementState
): AcknowledgementState {
  if (
    state.acceptedPolicyIds.length === 0 &&
    !state.preConditionAccuracyAccepted
  ) {
    return state;
  }
  return EMPTY_ACKNOWLEDGEMENT_STATE;
}

export function intakeSubmissionReadiness(
  input: IntakeReadinessInput
): IntakeReadiness {
  if (input.policyState.kind === "loading") {
    return {
      kind: "blocked",
      reason: "loadingPolicies",
      message: "Required policies are still loading.",
    };
  }
  if (input.policyState.kind === "failed") {
    return {
      kind: "blocked",
      reason: "policyLoadFailed",
      message: input.policyState.message,
    };
  }
  const activePolicyIds = input.policyState.policies.map((policy) => policy.id);
  const accepted = new Set(input.acceptedPolicyIds);
  const categories = new Set(
    input.policyState.policies.map((policy) => policy.category)
  );
  const hasAllCategories =
    categories.has("TERMS") && categories.has("WARRANTY") && categories.has("DATA");
  const hasAllPolicyIds = activePolicyIds.every((policyId) =>
    accepted.has(policyId)
  );
  if (!hasAllCategories || !hasAllPolicyIds) {
    return {
      kind: "blocked",
      reason: "missingPolicies",
      message: "Accept every active repair policy.",
    };
  }
  if (!input.preConditionAccuracyAccepted) {
    return {
      kind: "blocked",
      reason: "missingAccuracy",
      message: "Confirm the pre-repair condition record is accurate.",
    };
  }
  if (input.repairs.length === 0) {
    return {
      kind: "blocked",
      reason: "missingRepair",
      message: "Select at least one repair type.",
    };
  }
  if (!input.signature.trim()) {
    return {
      kind: "blocked",
      reason: "missingSignature",
      message: "Customer signature is required.",
    };
  }
  return { kind: "ready", acceptedPolicyIds: activePolicyIds };
}
