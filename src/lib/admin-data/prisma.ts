import "server-only";
import { Prisma } from "@prisma/client";
import { db } from "@/lib/db";
import type {
  DiagnosisInput,
  DiagnosisRepository,
  IntakePatch,
  PolicyRepository,
  PriceAccessLogRecord,
  PriceAccessRepository,
  RecordRepository,
  RepairFormPatch,
} from "./types";
import {
  diagnosisRecord,
  falseOnMissing,
  matchedPartCount,
  nullOnMissing,
  policyRecord,
  referenceCount,
} from "./prisma-helpers";

const DIAGNOSIS_ORDER: Prisma.DiagnosisRuleOrderByWithRelationInput[] = [
  { active: "desc" },
  { priority: "desc" },
  { updatedAt: "desc" },
];
const POLICY_ORDER: Prisma.PolicyDocumentOrderByWithRelationInput[] = [
  { category: "asc" },
  { active: "desc" },
  { updatedAt: "desc" },
];

function diagnosisWhere(input: DiagnosisInput, excludeId?: string): Prisma.DiagnosisRuleWhereInput {
  return {
    deviceType: input.deviceType,
    brand: input.brand,
    model: input.model,
    symptomCode: input.symptomCode,
    repairType: input.repairType,
    id: excludeId ? { not: excludeId } : undefined,
  };
}

function intakeData(input: IntakePatch): Prisma.RepairIntakeUpdateInput {
  const data: Prisma.RepairIntakeUpdateInput = {};
  if (input.status !== undefined) {
    data.status = input.status;
    data.completedAt = input.status === "COLLECTED" ? new Date() : undefined;
  }
  if (input.customer !== undefined) data.customer = { update: input.customer };
  if (input.deviceType !== undefined) data.deviceType = input.deviceType;
  if (input.brand !== undefined) data.brand = input.brand;
  if (input.model !== undefined) data.model = input.model;
  if (input.repairTypes !== undefined) data.repairTypes = JSON.stringify(input.repairTypes);
  if (input.accessories !== undefined) data.accessories = input.accessories;
  if (input.conditionNotes !== undefined) data.conditionNotes = input.conditionNotes;
  if (input.partQuality !== undefined) data.partQuality = input.partQuality;
  if (input.warrantyDays !== undefined) data.warrantyDays = input.warrantyDays;
  if (input.quotedPrice !== undefined) data.quotedPrice = input.quotedPrice;
  if (input.depositPaid !== undefined) data.depositPaid = input.depositPaid;
  if (input.diagnosisRuleId !== undefined) {
    data.diagnosisRule =
      input.diagnosisRuleId === null
        ? { disconnect: true }
        : { connect: { id: input.diagnosisRuleId } };
  }
  if (input.diagnosisCode !== undefined) data.diagnosisCode = input.diagnosisCode;
  if (input.diagnosisLabel !== undefined) data.diagnosisLabel = input.diagnosisLabel;
  if (input.diagnosisOutcome !== undefined) data.diagnosisOutcome = input.diagnosisOutcome;
  return data;
}

function repairFormData(input: RepairFormPatch): Prisma.RepairFormUpdateInput {
  const data: Prisma.RepairFormUpdateInput = {};
  if (input.status !== undefined) data.status = input.status;
  if (input.customerName !== undefined) data.customerName = input.customerName;
  if (input.customerEmail !== undefined) data.customerEmail = input.customerEmail;
  if (input.customerPhone !== undefined) data.customerPhone = input.customerPhone;
  if (input.deviceType !== undefined) data.deviceType = input.deviceType;
  if (input.brand !== undefined) data.brand = input.brand;
  if (input.model !== undefined) data.model = input.model;
  if (input.conditionNotes !== undefined) data.conditionNotes = input.conditionNotes;
  if (input.preCondition !== undefined) data.preCondition = input.preCondition;
  return data;
}

export const prismaDiagnosisRepository: DiagnosisRepository = {
  async create(input) {
    return diagnosisRecord(await db.diagnosisRule.create({ data: input }));
  },
  async update(id, input) {
    return nullOnMissing(async () =>
      diagnosisRecord(await db.diagnosisRule.update({ where: { id }, data: input }))
    );
  },
  delete(id) {
    return falseOnMissing(() => db.diagnosisRule.delete({ where: { id } }));
  },
  async findById(id) {
    const record = await db.diagnosisRule.findUnique({ where: { id } });
    return record ? diagnosisRecord(record) : null;
  },
  async findDuplicate(input, excludeId) {
    const record = await db.diagnosisRule.findFirst({ where: diagnosisWhere(input, excludeId) });
    return record ? diagnosisRecord(record) : null;
  },
  countIntakes(id) {
    return db.repairIntake.count({ where: { diagnosisRuleId: id } });
  },
};

