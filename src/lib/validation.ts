import { z } from "zod";
import { DEVICE_TYPES, PART_QUALITIES } from "@/lib/config";

/**
 * Staff/admin request schemas (price list, intake, AI, reviews, auth).
 *
 * These are imported by the staff/admin *client* forms for instant validation,
 * so this module is intentionally NOT `server-only` — it ships only inside the
 * authenticated, noindex/no-store staff & admin bundles.
 *
 * SECURITY: the PUBLIC marketing surface must never import this module, or the
 * internal field shapes (costPrice, sellPrice, stockQty, targetMarginPct,
 * imei, …) would land in a public bundle. The public quote form imports the
 * client-safe subset from ./validation-public.ts instead; that module is
 * re-exported below purely for the server-side quote API route.
 */

// Public schema is defined in the client-safe module; import it for local use
// (partSchema/intakeSchema reuse deviceTypeSchema) and re-export for the
// server-side quote route that imports from "@/lib/validation".
import {
  quoteRequestSchema,
  deviceTypeSchema,
  type QuoteRequestInput,
} from "@/lib/validation-public";
export { quoteRequestSchema, deviceTypeSchema, type QuoteRequestInput };

const trimmed = (max: number) => z.string().trim().min(1).max(max);

export const qualitySchema = z.enum(PART_QUALITIES);

// --- Auth -------------------------------------------------------------
export const loginSchema = z.object({
  email: z.string().trim().email().max(200),
  password: z.string().min(8).max(200),
});

// --- Parts (staff price list) ------------------------------------------
export const partSchema = z.object({
  deviceType: deviceTypeSchema,
  brand: trimmed(60),
  model: trimmed(80),
  repairType: trimmed(80),
  quality: qualitySchema,
  colour: z.string().trim().max(60).optional().nullable(),
  costPrice: z.number().min(0).max(100000),
  sellPrice: z.number().min(0).max(100000),
  warrantyDays: z.number().int().min(0).max(3650),
  stockQty: z.number().int().min(0).max(100000),
  sku: z.string().trim().max(80).optional().nullable(),
  supplier: z.string().trim().max(120).optional().nullable(),
  posItemId: z.string().trim().max(120).optional().nullable(),
  notes: z.string().trim().max(1000).optional().nullable(),
  active: z.boolean().optional(),
});
export const partUpdateSchema = partSchema.partial();

// --- Customer intake -----------------------------------------------------
export const preConditionSchema = z.object({
  powersOn: z.boolean(),
  screenCracked: z.boolean(),
  touchWorks: z.boolean(),
  frontCameraWorks: z.boolean(),
  rearCameraWorks: z.boolean(),
  speakerWorks: z.boolean(),
  microphoneWorks: z.boolean(),
  chargingPortWorks: z.boolean(),
  buttonsWork: z.boolean(),
  faceOrTouchIdWorks: z.boolean(),
  waterDamageSuspected: z.boolean(),
  previousRepairs: z.boolean(),
  findMyDisabled: z.boolean(),
  dataBackedUp: z.boolean(),
  simRemoved: z.boolean(),
  cosmeticGrade: z.enum(["LIKE_NEW", "GOOD", "WORN", "DAMAGED"]),
  batteryHealthPct: z.number().int().min(0).max(100).nullable().optional(),
});
export type PreCondition = z.infer<typeof preConditionSchema>;

