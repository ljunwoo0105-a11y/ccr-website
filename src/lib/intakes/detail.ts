import { z } from "zod";

const policyCategorySchema = z.enum(["TERMS", "WARRANTY", "DATA"]);

const agreementSnapshotSchema = z.object({
  acceptedAt: z.string(),
  policies: z.array(
    z.object({
      id: z.string(),
      category: policyCategorySchema,
      version: z.string(),
      title: z.string(),
      body: z.string(),
    })
  ),
  preConditionAccuracyAccepted: z.literal(true),
  warrantyDays: z.number().int().min(0).nullable(),
});

export type IntakeDetailAgreementProjection = {
  readonly acceptedAt: string | null;
  readonly warrantyDays: number | null;
  readonly preConditionAccuracyAccepted: boolean;
  readonly policies: readonly {
    readonly id: string;
    readonly category: "TERMS" | "WARRANTY" | "DATA";
    readonly version: string;
    readonly title: string;
    readonly body: string;
  }[];
};

export function buildIntakeDetailAgreementProjection(input: {
  readonly agreementSnapshot: unknown;
  readonly policyAcknowledgements: unknown;
  readonly agreementAcceptedAt: Date | string | null;
  readonly warrantyDays: number | null;
}): IntakeDetailAgreementProjection {
  const parsed = agreementSnapshotSchema.safeParse(input.agreementSnapshot);

  if (!parsed.success) {
    return {
      acceptedAt: input.agreementAcceptedAt
        ? new Date(input.agreementAcceptedAt).toISOString()
        : null,
      warrantyDays: input.warrantyDays,
      preConditionAccuracyAccepted: false,
      policies: [],
    };
  }

  return {
    acceptedAt: input.agreementAcceptedAt
      ? new Date(input.agreementAcceptedAt).toISOString()
      : parsed.data.acceptedAt,
    warrantyDays: input.warrantyDays ?? parsed.data.warrantyDays,
    preConditionAccuracyAccepted: parsed.data.preConditionAccuracyAccepted,
    policies: parsed.data.policies,
  };
}
