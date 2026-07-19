"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import { QUALITY_DEFAULT_WARRANTY } from "../../lib/config";
import { apiJson } from "../../lib/api-client";
import type { IntakeInput, PreCondition } from "../../lib/validation";
import {
  defaultPreCondition,
  type PreConditionBooleanKey,
} from "./precondition";
import type { CustomerMatch } from "./types";
import { AcknowledgementSection } from "./intake/AcknowledgementSection";
import { CustomerSection } from "./intake/CustomerSection";
import { DeviceSection } from "./intake/DeviceSection";
import { FormActions } from "./intake/FormActions";
import { JobSection } from "./intake/JobSection";
import { NotesSection } from "./intake/NotesSection";
import { PrefillNotice } from "./intake/PrefillNotice";
import type { IntakePrefill } from "./intake/prefill";
import { PreConditionSection } from "./intake/PreConditionSection";
import { RepairsSection } from "./intake/RepairsSection";
import { apiErrorMessage, isIntakeCreatedEnvelope } from "./intake/responses";
import { useCustomerLookup } from "./intake/useCustomerLookup";
import { useIntakeAcknowledgements } from "./intake/useIntakeAcknowledgements";
import { buildIntakePayload } from "./intake/payload";

type IntakeFormProps = {
  readonly prefill?: IntakePrefill;
  /**
   * What to do once the intake is filed. Defaults to opening the new record
   * in the portal — which only admins can reach, so the bay (where staff run
   * intake) supplies its own handler instead.
   */
  readonly onCreated?: (intakeId: string) => void;
  readonly onCancel?: () => void;
};

