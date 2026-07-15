import type {
  MatchResult,
  PricedPart,
  WorkbenchAction,
  WorkbenchSelection,
  WorkbenchState,
} from "./types";

export const initialWorkbenchState: WorkbenchState = {
  session: "checking",
  loadingTarget: "session",
  currentRequestId: 0,
  error: null,
  options: { deviceTypes: [], brands: [], models: [], repairTypes: [] },
  selection: { deviceType: "", brand: "", model: "" },
  diagnoses: [],
  selectedDiagnosisId: "",
  match: null,
  selectedPartId: null,
};

const clearedMatch = {
  diagnoses: [],
  selectedDiagnosisId: "",
  match: null,
  selectedPartId: null,
} as const;

export function pricingWorkbenchReducer(
  state: WorkbenchState,
  action: WorkbenchAction
): WorkbenchState {
  if (hasStaleRequest(state, action)) return state;

  switch (action.type) {
    case "SESSION_AUTHENTICATED":
      return { ...state, session: "authenticated", loadingTarget: null };
    case "SESSION_ANONYMOUS":
      return { ...initialWorkbenchState, session: "anonymous", loadingTarget: null };
    case "LOAD_STARTED":
      return {
        ...state,
        currentRequestId: action.requestId,
        loadingTarget: action.target,
        error: null,
      };
    case "LOAD_FAILED":
      return { ...state, loadingTarget: null, error: action.message };
    case "OPTIONS_LOADED":
      return {
        ...state,
        loadingTarget: null,
        options: { ...state.options, [action.key]: action.values },
      };
    case "SELECT_DEVICE_TYPE":
      return {
        ...state,
        selection: { deviceType: action.value, brand: "", model: "" },
        options: { ...state.options, brands: [], models: [], repairTypes: [] },
        ...clearedMatch,
      };
    case "SELECT_BRAND":
      return {
        ...state,
        selection: { ...state.selection, brand: action.value, model: "" },
        options: { ...state.options, models: [], repairTypes: [] },
        ...clearedMatch,
      };
    case "SELECT_MODEL":
      return {
        ...state,
        selection: { ...state.selection, model: action.value },
        options: { ...state.options, repairTypes: [] },
        ...clearedMatch,
      };
    case "DIAGNOSES_LOADED":
      return { ...state, diagnoses: action.values, loadingTarget: null };
    case "SELECT_DIAGNOSIS":
      return { ...state, selectedDiagnosisId: action.value, match: null, selectedPartId: null };
    case "MATCH_LOADED":
      return {
        ...state,
        match: action.result,
        selectedPartId: visiblePricedParts(action.result)[0]?.id ?? null,
        loadingTarget: null,
      };
    case "SELECT_PART":
      return { ...state, selectedPartId: action.value };
    case "RESET_SELECTION":
      return {
        ...initialWorkbenchState,
        session: state.session,
        loadingTarget: null,
        options: { ...initialWorkbenchState.options, deviceTypes: state.options.deviceTypes },
      };
    default:
      return assertNever(action);
  }
}

function hasStaleRequest(
  state: WorkbenchState,
  action: WorkbenchAction
): boolean {
  if (action.type === "LOAD_STARTED") return false;
  return "requestId" in action && action.requestId !== undefined
    ? action.requestId !== state.currentRequestId
    : false;
}

export function visiblePricedParts(result: MatchResult): readonly PricedPart[] {
  return result.parts.length > 0 ? result.parts : result.relatedParts ?? [];
}

export function shouldShowBoardReference(
  result: Pick<MatchResult, "outcome">
): boolean {
  return (
    result.outcome === "mainboard_required" ||
    result.outcome === "data_recovery_required"
  );
}

export function boundedDiagnosisDisplay(value: string): string | null {
  const trimmed = value.trim();
  if (trimmed.length === 0 || trimmed.length > 120) return null;
  return /[\u0000-\u001f\u007f]/.test(trimmed) ? null : trimmed;
}

export function buildIntakeHref(input: {
  readonly partId: string;
  readonly diagnosisRuleId: string;
  readonly diagnosis: string;
}): string {
  const params = new URLSearchParams({
    partId: input.partId,
    diagnosisRuleId: input.diagnosisRuleId,
    diagnosis: boundedDiagnosisDisplay(input.diagnosis) ?? "Diagnosis matched",
  });
  return `/staff/intake/new?${params.toString()}`;
}

export function selectedDiagnosisLabel(state: WorkbenchState): string {
  return (
    state.diagnoses.find((diagnosis) => diagnosis.id === state.selectedDiagnosisId)
      ?.symptomLabel ?? "Diagnosis matched"
  );
}

export function isCascadeReady(selection: WorkbenchSelection): boolean {
  return Boolean(selection.deviceType && selection.brand && selection.model);
}

function assertNever(value: never): never {
  throw new Error(`Unhandled workbench action: ${JSON.stringify(value)}`);
}
