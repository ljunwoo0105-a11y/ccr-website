import type { Prisma } from "@prisma/client";
import { db } from "@/lib/db";
import { ok, fail, parseBody, guard } from "@/lib/api";
import {
  IntakeSubmissionValidationError,
  createIntakeSubmission,
  intakeSubmissionSchema,
  type IntakeSubmissionRepository,
  type IntakeSubmissionTransaction,
  type PersistedIntakeDraft,
  type PolicyAcknowledgement,
} from "@/lib/intakes/submission";
import type { AgreementPolicyCategory } from "@/lib/intake-agreement";

export const dynamic = "force-dynamic";

const INTAKE_STATUSES = [
  "CHECKED_IN",
  "IN_REPAIR",
  "READY",
  "COLLECTED",
  "CANCELLED",
];

/**
 * List repair intakes.
 *   status= one of the intake statuses (anything else → all)
 *   search= contains-match on customer name/phone and device brand/model
 */
export async function GET(req: Request) {
  const { error } = await guard();
  if (error) return error;

  const url = new URL(req.url);
  const status = url.searchParams.get("status")?.trim() ?? "";
  const search = url.searchParams.get("search")?.trim() ?? "";

  const where: Prisma.RepairIntakeWhereInput = {};
  if (INTAKE_STATUSES.includes(status)) where.status = status;
  if (search) {
    where.OR = [
      { brand: { contains: search } },
      { model: { contains: search } },
      { customer: { name: { contains: search } } },
      { customer: { phone: { contains: search } } },
    ];
  }

  const intakes = await db.repairIntake.findMany({
    where,
    include: { customer: true },
    orderBy: { createdAt: "desc" },
    take: 200,
  });

  return ok(intakes);
}

/**
 * Create a repair intake (pre-repair condition record). Reuses an existing
 * customer when the phone number matches exactly, otherwise creates one.
 */
export async function POST(req: Request) {
  const { user, error } = await guard();
  if (error) return error;

  const parsed = await parseBody(req, intakeSubmissionSchema);
  if (parsed.error) return parsed.error;
  try {
    const intake = await createIntakeSubmission({
      staffId: user.id,
      acceptedAt: new Date().toISOString(),
      input: parsed.data,
      repository: prismaIntakeSubmissionRepository,
    });

    return ok({ id: intake.id });
  } catch (caught) {
    if (caught instanceof IntakeSubmissionValidationError) {
      return fail(caught.message, 422);
    }
    throw caught;
  }
}

const prismaIntakeSubmissionRepository: IntakeSubmissionRepository = {
  withTransaction: (work) =>
    db.$transaction((transaction) =>
      work(prismaIntakeSubmissionTransaction(transaction))
    ),
};

function prismaIntakeSubmissionTransaction(
  transaction: Prisma.TransactionClient
): IntakeSubmissionTransaction {
  return {
    findCustomerByPhone: (phone) =>
      transaction.customer.findFirst({ where: { phone } }),
    createCustomer: (customer) => transaction.customer.create({ data: customer }),
    findActivePartById: (partId) =>
      transaction.part.findFirst({
        where: { id: partId, active: true },
        select: {
          id: true,
          deviceType: true,
          brand: true,
          model: true,
          repairType: true,
          quality: true,
          sellPrice: true,
          warrantyDays: true,
          active: true,
        },
      }),
    findActiveDiagnosisRuleById: (ruleId) =>
      transaction.diagnosisRule.findFirst({
        where: { id: ruleId, active: true },
        select: {
          id: true,
          deviceType: true,
          brand: true,
          model: true,
          symptomCode: true,
          symptomLabel: true,
          repairType: true,
          outcome: true,
          active: true,
        },
      }),
    listActivePolicies: () =>
      listActivePolicies(transaction),
    createIntake: async (draft) => {
      const intake = await transaction.repairIntake.create({
        data: {
          customerId: draft.customerId,
          staffId: draft.staffId,
          deviceType: draft.deviceType,
          brand: draft.brand,
          model: draft.model,
          imei: draft.imei,
          serialNo: draft.serialNo,
          repairTypes: JSON.stringify(draft.repairTypes),
          preCondition: JSON.stringify(draft.preCondition),
          accessories: draft.accessories,
          conditionNotes: draft.conditionNotes,
          partQuality: draft.partQuality,
          warrantyDays: draft.warrantyDays,
          quotedPrice: draft.quotedPrice,
          depositPaid: draft.depositPaid,
          customerSignature: draft.customerSignature,
          matchedPartId: draft.matchedPartId,
          diagnosisRuleId: draft.diagnosisRuleId,
          diagnosisCode: draft.diagnosisCode,
          diagnosisLabel: draft.diagnosisLabel,
          diagnosisOutcome: draft.diagnosisOutcome,
          pricingSource: draft.pricingSource,
          agreementSnapshot: agreementSnapshotJson(draft.agreementSnapshot),
          policyAcknowledgements: policyAcknowledgementsJson(
            draft.policyAcknowledgements
          ),
          agreementAcceptedAt: new Date(draft.agreementAcceptedAt),
          preConditionAccuracyAccepted: draft.preConditionAccuracyAccepted,
        },
      });

      return { id: intake.id, ...draft };
    },
  };
}

async function listActivePolicies(
  transaction: Prisma.TransactionClient
): Promise<
  readonly {
    readonly id: string;
    readonly category: AgreementPolicyCategory;
    readonly version: string;
    readonly title: string;
    readonly body: string;
    readonly active: boolean;
  }[]
> {
  const rows = await transaction.policyDocument.findMany({
    where: { active: true },
  });

  return rows.map((row) => ({
    id: row.id,
    category: policyCategory(row.category),
    version: row.version,
    title: row.title,
    body: row.body,
    active: row.active,
  }));
}

function policyCategory(category: string): AgreementPolicyCategory {
  if (
    category === "TERMS" ||
    category === "WARRANTY" ||
    category === "DATA"
  ) {
    return category;
  }
  throw new IntakeSubmissionValidationError(
    `Unsupported active policy category ${category}.`
  );
}

function agreementSnapshotJson(
  snapshot: PersistedIntakeDraft["agreementSnapshot"]
): Prisma.InputJsonObject {
  return {
    acceptedAt: snapshot.acceptedAt,
    preConditionAccuracyAccepted: snapshot.preConditionAccuracyAccepted,
    warrantyDays: snapshot.warrantyDays,
    policies: snapshot.policies.map((policy) => ({
      id: policy.id,
      category: policy.category,
      version: policy.version,
      title: policy.title,
      body: policy.body,
    })),
  };
}

function policyAcknowledgementsJson(
  acknowledgements: readonly PolicyAcknowledgement[]
): Prisma.InputJsonArray {
  return acknowledgements.map((acknowledgement) => ({
    policyId: acknowledgement.policyId,
    category: acknowledgement.category,
    version: acknowledgement.version,
    acceptedAt: acknowledgement.acceptedAt,
  }));
}
