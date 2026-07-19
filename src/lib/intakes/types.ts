import type {
  AgreementPolicyCategory,
  IntakeAgreementPolicy,
  IntakeAgreementSnapshot,
} from "@/lib/intake-agreement";
import type { IntakeInput } from "@/lib/validation";

export type IntakePricingSource = "MATCHED" | "MANUAL";

export type IntakeSubmissionInput = IntakeInput & {
  readonly partId?: string;
  readonly diagnosisRuleId?: string;
  readonly acceptedPolicyIds: readonly string[];
  readonly preConditionAccuracyAccepted: boolean;
};

export type IntakeSubmissionPart = {
  readonly id: string;
  readonly deviceType: string;
  readonly brand: string;
  readonly model: string;
  readonly repairType: string;
  readonly quality: string;
  readonly sellPrice: number;
  readonly warrantyDays: number;
  readonly active: boolean;
};

export type IntakeSubmissionDiagnosisRule = {
  readonly id: string;
  readonly deviceType: string;
  readonly brand: string | null;
  readonly model: string | null;
  readonly symptomCode: string;
  readonly symptomLabel: string;
  readonly repairType: string;
  readonly outcome: string;
  readonly active: boolean;
};

export type PolicyAcknowledgement = {
  readonly policyId: string;
  readonly category: AgreementPolicyCategory;
  readonly version: string;
  readonly acceptedAt: string;
};

export type PersistedIntakeDraft = {
  readonly customerId: string;
  readonly staffId: string;
  readonly deviceType: string;
  readonly brand: string;
  readonly model: string;
  readonly imei: string | null;
  readonly serialNo: string | null;
  readonly repairTypes: readonly string[];
  readonly preCondition: IntakeInput["preCondition"];
  readonly accessories: string | null;
  readonly conditionNotes: string | null;
  readonly partQuality: string | null;
  readonly warrantyDays: number | null;
  readonly quotedPrice: number | null;
  readonly depositPaid: boolean;
  readonly customerSignature: string | null;
  readonly matchedPartId: string | null;
  readonly diagnosisRuleId: string | null;
  readonly diagnosisCode: string | null;
  readonly diagnosisLabel: string | null;
  readonly diagnosisOutcome: string | null;
  readonly pricingSource: IntakePricingSource;
  readonly agreementSnapshot: IntakeAgreementSnapshot;
  readonly policyAcknowledgements: readonly PolicyAcknowledgement[];
  readonly agreementAcceptedAt: string;
  readonly preConditionAccuracyAccepted: true;
};

export type PersistedIntakeSubmission = PersistedIntakeDraft & {
  readonly id: string;
};

export type IntakeSubmissionCustomerDraft = {
  readonly name: string;
  readonly phone: string;
  readonly email: string | null;
  readonly suburb: string | null;
};

export type IntakeSubmissionCustomer = IntakeSubmissionCustomerDraft & {
  readonly id: string;
};

export interface IntakeSubmissionTransaction {
  readonly findCustomerByPhone: (phone: string) => Promise<IntakeSubmissionCustomer | null>;
  readonly createCustomer: (customer: IntakeSubmissionCustomerDraft) => Promise<IntakeSubmissionCustomer>;
  readonly findActivePartById: (partId: string) => Promise<IntakeSubmissionPart | null>;
  readonly findActiveDiagnosisRuleById: (ruleId: string) => Promise<IntakeSubmissionDiagnosisRule | null>;
  readonly listActivePolicies: () => Promise<readonly IntakeAgreementPolicy[]>;
  readonly createIntake: (draft: PersistedIntakeDraft) => Promise<PersistedIntakeSubmission>;
}

export interface IntakeSubmissionRepository {
  readonly withTransaction: <T>(work: (transaction: IntakeSubmissionTransaction) => Promise<T>) => Promise<T>;
}