export default function IntakeForm(props: IntakeFormProps) {
  const router = useRouter();
  const prefill = props.prefill ?? {};
  const handleCreated =
    props.onCreated ?? ((id: string) => router.push(`/staff/intake/${id}`));
  const handleCancel =
    props.onCancel ?? (() => router.push("/staff/intake"));
  const [phone, setPhone] = useState("");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [suburb, setSuburb] = useState("");
  const [deviceType, setDeviceType] = useState<IntakeInput["deviceType"]>(
    (prefill.seedDeviceType as IntakeInput["deviceType"]) ?? "Phone"
  );
  const [brand, setBrand] = useState(prefill.seedBrand ?? "");
  const [model, setModel] = useState(prefill.seedModel ?? "");
  const [imei, setImei] = useState("");
  const [serialNo, setSerialNo] = useState("");
  const [repairs, setRepairs] = useState<string[]>(
    prefill.seedRepairType ? [prefill.seedRepairType] : []
  );
  const [customRepair, setCustomRepair] = useState("");
  const [preCondition, setPreCondition] =
    useState<PreCondition>(() => defaultPreCondition());
  const [batteryHealth, setBatteryHealth] = useState("");
  const [accessories, setAccessories] = useState("");
  const [conditionNotes, setConditionNotes] = useState("");
  const [partQuality, setPartQuality] = useState<
    IntakeInput["partQuality"] | ""
  >((prefill.seedPartQuality as IntakeInput["partQuality"]) ?? "");
  const [warrantyDays, setWarrantyDays] = useState("");
  const [quotedPrice, setQuotedPrice] = useState(prefill.seedQuotedPrice ?? "");
  const [depositPaid, setDepositPaid] = useState(false);
  const [signature, setSignature] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const customerLookup = useCustomerLookup(phone);
  const acknowledgements = useIntakeAcknowledgements({
    repairs,
    signature,
  });

  useEffect(() => {
    if (partQuality && QUALITY_DEFAULT_WARRANTY[partQuality] !== undefined) {
      setWarrantyDays(String(QUALITY_DEFAULT_WARRANTY[partQuality]));
    }
  }, [partQuality]);

  function applyMatch(match: CustomerMatch) {
    setPhone(match.phone);
    setName(match.name);
    setEmail(match.email ?? "");
    setSuburb(match.suburb ?? "");
    customerLookup.clearMatches();
    customerLookup.cancelLookup();
  }

  function toggleRepair(repair: string) {
    setRepairs((currentRepairs) =>
      currentRepairs.includes(repair)
        ? currentRepairs.filter((currentRepair) => currentRepair !== repair)
        : [...currentRepairs, repair]
    );
  }

  function addCustomRepair() {
    const value = customRepair.trim();
    if (!value) return;
    if (!repairs.includes(value)) {
      setRepairs((currentRepairs) => [...currentRepairs, value]);
    }
    setCustomRepair("");
  }

  function setBooleanPreCondition(
    key: PreConditionBooleanKey,
    value: boolean
  ) {
    setPreCondition((currentPreCondition) => ({
      ...currentPreCondition,
      [key]: value,
    }));
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    const readiness = acknowledgements.readiness;
    if (readiness.kind === "blocked") {
      setError(readiness.message);
      return;
    }
    setBusy(true);
    try {
      const payload = buildIntakePayload({
        phone,
        name,
        email,
        suburb,
        deviceType,
        brand,
        model,
        imei,
        serialNo,
        repairs,
        preCondition,
        batteryHealth,
        accessories,
        conditionNotes,
        partQuality,
        warrantyDays,
        quotedPrice,
        depositPaid,
        signature,
        ...prefill,
        acceptedPolicyIds: readiness.acceptedPolicyIds,
        preConditionAccuracyAccepted:
          acknowledgements.state.preConditionAccuracyAccepted,
      });
      const response = await fetch(
        "/api/staff/intakes",
        apiJson("POST", payload)
      );
      const json: unknown = await response.json();
      if (
        !response.ok ||
        !isIntakeCreatedEnvelope(json) ||
        !json.ok ||
        !json.data
      ) {
        setError(apiErrorMessage(json, "Could not save the intake"));
        setBusy(false);
        return;
      }
      handleCreated(json.data.id);
    } catch (caught) {
      if (!(caught instanceof Error)) throw caught;
      setError("Network error — try again");
      setBusy(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <p
          role="alert"
          className="border border-rose-500/50 bg-rose-50 px-3 py-2 text-sm text-rose-700"
        >
          {error}
        </p>
      )}
      <PrefillNotice prefill={prefill} />
      <CustomerSection
        phone={phone}
        name={name}
        email={email}
        suburb={suburb}
        matches={customerLookup.matches}
        matchesOpen={customerLookup.matchesOpen}
        onPhoneChange={setPhone}
        onNameChange={setName}
        onEmailChange={setEmail}
        onSuburbChange={setSuburb}
        onApplyMatch={applyMatch}
      />
      <DeviceSection
        deviceType={deviceType}
        brand={brand}
        model={model}
        imei={imei}
        serialNo={serialNo}
        onDeviceTypeChange={setDeviceType}
        onBrandChange={setBrand}
        onModelChange={setModel}
        onImeiChange={setImei}
        onSerialNoChange={setSerialNo}
      />
      <RepairsSection
        repairs={repairs}
        customRepair={customRepair}
        onCustomRepairChange={setCustomRepair}
        onToggleRepair={toggleRepair}
        onAddCustomRepair={addCustomRepair}
      />
      <PreConditionSection
        preCondition={preCondition}
        batteryHealth={batteryHealth}
        onBooleanChange={setBooleanPreCondition}
        onCosmeticGradeChange={(value) =>
          setPreCondition((currentPreCondition) => ({
            ...currentPreCondition,
            cosmeticGrade: value,
          }))
        }
        onBatteryHealthChange={setBatteryHealth}
      />
      <NotesSection
        accessories={accessories}
        conditionNotes={conditionNotes}
        onAccessoriesChange={setAccessories}
        onConditionNotesChange={setConditionNotes}
      />
      <JobSection
        partQuality={partQuality}
        warrantyDays={warrantyDays}
        quotedPrice={quotedPrice}
        depositPaid={depositPaid}
        onPartQualityChange={setPartQuality}
        onWarrantyDaysChange={setWarrantyDays}
        onQuotedPriceChange={setQuotedPrice}
        onDepositPaidChange={setDepositPaid}
      />
      <AcknowledgementSection
        signature={signature}
        policyState={acknowledgements.policyState}
        acknowledgementState={acknowledgements.state}
        onTogglePolicy={acknowledgements.toggleAcceptedPolicy}
        onPreConditionAccuracyAcceptedChange={
          acknowledgements.setPreConditionAccuracyAccepted
        }
        onSignatureChange={setSignature}
      />
      <FormActions
        busy={busy}
        disabled={acknowledgements.readiness.kind === "blocked"}
        onCancel={handleCancel}
      />
    </form>
  );
}
