export type WorkbenchSession = "checking" | "anonymous" | "authenticated";

export type StaffRole = "ADMIN" | "STAFF";

export type CatalogKey = "deviceTypes" | "brands" | "models" | "repairTypes";

export type LoadingTarget =
  | "session"
  | CatalogKey
  | "diagnoses"
  | "match";

export type PricingOutcome =
  | "priced"
  | "inspection_required"
  | "mainboard_required"
  | "data_recovery_required";

export type PricingRuleScope = "EXACT_MODEL" | "BRAND" | "DEVICE";

export interface WorkbenchSelection {
  readonly deviceType: string;
  readonly brand: string;
  readonly model: string;
}

export interface DiagnosisOption {
  readonly id: string;
  readonly symptomCode: string;
  readonly symptomLabel: string;
  readonly repairType: string;
  readonly outcome: string;
  readonly scope: PricingRuleScope;
}

export interface PricedPart {
  readonly id: string;
  readonly quality: string;
  readonly colour: string | null;
  readonly sellPrice: number;
  readonly warrantyDays: number;
  readonly stockQty: number;
}

export interface MatchResult {
  readonly outcome: PricingOutcome;
  readonly diagnosisRuleId: string | null;
  readonly scope: PricingRuleScope | null;
  readonly repairType: string | null;
  readonly parts: readonly PricedPart[];
  readonly relatedParts?: readonly PricedPart[];
  readonly reason?: string;
}

export interface WorkbenchState {
  readonly session: WorkbenchSession;
  /** Role of the authenticated session; null until authenticated. */
  readonly role: StaffRole | null;
  readonly loadingTarget: LoadingTarget | null;
  readonly currentRequestId: number;
  readonly error: string | null;
  readonly options: {
    readonly deviceTypes: readonly string[];
    readonly brands: readonly string[];
    readonly models: readonly string[];
    readonly repairTypes: readonly string[];
  };
  readonly selection: WorkbenchSelection;
  readonly diagnoses: readonly DiagnosisOption[];
  readonly selectedDiagnosisId: string;
  readonly match: MatchResult | null;
  readonly selectedPartId: string | null;
}

export type WorkbenchAction =
  | { readonly type: "SESSION_AUTHENTICATED"; readonly role: StaffRole }
  | { readonly type: "SESSION_ANONYMOUS" }
  | {
      readonly type: "LOAD_STARTED";
      readonly requestId: number;
      readonly target: LoadingTarget;
    }
  | {
      readonly type: "LOAD_FAILED";
      readonly requestId?: number;
      readonly message: string;
    }
  | {
      readonly type: "OPTIONS_LOADED";
      readonly key: CatalogKey;
      readonly values: readonly string[];
      readonly requestId?: number;
    }
  | { readonly type: "SELECT_DEVICE_TYPE"; readonly value: string }
  | { readonly type: "SELECT_BRAND"; readonly value: string }
  | { readonly type: "SELECT_MODEL"; readonly value: string }
  | {
      readonly type: "DIAGNOSES_LOADED";
      readonly values: readonly DiagnosisOption[];
      readonly requestId?: number;
    }
  | { readonly type: "SELECT_DIAGNOSIS"; readonly value: string }
  | {
      readonly type: "MATCH_LOADED";
      readonly result: MatchResult;
      readonly requestId?: number;
    }
  | { readonly type: "SELECT_PART"; readonly value: string }
  | { readonly type: "RESET_SELECTION" };
