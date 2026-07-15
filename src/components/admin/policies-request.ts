import { z } from "zod";
import {
  policiesSchema,
  policySchema,
  type Policy,
  type PolicyForm,
  type PolicyPayload,
} from "./policies-types";

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

export function toPolicyPayload(form: PolicyForm): PolicyPayload {
  return {
    category: form.category,
    version: form.version.trim(),
    title: form.title.trim(),
    body: form.body.trim(),
    active: form.active,
  };
}

export function policyFormError(form: PolicyForm): string | null {
  const payload = toPolicyPayload(form);
  if (!payload.version || !payload.title || !payload.body) {
    return "Version, title, and body are required.";
  }
  if (!/^[0-9]{4}-[0-9]{2}-[0-9]{2}\.[0-9]+$/.test(payload.version)) {
    return "Version must look like 2099-01-01.1.";
  }
  return null;
}

export async function listPolicies(
  fetcher: AdminFetcher = fetch
): Promise<AdminRequestResult<readonly Policy[]>> {
  return adminRequest({ fetcher, url: "/api/admin/policies", schema: policiesSchema });
}

export async function savePolicy(
  payload: PolicyPayload,
  fetcher: AdminFetcher = fetch,
  id?: string
): Promise<AdminRequestResult<Policy>> {
  const url = id ? `/api/admin/policies/${id}` : "/api/admin/policies";
  const method = id ? "PATCH" : "POST";
  return adminRequest({
    fetcher,
    url,
    schema: policySchema,
    init: {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    },
  });
}

export async function deletePolicy(
  id: string,
  mode: DeleteMode,
  fetcher: AdminFetcher = fetch
): Promise<AdminRequestResult<Policy | { readonly deleted: true }>> {
  const url = mode === "hard" ? `/api/admin/policies/${id}?hard=true` : `/api/admin/policies/${id}`;
  return adminRequest({
    fetcher,
    url,
    schema: z.union([policySchema, deletedSchema]),
    init: { method: "DELETE" },
  });
}
