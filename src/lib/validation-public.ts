import { z } from "zod";
import { DEVICE_TYPES, REFERRAL_SOURCES } from "@/lib/config";

/**
 * PUBLIC, client-safe validation schemas.
 *
 * This module is intentionally importable from client components (the public
 * QuoteWizard validates here for instant feedback; the server re-validates).
 *
 * SECURITY: keep this module free of any staff/admin schema. The price-list,
 * intake and AI schemas describe internal fields (costPrice, sellPrice,
 * stockQty, targetMarginPct, imei, …) and must never reach a PUBLIC bundle.
 * They live in ./validation.ts, which the public marketing surface must never
 * import. That module is intentionally NOT `server-only` — the authenticated,
 * noindex/no-store staff & admin *client* forms import it for instant
 * validation — so the public/staff bundle split (not a build-time guard) is
 * what keeps the internal field shapes out of the public client chunk.
 */

const trimmed = (max: number) => z.string().trim().min(1).max(max);

export const deviceTypeSchema = z.enum(DEVICE_TYPES);

const referralValues = REFERRAL_SOURCES.map((r) => r.value) as [
  string,
  ...string[],
];

export const quoteRequestSchema = z.object({
  name: trimmed(100),
  email: z.string().trim().email().max(200),
  phone: z
    .string()
    .trim()
    .regex(/^[0-9 +()-]{8,20}$/, "Enter a valid phone number"),
  suburb: trimmed(100),
  referralSource: z.enum(referralValues),
  referralOther: z.string().trim().max(200).optional(),
  deviceType: deviceTypeSchema,
  brand: trimmed(60),
  model: trimmed(80),
  repairType: trimmed(80),
  issueNotes: z.string().trim().max(1000).optional(),
  consent: z.literal(true, {
    errorMap: () => ({ message: "Please accept the privacy terms" }),
  }),
  // Honeypot — humans never fill this; bots do.
  website: z.string().max(0).optional().or(z.literal("")),
});
export type QuoteRequestInput = z.infer<typeof quoteRequestSchema>;