export const intakeSchema = z.object({
  customer: z.object({
    name: trimmed(100),
    phone: z
      .string()
      .trim()
      .regex(/^[0-9 +()-]{8,20}$/, "Enter a valid phone number"),
    email: z.string().trim().email().max(200).optional().or(z.literal("")),
    suburb: z.string().trim().max(100).optional(),
  }),
  deviceType: deviceTypeSchema,
  brand: trimmed(60),
  model: trimmed(80),
  imei: z.string().trim().max(40).optional(),
  serialNo: z.string().trim().max(60).optional(),
  repairTypes: z.array(trimmed(80)).min(1).max(10),
  preCondition: preConditionSchema,
  accessories: z.string().trim().max(500).optional(),
  conditionNotes: z.string().trim().max(2000).optional(),
  partQuality: qualitySchema.optional(),
  warrantyDays: z.number().int().min(0).max(3650).optional(),
  quotedPrice: z.number().min(0).max(100000).optional(),
  depositPaid: z.number().min(0).max(100000).optional(),
  customerSignature: trimmed(100), // typed full name = acknowledgement
});
export type IntakeInput = z.infer<typeof intakeSchema>;

export const intakeStatusSchema = z.object({
  status: z.enum(["CHECKED_IN", "IN_REPAIR", "READY", "COLLECTED", "CANCELLED"]),
});

// --- Staff in-store repair quote / form (staff-only; prices ARE shown) -------
// One device, one or more repair line items (screen + battery + …). The server
// re-derives every device/repair/quality/price fact from the part ids — the
// client price is never trusted.
export const repairFormSchema = z.object({
  customer: z.object({
    name: trimmed(100),
    email: z.string().trim().email().max(200),
    phone: z
      .string()
      .trim()
      .regex(/^[0-9 +()-]{8,20}$/, "Enter a valid phone number")
      .optional()
      .or(z.literal("")),
  }),
  items: z
    .array(
      z
        .object({
          partId: z.string().cuid(),
          colour: z.string().trim().max(60).optional(),
          discountType: z.enum(["PERCENT", "AMOUNT"]).optional(),
          discountValue: z.number().min(0).max(100000).optional(),
        })
        .refine(
          (i) =>
            !i.discountType ||
            (i.discountValue != null && i.discountValue > 0),
          { message: "Enter a discount value", path: ["discountValue"] }
        )
        .refine(
          (i) => i.discountType !== "PERCENT" || (i.discountValue ?? 0) <= 100,
          { message: "Percent discount cannot exceed 100", path: ["discountValue"] }
        )
    )
    .min(1, "Add at least one repair")
    .max(20),
  preCondition: preConditionSchema.optional(),
  conditionNotes: z.string().trim().max(2000).optional(),
  sendEmail: z.boolean().optional(),
});
export type RepairFormInput = z.infer<typeof repairFormSchema>;

// --- Reviews (admin) ------------------------------------------------------
export const manualReviewSchema = z.object({
  authorName: trimmed(100),
  rating: z.number().int().min(1).max(5),
  text: trimmed(2000),
  reviewedAt: z.string().datetime().optional(),
  visible: z.boolean().optional(),
});

// --- AI (admin + staff) ----------------------------------------------------
export const aiModelSchema = z.object({
  label: trimmed(100),
  modelId: trimmed(100),
  inputPerMTok: z.number().min(0).max(10000),
  outputPerMTok: z.number().min(0).max(10000),
  enabled: z.boolean().optional(),
  notes: z.string().trim().max(500).optional().nullable(),
});

export const aiSettingsSchema = z.object({
  monthlyBudgetUsd: z.number().min(0).max(100000),
  blockAtCap: z.boolean(),
  defaultPricingModel: trimmed(100),
  defaultResearchModel: trimmed(100),
  targetMarginPct: z.number().min(0).max(95),
});

export const pricingRecommendationRequestSchema = z.object({
  partId: z.string().cuid().optional(),
  // Free-form variant when no part row exists yet:
  deviceType: deviceTypeSchema.optional(),
  brand: z.string().trim().max(60).optional(),
  model: z.string().trim().max(80).optional(),
  repairType: z.string().trim().max(80).optional(),
  quality: qualitySchema.optional(),
  costPrice: z.number().min(0).max(100000).optional(),
});

// --- Quote lead status (staff) ---------------------------------------------
export const leadStatusSchema = z.object({
  status: z.enum(["NEW", "EMAILED", "CONTACTED", "BOOKED", "CLOSED"]),
});
