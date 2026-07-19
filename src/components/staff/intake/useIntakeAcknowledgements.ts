import { useState } from "react";

import {
  EMPTY_ACKNOWLEDGEMENT_STATE,
  intakeSubmissionReadiness,
  togglePolicyAcknowledgement,
  type AcknowledgementState,
  type IntakeReadiness,
  type PolicyLoadState,
} from "./policies";
import { useActivePolicies } from "./useActivePolicies";

type IntakeAcknowledgementsInput = {
  readonly repairs: readonly string[];
};

type IntakeAcknowledgements = {
  readonly state: AcknowledgementState;
  readonly policyState: PolicyLoadState;
  readonly readiness: IntakeReadiness;
  readonly toggleAcceptedPolicy: (policyId: string) => void;
  readonly setPreConditionAccuracyAccepted: (accepted: boolean) => void;
  /** Every active policy plus the accuracy confirmation, in one tick. */
  readonly setAgreeAll: (accepted: boolean) => void;
  /** True when every policy and the accuracy confirmation are accepted. */
  readonly agreedAll: boolean;
};

export function useIntakeAcknowledgements(
  input: IntakeAcknowledgementsInput
): IntakeAcknowledgements {
  const [state, setState] = useState(EMPTY_ACKNOWLEDGEMENT_STATE);
  const policyState = useActivePolicies();
  const readiness = intakeSubmissionReadiness({
    policyState,
    acceptedPolicyIds: state.acceptedPolicyIds,
    preConditionAccuracyAccepted: state.preConditionAccuracyAccepted,
    repairs: input.repairs,
  });

  const activePolicyIds =
    policyState.kind === "ready"
      ? policyState.policies.map((policy) => policy.id)
      : [];
  const agreedAll =
    activePolicyIds.length > 0 &&
    state.preConditionAccuracyAccepted &&
    activePolicyIds.every((id) => state.acceptedPolicyIds.includes(id));

  function setAgreeAll(accepted: boolean) {
    setState(
      accepted
        ? {
            acceptedPolicyIds: activePolicyIds,
            preConditionAccuracyAccepted: true,
          }
        : EMPTY_ACKNOWLEDGEMENT_STATE
    );
  }

  function toggleAcceptedPolicy(policyId: string) {
    setState((currentState) =>
      togglePolicyAcknowledgement(currentState, policyId)
    );
  }

  function setPreConditionAccuracyAccepted(accepted: boolean) {
    setState((currentState) => ({
      ...currentState,
      preConditionAccuracyAccepted: accepted,
    }));
  }

  return {
    state,
    policyState,
    readiness,
    toggleAcceptedPolicy,
    setPreConditionAccuracyAccepted,
    setAgreeAll,
    agreedAll,
  };
}
