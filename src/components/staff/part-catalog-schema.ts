import { z } from "zod";
import { partSchema } from "@/lib/validation";

// costPrice / sku / supplier / posItemId / notes are admin-only: the parts
// API omits them for STAFF sessions, so the row schema treats them as absent.
const catalogPartSchema = partSchema.extend({
  id: z.string(),
  colour: z.string().nullable(),
  costPrice: z.number().min(0).max(100000).optional(),
  sku: z.string().nullable().optional(),
  supplier: z.string().nullable().optional(),
  posItemId: z.string().nullable().optional(),
  notes: z.string().nullable().optional(),
  active: z.boolean(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

const apiEnvelopeSchema = z.discriminatedUnion("ok", [
  z.object({
    ok: z.literal(true),
    data: z.unknown().optional(),
  }),
  z.object({
    ok: z.literal(false),
    error: z.string().optional(),
  }),
]);

const catalogPartsResponseSchema = z.discriminatedUnion("ok", [
  z.object({
    ok: z.literal(true),
    data: z.array(catalogPartSchema),
  }),
  z.object({
    ok: z.literal(false),
    error: z.string().optional(),
  }),
]);

const bulkPartsResponseSchema = z.discriminatedUnion("ok", [
  z.object({
    ok: z.literal(true),
    data: z.object({
      succeeded: z.array(z.string()),
      failed: z.array(
        z.object({
          id: z.string(),
          ok: z.literal(false),
          reason: z.string().optional(),
        })
      ),
    }),
  }),
  z.object({
    ok: z.literal(false),
    error: z.string().optional(),
  }),
]);

export type BulkPartsResponse = z.infer<typeof bulkPartsResponseSchema>;

export class CatalogResponseParseError extends Error {
  constructor() {
    super("Invalid catalog response");
    this.name = "CatalogResponseParseError";
  }
}

export type ApiEnvelope = z.infer<typeof apiEnvelopeSchema>;
export type CatalogPartRow = z.infer<typeof catalogPartSchema>;
export type CatalogPartsResponse = z.infer<typeof catalogPartsResponseSchema>;

export function parseApiEnvelope(value: unknown): ApiEnvelope {
  const parsed = apiEnvelopeSchema.safeParse(value);
  if (!parsed.success) throw new CatalogResponseParseError();
  return parsed.data;
}

export function parseCatalogPartsResponse(value: unknown): CatalogPartsResponse {
  const parsed = catalogPartsResponseSchema.safeParse(value);
  if (!parsed.success) throw new CatalogResponseParseError();
  return parsed.data;
}

export function parseBulkPartsResponse(value: unknown): BulkPartsResponse {
  const parsed = bulkPartsResponseSchema.safeParse(value);
  if (!parsed.success) throw new CatalogResponseParseError();
  return parsed.data;
}
