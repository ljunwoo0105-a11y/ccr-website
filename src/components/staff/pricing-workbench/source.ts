import { z } from "zod";
import { apiJson } from "@/lib/api-client";
import type {
  CatalogKey,
  DiagnosisOption,
  MatchResult,
  WorkbenchSelection,
} from "./types";

type Fetcher = (input: RequestInfo | URL, init?: RequestInit) => Promise<Response>;

const roleSchema = z.enum(["STAFF", "ADMIN"]);

const sessionEnvelopeSchema = z.object({
  ok: z.boolean(),
  data: z
    .object({
      id: z.string(),
      email: z.string(),
      name: z.string(),
      role: roleSchema,
    })
    .optional(),
  error: z.string().optional(),
});

const stringArraySchema = z.array(z.string());

const catalogEnvelopeSchema = z.object({
  ok: z.boolean(),
  data: z
    .object({
      deviceTypes: stringArraySchema.optional(),
      brands: stringArraySchema.optional(),
      models: stringArraySchema.optional(),
      repairTypes: stringArraySchema.optional(),
      parts: z
        .array(
          z.object({
            id: z.string(),
            quality: z.string(),
            colour: z.string().nullable(),
            sellPrice: z.number(),
            warrantyDays: z.number(),
            stockQty: z.number(),
          })
        )
        .optional(),
    })
    .optional(),
  error: z.string().optional(),
});

const diagnosisSchema = z.object({
  id: z.string(),
  symptomCode: z.string(),
  symptomLabel: z.string(),
  repairType: z.string(),
  outcome: z.string(),
  scope: z.enum(["EXACT_MODEL", "BRAND", "DEVICE"]),
});

const diagnosesEnvelopeSchema = z.object({
  ok: z.boolean(),
  data: z.object({ diagnoses: z.array(diagnosisSchema) }).optional(),
  error: z.string().optional(),
});

const pricedPartSchema = z.object({
  id: z.string(),
  quality: z.string(),
  colour: z.string().nullable(),
  sellPrice: z.number(),
  warrantyDays: z.number(),
  stockQty: z.number(),
});

const matchResultSchema = z.object({
  outcome: z.enum([
    "priced",
    "inspection_required",
    "mainboard_required",
    "data_recovery_required",
  ]),
  diagnosisRuleId: z.string().nullable(),
  scope: z.enum(["EXACT_MODEL", "BRAND", "DEVICE"]).nullable(),
  repairType: z.string().nullable(),
  parts: z.array(pricedPartSchema),
  relatedParts: z.array(pricedPartSchema).optional(),
  reason: z.string().optional(),
});

const matchEnvelopeSchema = z.object({
  ok: z.boolean(),
  data: matchResultSchema.optional(),
  error: z.string().optional(),
});

export async function fetchStaffSession(fetcher: Fetcher, signal: AbortSignal) {
  const response = await fetcher("/api/staff/session", { signal });
  if (response.status === 401 || response.status === 403) {
    return { kind: "anonymous" } as const;
  }
  const json: unknown = await response.json();
  const parsed = sessionEnvelopeSchema.safeParse(json);
  if (!response.ok || !parsed.success || !parsed.data.ok || !parsed.data.data) {
    return { kind: "anonymous" } as const;
  }
  return { kind: "authenticated", user: parsed.data.data } as const;
}

export async function fetchCatalogOptions(
  fetcher: Fetcher,
  selection: WorkbenchSelection,
  signal: AbortSignal
): Promise<{ readonly key: CatalogKey; readonly values: readonly string[] }> {
  const key = nextCatalogKey(selection);
  const response = await fetcher(catalogUrl(selection), { signal });
  const json: unknown = await response.json();
  const parsed = catalogEnvelopeSchema.safeParse(json);
  const values = parsed.success && parsed.data.ok ? parsed.data.data?.[key] : undefined;
  if (!response.ok || !Array.isArray(values)) {
    throw new Error("Malformed catalog response");
  }
  return { key, values };
}

export async function fetchDiagnoses(
  fetcher: Fetcher,
  selection: WorkbenchSelection,
  signal: AbortSignal
): Promise<readonly DiagnosisOption[]> {
  const response = await fetcher(`/api/staff/pricing/diagnoses?${selectionParams(selection)}`, {
    signal,
  });
  const json: unknown = await response.json();
  const parsed = diagnosesEnvelopeSchema.safeParse(json);
  if (!response.ok || !parsed.success || !parsed.data.ok || !parsed.data.data) {
    throw new Error("Malformed diagnosis response");
  }
  return parsed.data.data.diagnoses;
}

export async function fetchPricingMatch(
  fetcher: Fetcher,
  criteria: WorkbenchSelection & { readonly symptomCode: string },
  signal: AbortSignal
): Promise<MatchResult> {
  const response = await fetcher("/api/staff/pricing/match", {
    ...apiJson("POST", criteria),
    signal,
  });
  const json: unknown = await response.json();
  const parsed = matchEnvelopeSchema.safeParse(json);
  if (!response.ok || !parsed.success || !parsed.data.ok || !parsed.data.data) {
    throw new Error(parsed.success ? parsed.data.error ?? "Pricing match failed" : "Pricing match failed");
  }
  return parsed.data.data;
}

function nextCatalogKey(selection: WorkbenchSelection): CatalogKey {
  if (!selection.deviceType) return "deviceTypes";
  if (!selection.brand) return "brands";
  if (!selection.model) return "models";
  return "repairTypes";
}

function catalogUrl(selection: WorkbenchSelection): string {
  const params = selectionParams(selection);
  const query = params.toString();
  return query ? `/api/staff/quote/catalog?${query}` : "/api/staff/quote/catalog";
}

function selectionParams(selection: WorkbenchSelection): URLSearchParams {
  const params = new URLSearchParams();
  if (selection.deviceType) params.set("deviceType", selection.deviceType);
  if (selection.brand) params.set("brand", selection.brand);
  if (selection.model) params.set("model", selection.model);
  return params;
}
