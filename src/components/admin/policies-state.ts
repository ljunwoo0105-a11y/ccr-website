import type { AdminRequestResult } from "./policies-request";
import type { Policy, PolicyForm } from "./policies-types";

export type PolicyStatus = "empty" | "error" | "loading" | "ready";

export type PolicyPanelState = {
  readonly status: PolicyStatus;
  readonly records: readonly Policy[];
  readonly error: string | null;
  readonly loadToken: number;
  readonly submitting: boolean;
};

export const initialPolicyState: PolicyPanelState = {
  status: "loading",
  records: [],
  error: null,
  loadToken: 0,
  submitting: false,
};

export const policyColumns = ["Category", "Version", "Title", "Active"] as const;

export function beginPolicyLoad(state: PolicyPanelState): PolicyPanelState {
  return {
    ...state,
    status: "loading",
    error: null,
    loadToken: state.loadToken + 1,
  };
}

export function settlePolicyLoad(
  state: PolicyPanelState,
  token: number,
  result: AdminRequestResult<readonly Policy[]>
): PolicyPanelState {
  if (token !== state.loadToken) return state;
  if (result.kind === "error") {
    return { ...state, status: "error", error: result.message };
  }
  return {
    ...state,
    records: result.data,
    status: result.data.length > 0 ? "ready" : "empty",
    error: null,
  };
}

export function beginPolicySubmit(state: PolicyPanelState): {
  readonly accepted: boolean;
  readonly state: PolicyPanelState;
} {
  if (state.submitting) return { accepted: false, state };
  return { accepted: true, state: { ...state, submitting: true, error: null } };
}

export function finishPolicySubmit(
  state: PolicyPanelState,
  error: string | null
): PolicyPanelState {
  return { ...state, submitting: false, error };
}

export function policyFormFromRecord(record: Policy): PolicyForm {
  return {
    id: record.id,
    category: record.category,
    version: record.version,
    title: record.title,
    body: record.body,
    active: record.active,
  };
}

export function policyLayoutForWidth(width: number): "mobile-rows" | "table" {
  return width < 768 ? "mobile-rows" : "table";
}
