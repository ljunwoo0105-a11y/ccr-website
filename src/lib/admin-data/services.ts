import type {
  DiagnosisInput,
  DiagnosisPatch,
  DiagnosisRecord,
  DiagnosisRepository,
  IntakePatch,
  IntakeRecord,
  PolicyInput,
  PolicyPatch,
  PolicyRecord,
  PolicyRepository,
  PriceAccessLogRecord,
  PriceAccessProjection,
  PriceAccessRepository,
  RecordRepository,
  RepairFormPatch,
  RepairFormRecord,
  ServiceResult,
} from "./types";

function duplicateDiagnosisInput(current: DiagnosisRecord, patch: DiagnosisPatch): DiagnosisInput {
  return {
    deviceType: patch.deviceType ?? current.deviceType,
    brand: patch.brand ?? current.brand,
    model: patch.model ?? current.model,
    symptomCode: patch.symptomCode ?? current.symptomCode,
    symptomLabel: patch.symptomLabel ?? current.symptomLabel,
    repairType: patch.repairType ?? current.repairType,
    outcome: patch.outcome ?? current.outcome,
    priority: patch.priority ?? current.priority,
    active: patch.active ?? current.active,
    notes: patch.notes ?? current.notes,
  };
}

export async function createDiagnosis(
  repo: DiagnosisRepository,
  input: DiagnosisInput
): Promise<ServiceResult<DiagnosisRecord>> {
  const duplicate = await repo.findDuplicate(input);
  if (duplicate) return { kind: "invalid", message: "Duplicate diagnosis rule" };
  return { kind: "created", record: await repo.create(input) };
}

export async function updateDiagnosis(
  repo: DiagnosisRepository,
  id: string,
  patch: DiagnosisPatch
): Promise<ServiceResult<DiagnosisRecord>> {
  const current = await repo.findById(id);
  if (!current) return { kind: "not_found", message: "Diagnosis rule not found" };
  const duplicate = await repo.findDuplicate(duplicateDiagnosisInput(current, patch), id);
  if (duplicate) return { kind: "invalid", message: "Duplicate diagnosis rule" };
  const record = await repo.update(id, patch);
  if (!record) return { kind: "not_found", message: "Diagnosis rule not found" };
  return { kind: "ok", record };
}

export async function deleteDiagnosis(
  repo: DiagnosisRepository,
  id: string,
  hard: boolean
): Promise<ServiceResult<DiagnosisRecord>> {
  const current = await repo.findById(id);
  if (!current) return { kind: "not_found", message: "Diagnosis rule not found" };
  if (!hard) {
    const record = await repo.update(id, { active: false });
    if (!record) return { kind: "not_found", message: "Diagnosis rule not found" };
    return { kind: "ok", record };
  }
  if (current.active) return { kind: "conflict", message: "Deactivate diagnosis rule before hard delete" };
  const references = await repo.countIntakes(id);
  if (references > 0) {
    return { kind: "conflict", message: "Diagnosis rule is still referenced by repair intakes" };
  }
  return (await repo.delete(id))
    ? { kind: "deleted" }
    : { kind: "not_found", message: "Diagnosis rule not found" };
}

export async function createPolicy(
  repo: PolicyRepository,
  input: PolicyInput
): Promise<ServiceResult<PolicyRecord>> {
  const duplicate = await repo.findDuplicate(input.category, input.version);
  if (duplicate) return { kind: "invalid", message: "Duplicate policy version" };
  if (!input.active) return { kind: "created", record: await repo.create(input) };
  const record = await repo.transaction(async (tx) => {
    await tx.lockCategory(input.category);
    await tx.deactivateCategory(input.category, "");
    return tx.create(input);
  });
  return { kind: "created", record };
}

