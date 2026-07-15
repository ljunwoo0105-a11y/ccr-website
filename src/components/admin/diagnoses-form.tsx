"use client";

import { Save, X } from "lucide-react";
import { diagnosisOutcomeValues, type DiagnosisForm } from "./diagnoses-types";

type DiagnosisFormProps = {
  readonly form: DiagnosisForm;
  readonly error: string | null;
  readonly busy: boolean;
  readonly onChange: (form: DiagnosisForm) => void;
  readonly onSubmit: () => void;
  readonly onCancel: () => void;
};

export function DiagnosisRuleForm({
  form,
  error,
  busy,
  onChange,
  onSubmit,
  onCancel,
}: DiagnosisFormProps) {
  const title = form.id ? "Edit diagnosis rule" : "Create diagnosis rule";
  return (
    <section className="card">
      <div className="flex flex-col gap-2 border-b border-carbon-150 pb-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-base font-semibold text-carbon-950">{title}</h2>
          <p className="mt-1 text-sm text-carbon-500">
            Scope the rule by device, optional brand and model, then map the symptom to a repair outcome.
          </p>
        </div>
        <button type="button" className="btn-ghost self-start px-3 py-2" onClick={onCancel}>
          <X className="h-4 w-4" aria-hidden />
          Cancel
        </button>
      </div>

      {error && (
        <p className="mt-4 border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
          {error}
        </p>
      )}

      <form
        className="mt-5 grid gap-4 lg:grid-cols-3"
        onSubmit={(event) => {
          event.preventDefault();
          onSubmit();
        }}
      >
        <label className="text-sm font-medium text-carbon-700">
          Device type
          <input
            className="mt-1 w-full rounded-md border border-carbon-150 bg-white px-3 py-2 text-carbon-950"
            value={form.deviceType}
            onChange={(event) => onChange({ ...form, deviceType: event.target.value })}
          />
        </label>
        <label className="text-sm font-medium text-carbon-700">
          Brand
          <input
            className="mt-1 w-full rounded-md border border-carbon-150 bg-white px-3 py-2 text-carbon-950"
            value={form.brand}
            onChange={(event) => onChange({ ...form, brand: event.target.value })}
          />
        </label>
        <label className="text-sm font-medium text-carbon-700">
          Model
          <input
            className="mt-1 w-full rounded-md border border-carbon-150 bg-white px-3 py-2 text-carbon-950"
            value={form.model}
            onChange={(event) => onChange({ ...form, model: event.target.value })}
          />
        </label>
        <label className="text-sm font-medium text-carbon-700">
          Symptom code
          <input
            className="mt-1 w-full rounded-md border border-carbon-150 bg-white px-3 py-2 font-mono text-sm text-carbon-950"
            value={form.symptomCode}
            onChange={(event) => onChange({ ...form, symptomCode: event.target.value })}
          />
        </label>
        <label className="text-sm font-medium text-carbon-700">
          Symptom label
          <input
            className="mt-1 w-full rounded-md border border-carbon-150 bg-white px-3 py-2 text-carbon-950"
            value={form.symptomLabel}
            onChange={(event) => onChange({ ...form, symptomLabel: event.target.value })}
          />
        </label>
        <label className="text-sm font-medium text-carbon-700">
          Repair type
          <input
            className="mt-1 w-full rounded-md border border-carbon-150 bg-white px-3 py-2 font-mono text-sm text-carbon-950"
            value={form.repairType}
            onChange={(event) => onChange({ ...form, repairType: event.target.value })}
          />
        </label>
        <label className="text-sm font-medium text-carbon-700">
          Outcome
          <select
            className="mt-1 w-full rounded-md border border-carbon-150 bg-white px-3 py-2 text-carbon-950"
            value={form.outcome}
            onChange={(event) => {
              const outcome = diagnosisOutcomeValues.find(
                (value) => value === event.target.value
              );
              if (outcome) onChange({ ...form, outcome });
            }}
          >
            {diagnosisOutcomeValues.map((outcome) => (
              <option key={outcome} value={outcome}>
                {outcome}
              </option>
            ))}
          </select>
        </label>
        <label className="text-sm font-medium text-carbon-700">
          Priority
          <input
            className="mt-1 w-full rounded-md border border-carbon-150 bg-white px-3 py-2 text-carbon-950"
            inputMode="numeric"
            value={form.priority}
            onChange={(event) => onChange({ ...form, priority: event.target.value })}
          />
        </label>
        <label className="flex items-center gap-2 pt-7 text-sm font-medium text-carbon-700">
          <input
            type="checkbox"
            checked={form.active}
            onChange={(event) => onChange({ ...form, active: event.target.checked })}
          />
          Active rule
        </label>
        <label className="text-sm font-medium text-carbon-700 lg:col-span-3">
          Notes
          <textarea
            className="mt-1 min-h-24 w-full rounded-md border border-carbon-150 bg-white px-3 py-2 text-carbon-950"
            value={form.notes}
            onChange={(event) => onChange({ ...form, notes: event.target.value })}
          />
        </label>
        <div className="flex flex-wrap gap-3 lg:col-span-3">
          <button type="submit" className="btn-primary" disabled={busy}>
            <Save className="h-4 w-4" aria-hidden />
            {busy ? "Saving..." : "Save rule"}
          </button>
          <button type="button" className="btn-ghost px-4 py-2" onClick={onCancel}>
            Cancel
          </button>
        </div>
      </form>
    </section>
  );
}