export const prismaPolicyRepository: PolicyRepository = {
  transaction(work) {
    return db.$transaction((tx) =>
      work({
        async lockCategory(category) {
          await tx.$queryRaw`SELECT pg_advisory_xact_lock(1953719668, hashtext(${category}))`;
        },
        async create(input) {
          return policyRecord(await tx.policyDocument.create({ data: input }));
        },
        update(id, input) {
          return nullOnMissing(async () =>
            policyRecord(await tx.policyDocument.update({ where: { id }, data: input }))
          );
        },
        async deactivateCategory(category, exceptId) {
          await tx.policyDocument.updateMany({
            where: { category, id: { not: exceptId } },
            data: { active: false },
          });
        },
      })
    );
  },
  async create(input) {
    return policyRecord(await db.policyDocument.create({ data: input }));
  },
  update(id, input) {
    return nullOnMissing(async () =>
      policyRecord(await db.policyDocument.update({ where: { id }, data: input }))
    );
  },
  async lockCategory(category) {
    await db.$queryRaw`SELECT pg_advisory_xact_lock(1953719668, hashtext(${category}))`;
  },
  async deactivateCategory(category, exceptId) {
    await db.policyDocument.updateMany({ where: { category, id: { not: exceptId } }, data: { active: false } });
  },
  delete(id) {
    return falseOnMissing(() => db.policyDocument.delete({ where: { id } }));
  },
  async findById(id) {
    const record = await db.policyDocument.findUnique({ where: { id } });
    return record ? policyRecord(record) : null;
  },
  async findDuplicate(category, version, excludeId) {
    const record = await db.policyDocument.findFirst({
      where: { category, version, id: excludeId ? { not: excludeId } : undefined },
    });
    return record ? policyRecord(record) : null;
  },
  async countReferences(policyId) {
    const acknowledgementNeedle = JSON.stringify([{ policyId }]);
    const snapshotNeedle = JSON.stringify([{ id: policyId }]);
    const rows = await db.$queryRaw<unknown>`
      SELECT COUNT(*) AS "references"
      FROM "RepairIntake"
      WHERE "policyAcknowledgements" @> ${acknowledgementNeedle}::jsonb
         OR ("agreementSnapshot"->'policies') @> ${snapshotNeedle}::jsonb
    `;
    return referenceCount(rows);
  },
};

export const prismaRecordRepository: RecordRepository = {
  async updateIntake(id, input) {
    const record = await nullOnMissing(() =>
      db.repairIntake.update({
        where: { id },
        data: intakeData(input),
        include: { customer: true },
      })
    );
    if (!record) return null;
    return {
      id: record.id,
      status: record.status,
      customerId: record.customerId,
      customerName: record.customer.name,
      customerPhone: record.customer.phone,
      customerEmail: record.customer.email,
      deviceType: record.deviceType,
      brand: record.brand,
      model: record.model,
      repairTypes: record.repairTypes,
      agreementSnapshot: record.agreementSnapshot,
      policyAcknowledgements: record.policyAcknowledgements,
      agreementAcceptedAt: record.agreementAcceptedAt,
      preConditionAccuracyAccepted: record.preConditionAccuracyAccepted,
    };
  },
  deleteIntake(id) {
    return falseOnMissing(() => db.repairIntake.delete({ where: { id } }));
  },
  updateRepairForm(id, input) {
    return nullOnMissing(() => db.repairForm.update({ where: { id }, data: repairFormData(input) }));
  },
  deleteRepairForm(id) {
    return falseOnMissing(() => db.repairForm.delete({ where: { id } }));
  },
};

export const prismaPriceAccessRepository: PriceAccessRepository = {
  async list(page, pageSize) {
    const [total, rows] = await Promise.all([
      db.priceAccessLog.count(),
      db.priceAccessLog.findMany({
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * pageSize,
        take: pageSize,
        include: { user: { select: { id: true, name: true, email: true } } },
      }),
    ]);
    const logs: PriceAccessLogRecord[] = rows.map((row) => ({
      id: row.id,
      userId: row.user.id,
      userName: row.user.name,
      userEmail: row.user.email,
      deviceType: row.deviceType,
      brand: row.brand,
      model: row.model,
      symptomCode: row.symptomCode,
      outcome: row.outcome,
      matchedPartCount: matchedPartCount(row.matchedPartIds),
      ipHash: row.ipHash,
      userAgent: row.userAgent,
      createdAt: row.createdAt,
    }));
    return { total, rows: logs };
  },
};

export async function listDiagnoses() {
  const records = await db.diagnosisRule.findMany({ orderBy: DIAGNOSIS_ORDER });
  return records.map(diagnosisRecord);
}

export async function listPolicies() {
  const records = await db.policyDocument.findMany({ orderBy: POLICY_ORDER });
  return records.map(policyRecord);
}
