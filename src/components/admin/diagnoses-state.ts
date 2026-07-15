import type { AdminRequestResult } from "./diagnoses-request";
import type { DiagnosisForm, DiagnosisRule } from "./diagnoses-types";

export type DiagnosisStatus = "empty" | "error" | "loading" | "ready";

export type DiagnosisPanelState = {
  readonly status: DiagnosisStatus;
  readonly records: readonly DiagnosisRule[];
  readonly error: string | null;
  readonly loadToken: number;
  readonly submitting: boolean;
};

export const initialDiagnosisState: DiagnosisPanelState = {
  status: "loading",
  records: [],
  error: null,
  loadToken: 0,
  submitting: false,
};

export const diagnosisColumns = [
  "Scope",
  "Symptom",
  "Repair",
  "Outcome",
  "Priority",
  "Active",
] as const;

export function beginDiagnosisLoad(state: DiagnosisPanelState): DiagnosisPanelState {
  return {
    ...state,
    status: "loading",
    error: null,
    loadToken: state.loadToken + 1,
  };
}

export function settleDiagnosisLoad(
  state: DiagnosisPanelState,
  token: number,
  result: AdminRequestResult<readonly DiagnosisRule[]>
): DiagnosisPanelState {
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

export function beginDiagnosisSubmit(state: DiagnosisPanelState): {
  readonly accepted: boolean;
  readonly state: DiagnosisPanelState;
} {
  if (state.submitting) return { accepted: false, state };
  return { accepted: true, state: { ...state, submitting: true, error: null } };
}

export function finishDiagnosisSubmit(
  state: DiagnosisPanelState,
  error: string | null
): DiagnosisPanelState {
  return { ...state, submitting: false, error };
}

export function diagnosisScope(rule: DiagnosisRule): string {
  return [rule.deviceType, rule.brand, rule.model].filter(Boolean).join(" / ");
}

export function diagnosisFormFromRule(rule: DiagnosisRule): DiagnosisForm {
  return {
    id: rule.id,
    deviceType: rule.deviceType,
    brand: rule.brand ?? "",
    model: rule.model ?? "",
    symptomCode: rule.symptomCode,
    symptomLabel: rule.symptomLabel,
    repairType: rule.repairType,
    outcome: rule.outcome,
    priority: String(rule.priority),
    active: rule.active,
    notes: rule.notes ?? "",
  };
}

export function diagnosisLayoutForWidth(width: number): "mobile-rows" | "table" {
  return width < 768 ? "mobile-rows" : "table";
}
