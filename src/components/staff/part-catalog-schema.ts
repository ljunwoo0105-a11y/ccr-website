import { z } from "zod";
import { partSchema } from "@/lib/validation";

const catalogPartSchema = partSchema.extend({
  id: z.string(),
  colour: z.string().nullable(),
  sku: z.string().nullable(),
  supplier: z.string().nullable(),
  posItemId: z.string().nullable(),
  notes: z.string().nullable(),
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
