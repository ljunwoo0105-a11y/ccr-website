export const INTAKE_STATUSES = [
  "CHECKED_IN",
  "IN_REPAIR",
  "READY",
  "COLLECTED",
  "CANCELLED",
] as const;

export const REPAIR_FORM_STATUSES = [
  "QUOTED",
  "EMAILED",
  "ACCEPTED",
  "DECLINED",
] as const;

export type IntakeStatus = (typeof INTAKE_STATUSES)[number];
export type RepairFormStatus = (typeof REPAIR_FORM_STATUSES)[number];

export type IntakeListRow = {
  readonly id: string;
  readonly status: string;
  readonly customerName: string;
  readonly customerPhone: string;
  readonly customerEmail: string | null;
  readonly deviceType: string;
  readonly brand: string;
  readonly model: string;
  readonly repairTypes: string | null;
  readonly agreementAcceptedAt: string | null;
  readonly hasAgreementSnapshot: boolean;
  readonly preConditionAccuracyAccepted: boolean;
  readonly createdAt: string;
  readonly updatedAt: string;
};

export type RepairFormListRow = {
  readonly id: string;
  readonly status: string;
  readonly customerName: string;
  readonly customerEmail: string;
  readonly customerPhone: string | null;
  readonly deviceType: string;
  readonly brand: string;
  readonly model: string;
  readonly emailedAt: string | null;
  readonly emailError: string | null;
  readonly createdAt: string;
  readonly updatedAt: string;
};

export type IntakePatch = {
  readonly status?: IntakeStatus;
  readonly customer?: {
    readonly name: string;
    readonly phone: string;
    readonly email: string | null;
  };
  readonly deviceType?: string;
  readonly brand?: string;
  readonly model?: string;
  readonly repairTypes?: readonly string[];
};

export type RepairFormPatch = {
  readonly status?: RepairFormStatus;
  readonly customerName?: string;
  readonly customerEmail?: string;
  readonly customerPhone?: string | null;
  readonly deviceType?: string;
  readonly brand?: string;
  readonly model?: string;
};

export type ValidationResult<T> =
  | { readonly kind: "ok"; readonly patch: T }
  | { readonly kind: "invalid"; readonly message: string };

type RecordAction =
  | { readonly kind: "patch"; readonly patch: IntakePatch | RepairFormPatch }
  | { readonly kind: "delete" };

type RecordActionInput = {
  readonly type: "intake" | "repair-form";
  readonly id: string;
  readonly action: RecordAction;
};

function recordPath(input: RecordActionInput): string {
  const segment = input.type === "intake" ? "intakes" : "repair-forms";
  return `/api/admin/records/${segment}/${encodeURIComponent(input.id)}`;
}

export function buildRecordActionRequest(input: RecordActionInput): {
  readonly url: string;
  readonly init: RequestInit;
} {
  if (input.action.kind === "delete") {
    return { url: recordPath(input), init: { method: "DELETE" } };
  }
  return {
    url: recordPath(input),
    init: {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input.action.patch),
    },
  };
}

export function deleteConfirmationMatches(value: string): boolean {
  return value === "DELETE";
}

export function intakeStatusPatch(value: string): ValidationResult<IntakePatch> {
  switch (value) {
    case "CHECKED_IN":
    case "IN_REPAIR":
    case "READY":
    case "COLLECTED":
    case "CANCELLED":
      return { kind: "ok", patch: { status: value } };
    default:
      return { kind: "invalid", message: "Choose a valid intake status." };
  }
}

export function repairFormStatusPatch(
  value: string
): ValidationResult<RepairFormPatch> {
  switch (value) {
    case "QUOTED":
    case "EMAILED":
    case "ACCEPTED":
    case "DECLINED":
      return { kind: "ok", patch: { status: value } };
    default:
      return { kind: "invalid", message: "Choose a valid repair form status." };
  }
}

export function compactText(value: string): string {
  return value.trim().replace(/\s+/g, " ");
}

export function splitRepairTypes(value: string): readonly string[] {
  return value
    .split(",")
    .map(compactText)
    .filter((item) => item.length > 0);
}

export function repairTypesLabel(value: string | null): string {
  if (!value) return "Legacy row: repair list unavailable";
  let parsed: unknown;
  try {
    parsed = JSON.parse(value);
  } catch (error) {
    if (error instanceof SyntaxError) {
      return "Legacy row: repair list unavailable";
    }
    throw error;
  }
  if (!Array.isArray(parsed)) return "Legacy row: repair list unavailable";
  const labels = parsed.filter(
    (item): item is string => typeof item === "string" && item.trim().length > 0
  );
  return labels.length > 0 ? labels.join(", ") : "Legacy row: repair list unavailable";
}
