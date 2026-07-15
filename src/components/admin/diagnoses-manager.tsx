"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Plus } from "lucide-react";
import { DiagnosisRuleForm } from "./diagnoses-form";
import {
  deleteDiagnosisRule,
  diagnosisFormError,
  listDiagnosisRules,
  saveDiagnosisRule,
  toDiagnosisPayload,
} from "./diagnoses-request";
import {
  beginDiagnosisLoad,
  beginDiagnosisSubmit,
  diagnosisFormFromRule,
  finishDiagnosisSubmit,
  initialDiagnosisState,
  settleDiagnosisLoad,
} from "./diagnoses-state";
import { DiagnosesTable } from "./diagnoses-table";
import { emptyDiagnosisForm, type DiagnosisForm, type DiagnosisRule } from "./diagnoses-types";

export function DiagnosesManager() {
  const [panel, setPanel] = useState(initialDiagnosisState);
  const [form, setForm] = useState<DiagnosisForm | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const loadTokenRef = useRef(0);

  const load = useCallback(async () => {
    const token = loadTokenRef.current + 1;
    loadTokenRef.current = token;
    setPanel((current) => beginDiagnosisLoad({ ...current, loadToken: token - 1 }));
    const result = await listDiagnosisRules();
    setPanel((current) => settleDiagnosisLoad(current, token, result));
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function submitForm() {
    if (!form) return;
    const validationError = diagnosisFormError(form);
    if (validationError) {
      setFormError(validationError);
      return;
    }
    const gate = beginDiagnosisSubmit(panel);
    if (!gate.accepted) return;
    setPanel(gate.state);
    setFormError(null);
    const result = await saveDiagnosisRule(
      toDiagnosisPayload(form),
      fetch,
      form.id ?? undefined
    );
    setPanel((current) =>
      finishDiagnosisSubmit(current, result.kind === "error" ? result.message : null)
    );
    if (result.kind === "error") {
      setFormError(result.message);
      return;
    }
    setForm(null);
    await load();
  }

  async function deactivateRule(record: DiagnosisRule) {
    setBusyId(record.id);
    const result = await deleteDiagnosisRule(record.id, "deactivate");
    setBusyId(null);
    if (result.kind === "error") {
      setPanel((current) => ({ ...current, error: result.message }));
      return;
    }
    await load();
  }

  async function hardDeleteRule(record: DiagnosisRule) {
    if (
      !window.confirm(
        `Permanently delete diagnosis rule ${record.symptomCode}? This cannot be undone.`
      )
    ) {
      return;
    }
    setBusyId(record.id);
    const result = await deleteDiagnosisRule(record.id, "hard");
    setBusyId(null);
    if (result.kind === "error") {
      setPanel((current) => ({ ...current, error: result.message }));
      return;
    }
    await load();
  }

  return (
    <div className="space-y-6">
      {form && (
        <DiagnosisRuleForm
          form={form}
          error={formError}
          busy={panel.submitting}
          onChange={setForm}
          onSubmit={submitForm}
          onCancel={() => {
            setForm(null);
            setFormError(null);
          }}
        />
      )}

      <section className="card p-0">
        <div className="flex flex-col gap-3 border-b border-carbon-150 px-6 py-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-base font-semibold text-carbon-950">Diagnosis rules</h2>
            <p className="mt-1 text-sm text-carbon-500">
              Exact scope, symptom, repair, outcome, priority, and active state.
            </p>
          </div>
          <button
            type="button"
            className="btn-primary self-start"
            onClick={() => {
              setForm(emptyDiagnosisForm);
              setFormError(null);
            }}
          >
            <Plus className="h-4 w-4" aria-hidden />
            Add rule
          </button>
        </div>

        {panel.error && (
          <p className="border-b border-rose-200/60 bg-rose-50 px-6 py-3 text-sm text-rose-700">
            {panel.error}
          </p>
        )}

        {panel.status === "loading" ? (
          <p className="px-6 py-8 text-sm text-carbon-500">Loading diagnosis rules...</p>
        ) : panel.status === "empty" ? (
          <p className="px-6 py-8 text-sm text-carbon-500">No diagnosis rules yet.</p>
        ) : panel.status === "error" ? (
          <p className="px-6 py-8 text-sm text-carbon-500">Could not load diagnosis rules.</p>
        ) : (
          <DiagnosesTable
            records={panel.records}
            busyId={busyId}
            onEdit={(record) => {
              setForm(diagnosisFormFromRule(record));
              setFormError(null);
            }}
            onDeactivate={deactivateRule}
            onHardDelete={hardDeleteRule}
          />
        )}
      </section>
    </div>
  );
}
