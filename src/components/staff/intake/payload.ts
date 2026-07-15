import type { IntakeInput, PreCondition } from "../../../lib/validation";
import type { IntakePrefill } from "./prefill";

export type IntakeFormState = {
  readonly phone: string;
  readonly name: string;
  readonly email: string;
  readonly suburb: string;
  readonly deviceType: IntakeInput["deviceType"];
  readonly brand: string;
  readonly model: string;
  readonly imei: string;
  readonly serialNo: string;
  readonly repairs: readonly string[];
  readonly preCondition: PreCondition;
  readonly batteryHealth: string;
  readonly accessories: string;
  readonly conditionNotes: string;
  readonly partQuality: IntakeInput["partQuality"] | "";
  readonly warrantyDays: string;
  readonly quotedPrice: string;
  readonly depositPaid: string;
  readonly signature: string;
  readonly acceptedPolicyIds?: readonly string[];
  readonly preConditionAccuracyAccepted?: boolean;
} & IntakePrefill;

export type StaffIntakePayload = IntakeInput & {
  readonly partId?: string;
  readonly diagnosisRuleId?: string;
  readonly acceptedPolicyIds?: readonly string[];
  readonly preConditionAccuracyAccepted?: boolean;
};

export function buildIntakePayload(state: IntakeFormState): StaffIntakePayload {
  const preCondition: PreCondition = {
    ...state.preCondition,
    batteryHealthPct:
      state.batteryHealth.trim() === ""
        ? null
        : Math.round(Number(state.batteryHealth)),
  };

  return {
    customer: {
      name: state.name.trim(),
      phone: state.phone.trim(),
      ...(state.email.trim() ? { email: state.email.trim() } : {}),
      ...(state.suburb.trim() ? { suburb: state.suburb.trim() } : {}),
    },
    deviceType: state.deviceType,
    brand: state.brand.trim(),
    model: state.model.trim(),
    ...(state.imei.trim() ? { imei: state.imei.trim() } : {}),
    ...(state.serialNo.trim() ? { serialNo: state.serialNo.trim() } : {}),
    repairTypes: [...state.repairs],
    preCondition,
    ...(state.accessories.trim()
      ? { accessories: state.accessories.trim() }
      : {}),
    ...(state.conditionNotes.trim()
      ? { conditionNotes: state.conditionNotes.trim() }
      : {}),
    ...(state.partQuality ? { partQuality: state.partQuality } : {}),
    ...(state.warrantyDays.trim() !== ""
      ? { warrantyDays: Math.round(Number(state.warrantyDays)) }
      : {}),
    ...(state.quotedPrice.trim() !== ""
      ? { quotedPrice: Number(state.quotedPrice) }
      : {}),
    ...(state.depositPaid.trim() !== ""
      ? { depositPaid: Number(state.depositPaid) }
      : {}),
    customerSignature: state.signature.trim(),
    ...(state.partId ? { partId: state.partId } : {}),
    ...(state.diagnosisRuleId
      ? { diagnosisRuleId: state.diagnosisRuleId }
      : {}),
    ...(state.acceptedPolicyIds
      ? { acceptedPolicyIds: [...state.acceptedPolicyIds] }
      : {}),
    ...(state.preConditionAccuracyAccepted !== undefined
      ? { preConditionAccuracyAccepted: state.preConditionAccuracyAccepted }
      : {}),
  };
}
