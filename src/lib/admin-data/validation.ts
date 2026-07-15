import { z } from "zod";

const text = z.string().trim().min(1).max(200);
const optionalText = text.nullable();
const money = z.number().finite().min(0).nullable();

export const diagnosisOutcomeSchema = z.enum([
  "PART",
  "MAINBOARD",
  "DATA_RECOVERY",
  "INSPECTION",
]);

export const createDiagnosisSchema = z
  .object({
    deviceType: text,
    brand: optionalText,
    model: optionalText,
    symptomCode: text,
    symptomLabel: text,
    repairType: text,
    outcome: diagnosisOutcomeSchema,
    priority: z.number().int().min(0).max(1000),
    active: z.boolean(),
    notes: z.string().trim().max(1000).nullable(),
  })
  .strict();

export const patchDiagnosisSchema = createDiagnosisSchema.partial().refine(
  (value) => Object.keys(value).length > 0,
  "Nothing to update"
);

export const createPolicySchema = z
  .object({
    category: z.enum(["TERMS", "WARRANTY", "DATA"]),
    version: z.string().trim().regex(/^[0-9]{4}-[0-9]{2}-[0-9]{2}\.[0-9]+$/),
    title: text,
    body: z.string().trim().min(1).max(20000),
    active: z.boolean(),
  })
  .strict();

export const patchPolicySchema = createPolicySchema.partial().refine(
  (value) => Object.keys(value).length > 0,
  "Nothing to update"
);

export const intakePatchSchema = z
  .object({
    status: z.enum(["CHECKED_IN", "IN_REPAIR", "READY", "COLLECTED", "CANCELLED"]).optional(),
    customer: z
      .object({
        name: text,
        phone: text,
        email: z.string().trim().email().max(200).nullable(),
        suburb: z.string().trim().max(120).nullable().optional(),
        notes: z.string().trim().max(1000).nullable().optional(),
      })
      .strict()
      .optional(),
    deviceType: text.optional(),
    brand: text.optional(),
    model: text.optional(),
    repairTypes: z.array(text).min(1).max(10).optional(),
    accessories: z.string().trim().max(1000).nullable().optional(),
    conditionNotes: z.string().trim().max(2000).nullable().optional(),
    partQuality: z.string().trim().max(80).nullable().optional(),
    warrantyDays: z.number().int().min(0).max(3650).nullable().optional(),
    quotedPrice: money.optional(),
    depositPaid: money.optional(),
    diagnosisRuleId: z.string().trim().min(1).nullable().optional(),
    diagnosisCode: z.string().trim().max(120).nullable().optional(),
    diagnosisLabel: z.string().trim().max(200).nullable().optional(),
    diagnosisOutcome: z.string().trim().max(80).nullable().optional(),
  })
  .strict()
  .refine((value) => Object.keys(value).length > 0, "Nothing to update");

export const repairFormPatchSchema = z
  .object({
    status: z.enum(["QUOTED", "EMAILED", "ACCEPTED", "DECLINED"]).optional(),
    customerName: text.optional(),
    customerEmail: z.string().trim().email().max(200).optional(),
    customerPhone: z.string().trim().max(80).nullable().optional(),
    deviceType: text.optional(),
    brand: text.optional(),
    model: text.optional(),
    conditionNotes: z.string().trim().max(2000).nullable().optional(),
    preCondition: z.string().trim().max(10000).nullable().optional(),
  })
  .strict()
  .refine((value) => Object.keys(value).length > 0, "Nothing to update");

export const priceAccessQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(25),
});

export const idParamSchema = z.object({ id: z.string().trim().min(1) });

export const deleteQuerySchema = z.object({
  hard: z.enum(["true", "false"]).default("false"),
});
