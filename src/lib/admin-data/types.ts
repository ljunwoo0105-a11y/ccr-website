import type { z } from "zod";
import type {
  createDiagnosisSchema,
  createPolicySchema,
  intakePatchSchema,
  repairFormPatchSchema,
} from "./validation";

export type DiagnosisInput = z.infer<typeof createDiagnosisSchema>;
export type DiagnosisPatch = Partial<DiagnosisInput>;
export type PolicyInput = z.infer<typeof createPolicySchema>;
export type PolicyPatch = Partial<PolicyInput>;
export type IntakePatch = z.infer<typeof intakePatchSchema>;
export type RepairFormPatch = z.infer<typeof repairFormPatchSchema>;

export type DiagnosisRecord = DiagnosisInput & {
  readonly id: string;
  readonly createdAt: Date;
  readonly updatedAt: Date;
};

export type PolicyRecord = PolicyInput & {
  readonly id: string;
  readonly createdAt: Date;
  readonly updatedAt: Date;
};

export type IntakeRecord = {
  readonly id: string;
  readonly status: string;
  readonly customerId: string;
  readonly customerName: string;
  readonly customerPhone: string;
  readonly customerEmail: string | null;
  readonly deviceType: string;
  readonly brand: string;
  readonly model: string;
  readonly repairTypes: string;
  readonly agreementSnapshot: unknown;
  readonly policyAcknowledgements: unknown;
  readonly agreementAcceptedAt: Date | null;
  readonly preConditionAccuracyAccepted: boolean;
};

export type RepairFormRecord = {
  readonly id: string;
  readonly status: string;
  readonly customerName: string;
  readonly customerEmail: string;
  readonly customerPhone: string | null;
  readonly deviceType: string;
  readonly brand: string;
  readonly model: string;
};

export type PriceAccessLogRecord = {
  readonly id: string;
  readonly userId: string;
  readonly userName: string;
  readonly userEmail: string;
  readonly deviceType: string | null;
  readonly brand: string | null;
  readonly model: string | null;
  readonly symptomCode: string | null;
  readonly outcome: string;
  readonly matchedPartCount: number;
  readonly ipHash: string;
  readonly userAgent: string | null;
  readonly createdAt: Date;
};

export type PriceAccessProjection = {
  readonly id: string;
  readonly user: { readonly id: string; readonly name: string; readonly email: string };
  readonly context: {
    readonly deviceType: string | null;
    readonly brand: string | null;
    readonly model: string | null;
    readonly symptomCode: string | null;
    readonly outcome: string;
    readonly matchedPartCount: number;
  };
  readonly hash: { readonly ipHashPrefix: string; readonly userAgent: string | null };
  readonly createdAt: string;
};

export interface DiagnosisRepository {
  create(input: DiagnosisInput): Promise<DiagnosisRecord>;
  update(id: string, input: DiagnosisPatch): Promise<DiagnosisRecord | null>;
  delete(id: string): Promise<boolean>;
  findById(id: string): Promise<DiagnosisRecord | null>;
  findDuplicate(input: DiagnosisInput, excludeId?: string): Promise<DiagnosisRecord | null>;
  countIntakes(id: string): Promise<number>;
}

export interface PolicyTransaction {
  lockCategory(category: string): Promise<void>;
  create(input: PolicyInput): Promise<PolicyRecord>;
  update(id: string, input: PolicyPatch): Promise<PolicyRecord | null>;
  deactivateCategory(category: string, exceptId: string): Promise<void>;
}

export interface PolicyRepository extends PolicyTransaction {
  transaction<T>(work: (tx: PolicyTransaction) => Promise<T>): Promise<T>;
  delete(id: string): Promise<boolean>;
  findById(id: string): Promise<PolicyRecord | null>;
  findDuplicate(category: string, version: string, excludeId?: string): Promise<PolicyRecord | null>;
  countReferences(id: string): Promise<number>;
}

export interface RecordRepository {
  updateIntake(id: string, input: IntakePatch): Promise<IntakeRecord | null>;
  deleteIntake(id: string): Promise<boolean>;
  updateRepairForm(id: string, input: RepairFormPatch): Promise<RepairFormRecord | null>;
  deleteRepairForm(id: string): Promise<boolean>;
}

export interface PriceAccessRepository {
  list(page: number, pageSize: number): Promise<{
    readonly total: number;
    readonly rows: readonly PriceAccessLogRecord[];
  }>;
}

export type ServiceResult<T> =
  | { readonly kind: "ok"; readonly record: T }
  | { readonly kind: "created"; readonly record: T }
  | { readonly kind: "deleted" }
  | { readonly kind: "not_found"; readonly message: string }
  | { readonly kind: "invalid"; readonly message: string }
  | { readonly kind: "conflict"; readonly message: string };
