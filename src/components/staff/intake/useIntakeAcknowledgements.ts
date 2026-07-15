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
  readonly signature: string;
};

type IntakeAcknowledgements = {
  readonly state: AcknowledgementState;
  readonly policyState: PolicyLoadState;
  readonly readiness: IntakeReadiness;
  readonly toggleAcceptedPolicy: (policyId: string) => void;
  readonly setPreConditionAccuracyAccepted: (accepted: boolean) => void;
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
    signature: input.signature,
  });

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
  };
}