export async function updatePolicy(
  repo: PolicyRepository,
  id: string,
  patch: PolicyPatch
): Promise<ServiceResult<PolicyRecord>> {
  const current = await repo.findById(id);
  if (!current) return { kind: "not_found", message: "Policy not found" };
  const category = patch.category ?? current.category;
  const version = patch.version ?? current.version;
  const duplicate = await repo.findDuplicate(category, version, id);
  if (duplicate) return { kind: "invalid", message: "Duplicate policy version" };
  const activatesTargetCategory =
    patch.active === true ||
    (current.active && patch.active !== false && patch.category !== undefined && patch.category !== current.category);
  if (activatesTargetCategory) {
    const record = await repo.transaction(async (tx) => {
      await tx.lockCategory(category);
      await tx.deactivateCategory(category, id);
      return tx.update(id, { ...patch, active: true });
    });
    if (!record) return { kind: "not_found", message: "Policy not found" };
    return { kind: "ok", record };
  }
  const record = await repo.update(id, patch);
  if (!record) return { kind: "not_found", message: "Policy not found" };
  return { kind: "ok", record };
}

export async function deletePolicy(
  repo: PolicyRepository,
  id: string,
  hard: boolean
): Promise<ServiceResult<PolicyRecord>> {
  const current = await repo.findById(id);
  if (!current) return { kind: "not_found", message: "Policy not found" };
  if (!hard) {
    const record = await repo.update(id, { active: false });
    if (!record) return { kind: "not_found", message: "Policy not found" };
    return { kind: "ok", record };
  }
  if (current.active) return { kind: "conflict", message: "Deactivate policy before hard delete" };
  if ((await repo.countReferences(current.id)) > 0) {
    return { kind: "conflict", message: "Policy is still referenced by repair intakes" };
  }
  return (await repo.delete(id))
    ? { kind: "deleted" }
    : { kind: "not_found", message: "Policy not found" };
}

export async function updateIntakeRecord(
  repo: RecordRepository,
  id: string,
  patch: IntakePatch
): Promise<ServiceResult<IntakeRecord>> {
  const record = await repo.updateIntake(id, patch);
  if (!record) return { kind: "not_found", message: "Intake not found" };
  return { kind: "ok", record };
}

export async function deleteIntakeRecord(
  repo: RecordRepository,
  id: string
): Promise<ServiceResult<IntakeRecord>> {
  return (await repo.deleteIntake(id))
    ? { kind: "deleted" }
    : { kind: "not_found", message: "Intake not found" };
}

export async function updateRepairFormRecord(
  repo: RecordRepository,
  id: string,
  patch: RepairFormPatch
): Promise<ServiceResult<RepairFormRecord>> {
  const record = await repo.updateRepairForm(id, patch);
  if (!record) return { kind: "not_found", message: "Repair form not found" };
  return { kind: "ok", record };
}

export async function deleteRepairFormRecord(
  repo: RecordRepository,
  id: string
): Promise<ServiceResult<RepairFormRecord>> {
  return (await repo.deleteRepairForm(id))
    ? { kind: "deleted" }
    : { kind: "not_found", message: "Repair form not found" };
}

export function projectPriceAccessLog(log: PriceAccessLogRecord): PriceAccessProjection {
  return {
    id: log.id,
    user: { id: log.userId, name: log.userName, email: log.userEmail },
    context: {
      deviceType: log.deviceType,
      brand: log.brand,
      model: log.model,
      symptomCode: log.symptomCode,
      outcome: log.outcome,
      matchedPartCount: log.matchedPartCount,
    },
    hash: { ipHashPrefix: log.ipHash.slice(0, 12), userAgent: log.userAgent },
    createdAt: log.createdAt.toISOString(),
  };
}

export async function listPriceAccessLogs(
  repo: PriceAccessRepository,
  page: number,
  pageSize: number
) {
  const result = await repo.list(page, pageSize);
  return {
    page,
    pageSize,
    total: result.total,
    rows: result.rows.map(projectPriceAccessLog),
  };
}
