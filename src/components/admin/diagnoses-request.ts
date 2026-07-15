import { z } from "zod";
import {
  diagnosisRuleSchema,
  diagnosisRulesSchema,
  type DiagnosisForm,
  type DiagnosisPayload,
  type DiagnosisRule,
} from "./diagnoses-types";

export type AdminRequestResult<T> =
  | { readonly kind: "ok"; readonly data: T }
  | { readonly kind: "error"; readonly message: string; readonly status: number | null };

export type DeleteMode = "deactivate" | "hard";
export type AdminFetcher = (url: string, init?: RequestInit) => Promise<Response>;
type AdminRequestSpec<T> = {
  readonly fetcher: AdminFetcher;
  readonly url: string;
  readonly schema: z.ZodType<T>;
  readonly init?: RequestInit;
};

const deletedSchema = z.object({ deleted: z.literal(true) });
const responseEnvelopeSchema = z.object({
  ok: z.boolean(),
  data: z.unknown().optional(),
  error: z.string().optional(),
});

function blankToNull(value: string): string | null {
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

async function parseAdminResponse<T>(
  response: Response,
  schema: z.ZodType<T>
): Promise<AdminRequestResult<T>> {
  try {
    const body: unknown = await response.json();
    const parsed = responseEnvelopeSchema.safeParse(body);
    if (!parsed.success) {
      return {
        kind: "error",
        message: `Malformed admin response (${response.status})`,
        status: response.status,
      };
    }
    if (!parsed.data.ok) {
      return {
        kind: "error",
        message: parsed.data.error ?? `Request failed (${response.status})`,
        status: response.status,
      };
    }
    const data = schema.safeParse(parsed.data.data);
    if (data.success) return { kind: "ok", data: data.data };
    return {
      kind: "error",
      message: `Malformed admin response (${response.status})`,
      status: response.status,
    };
  } catch (error) {
    if (error instanceof Error) {
      return { kind: "error", message: "Network error - please try again.", status: null };
    }
    return { kind: "error", message: "Network error - please try again.", status: null };
  }
}

async function adminRequest<T>(spec: AdminRequestSpec<T>): Promise<AdminRequestResult<T>> {
  try {
    const response = await spec.fetcher.call(globalThis, spec.url, spec.init);
    return await parseAdminResponse(response, spec.schema);
  } catch (error) {
    if (error instanceof Error) {
      return { kind: "error", message: "Network error - please try again.", status: null };
    }
    return { kind: "error", message: "Network error - please try again.", status: null };
  }
}

export function toDiagnosisPayload(form: DiagnosisForm): DiagnosisPayload {
  return {
    deviceType: form.deviceType.trim(),
    brand: blankToNull(form.brand),
    model: blankToNull(form.model),
    symptomCode: form.symptomCode.trim(),
    symptomLabel: form.symptomLabel.trim(),
    repairType: form.repairType.trim(),
    outcome: form.outcome,
    priority: Number.parseInt(form.priority, 10),
    active: form.active,
    notes: blankToNull(form.notes),
  };
}

export function diagnosisFormError(form: DiagnosisForm): string | null {
  const payload = toDiagnosisPayload(form);
  if (
    !payload.deviceType ||
    !payload.symptomCode ||
    !payload.symptomLabel ||
    !payload.repairType
  ) {
    return "Scope, symptom, and repair fields are required.";
  }
  if (!Number.isInteger(payload.priority) || payload.priority < 0 || payload.priority > 1000) {
    return "Priority must be a whole number from 0 to 1000.";
  }
  return null;
}

export async function listDiagnosisRules(
  fetcher: AdminFetcher = fetch
): Promise<AdminRequestResult<readonly DiagnosisRule[]>> {
  return adminRequest({ fetcher, url: "/api/admin/diagnoses", schema: diagnosisRulesSchema });
}

export async function saveDiagnosisRule(
  payload: DiagnosisPayload,
  fetcher: AdminFetcher = fetch,
  id?: string
): Promise<AdminRequestResult<DiagnosisRule>> {
  const url = id ? `/api/admin/diagnoses/${id}` : "/api/admin/diagnoses";
  const method = id ? "PATCH" : "POST";
  return adminRequest({
    fetcher,
    url,
    schema: diagnosisRuleSchema,
    init: {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    },
  });
}

export async function deleteDiagnosisRule(
  id: string,
  mode: DeleteMode,
  fetcher: AdminFetcher = fetch
): Promise<AdminRequestResult<DiagnosisRule | { readonly deleted: true }>> {
  const url =
    mode === "hard" ? `/api/admin/diagnoses/${id}?hard=true` : `/api/admin/diagnoses/${id}`;
  return adminRequest({
    fetcher,
    url,
    schema: z.union([diagnosisRuleSchema, deletedSchema]),
    init: { method: "DELETE" },
  });
}
