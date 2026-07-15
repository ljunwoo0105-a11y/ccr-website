"use client";

import { useState } from "react";
import { Modal } from "@/components/admin/modal";
import {
  INTAKE_STATUSES,
  REPAIR_FORM_STATUSES,
  compactText,
  intakeStatusPatch,
  repairFormStatusPatch,
  repairTypesLabel,
  splitRepairTypes,
  type IntakeListRow,
  type IntakePatch,
  type RepairFormListRow,
  type RepairFormPatch,
} from "@/components/admin/records-state";

export type EditTarget =
  | { readonly type: "intake"; readonly row: IntakeListRow }
  | { readonly type: "repair-form"; readonly row: RepairFormListRow };

type FormState = {
  readonly status: string;
  readonly customerName: string;
  readonly customerPhone: string;
  readonly customerEmail: string;
  readonly deviceType: string;
  readonly brand: string;
  readonly model: string;
  readonly repairTypes: string;
};

function initialForm(target: EditTarget): FormState {
  if (target.type === "intake") {
    return {
      status: target.row.status,
      customerName: target.row.customerName,
      customerPhone: target.row.customerPhone,
      customerEmail: target.row.customerEmail ?? "",
      deviceType: target.row.deviceType,
      brand: target.row.brand,
      model: target.row.model,
      repairTypes: repairTypesLabel(target.row.repairTypes).startsWith("Legacy")
        ? ""
        : repairTypesLabel(target.row.repairTypes),
    };
  }
  return {
    status: target.row.status,
    customerName: target.row.customerName,
    customerPhone: target.row.customerPhone ?? "",
    customerEmail: target.row.customerEmail,
    deviceType: target.row.deviceType,
    brand: target.row.brand,
    model: target.row.model,
    repairTypes: "",
  };
}

function requiredFields(form: FormState): string | null {
  if (!compactText(form.customerName)) return "Customer name is required.";
  if (!compactText(form.deviceType)) return "Device type is required.";
  if (!compactText(form.brand)) return "Brand is required.";
  if (!compactText(form.model)) return "Model is required.";
  return null;
}

function intakePatchFromForm(form: FormState): IntakePatch | string {
  const status = intakeStatusPatch(form.status);
  if (status.kind === "invalid") return status.message;
  const required = requiredFields(form);
  if (required) return required;
  if (!compactText(form.customerPhone)) return "Customer phone is required.";
  const repairTypes = splitRepairTypes(form.repairTypes);
  if (repairTypes.length === 0) return "Add at least one repair type.";
  return {
    ...status.patch,
    customer: {
      name: compactText(form.customerName),
      phone: compactText(form.customerPhone),
      email: compactText(form.customerEmail) || null,
    },
    deviceType: compactText(form.deviceType),
    brand: compactText(form.brand),
    model: compactText(form.model),
    repairTypes,
  };
}

function repairFormPatchFromForm(form: FormState): RepairFormPatch | string {
  const status = repairFormStatusPatch(form.status);
  if (status.kind === "invalid") return status.message;
  const required = requiredFields(form);
  if (required) return required;
  if (!compactText(form.customerEmail)) return "Customer email is required.";
  return {
    ...status.patch,
    customerName: compactText(form.customerName),
    customerEmail: compactText(form.customerEmail),
    customerPhone: compactText(form.customerPhone) || null,
    deviceType: compactText(form.deviceType),
    brand: compactText(form.brand),
    model: compactText(form.model),
  };
}

export function RecordsEditModal({
  target,
  busy,
  error,
  onCancel,
  onSubmit,
}: {
  readonly target: EditTarget;
  readonly busy: boolean;
  readonly error: string | null;
  readonly onCancel: () => void;
  readonly onSubmit: (patch: IntakePatch | RepairFormPatch) => void;
}) {
  const [form, setForm] = useState<FormState>(() => initialForm(target));
  const [localError, setLocalError] = useState<string | null>(null);
  const isIntake = target.type === "intake";
  const statuses = isIntake ? INTAKE_STATUSES : REPAIR_FORM_STATUSES;

  function submit() {
    const patch = isIntake ? intakePatchFromForm(form) : repairFormPatchFromForm(form);
    if (typeof patch === "string") {
      setLocalError(patch);
      return;
    }
    setLocalError(null);
    onSubmit(patch);
  }

  return (
    <Modal title={isIntake ? "Edit intake" : "Edit repair form"} onClose={onCancel}>
      <form
        className="space-y-4"
        onSubmit={(event) => {
          event.preventDefault();
          submit();
        }}
      >
        <div>
          <label className="label" htmlFor="record-status">
            Status
          </label>
          <select
            id="record-status"
            className="input"
            value={form.status}
            onChange={(event) => setForm({ ...form, status: event.target.value })}
          >
            {statuses.map((status) => (
              <option key={status} value={status}>
                {status}
              </option>
            ))}
          </select>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field id="record-name" label="Customer" value={form.customerName} onValue={(value) => setForm({ ...form, customerName: value })} />
          <Field id="record-phone" label="Phone" value={form.customerPhone} onValue={(value) => setForm({ ...form, customerPhone: value })} />
          <Field id="record-email" label="Email" value={form.customerEmail} onValue={(value) => setForm({ ...form, customerEmail: value })} />
          <Field id="record-device" label="Device type" value={form.deviceType} onValue={(value) => setForm({ ...form, deviceType: value })} />
          <Field id="record-brand" label="Brand" value={form.brand} onValue={(value) => setForm({ ...form, brand: value })} />
          <Field id="record-model" label="Model" value={form.model} onValue={(value) => setForm({ ...form, model: value })} />
        </div>
        {isIntake && (
          <Field
            id="record-repairs"
            label="Repair types"
            value={form.repairTypes}
            onValue={(value) => setForm({ ...form, repairTypes: value })}
          />
        )}
        {(localError || error) && (
          <p className="bg-rose-50 px-3 py-2 text-sm text-rose-700">
            {localError ?? error}
          </p>
        )}
        <div className="flex justify-end gap-3 pt-2">
          <button type="button" className="btn-ghost" onClick={onCancel}>
            Cancel
          </button>
          <button type="submit" className="btn-primary" disabled={busy}>
            {busy ? "Saving..." : "Save changes"}
          </button>
        </div>
      </form>
    </Modal>
  );
}

function Field({
  id,
  label,
  value,
  onValue,
}: {
  readonly id: string;
  readonly label: string;
  readonly value: string;
  readonly onValue: (value: string) => void;
}) {
  return (
    <div>
      <label className="label" htmlFor={id}>
        {label}
      </label>
      <input
        id={id}
        className="input"
        value={value}
        onChange={(event) => onValue(event.target.value)}
      />
    </div>
  );
}
