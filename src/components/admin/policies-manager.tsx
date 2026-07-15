"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Plus } from "lucide-react";
import { PolicyEditorForm } from "./policies-form";
import {
  deletePolicy,
  listPolicies,
  policyFormError,
  savePolicy,
  toPolicyPayload,
} from "./policies-request";
import {
  beginPolicyLoad,
  beginPolicySubmit,
  finishPolicySubmit,
  initialPolicyState,
  policyFormFromRecord,
  settlePolicyLoad,
} from "./policies-state";
import { PoliciesTable } from "./policies-table";
import { emptyPolicyForm, type Policy, type PolicyForm } from "./policies-types";

export function PoliciesManager() {
  const [panel, setPanel] = useState(initialPolicyState);
  const [form, setForm] = useState<PolicyForm | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const loadTokenRef = useRef(0);

  const load = useCallback(async () => {
    const token = loadTokenRef.current + 1;
    loadTokenRef.current = token;
    setPanel((current) => beginPolicyLoad({ ...current, loadToken: token - 1 }));
    const result = await listPolicies();
    setPanel((current) => settlePolicyLoad(current, token, result));
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function submitForm() {
    if (!form) return;
    const validationError = policyFormError(form);
    if (validationError) {
      setFormError(validationError);
      return;
    }
    const gate = beginPolicySubmit(panel);
    if (!gate.accepted) return;
    setPanel(gate.state);
    setFormError(null);
    const result = await savePolicy(toPolicyPayload(form), fetch, form.id ?? undefined);
    setPanel((current) =>
      finishPolicySubmit(current, result.kind === "error" ? result.message : null)
    );
    if (result.kind === "error") {
      setFormError(result.message);
      return;
    }
    setForm(null);
    await load();
  }

  async function deactivatePolicy(record: Policy) {
    setBusyId(record.id);
    const result = await deletePolicy(record.id, "deactivate");
    setBusyId(null);
    if (result.kind === "error") {
      setPanel((current) => ({ ...current, error: result.message }));
      return;
    }
    await load();
  }

  async function hardDeletePolicy(record: Policy) {
    if (
      !window.confirm(
        `Permanently delete policy ${record.category} ${record.version}? This cannot be undone.`
      )
    ) {
      return;
    }
    setBusyId(record.id);
    const result = await deletePolicy(record.id, "hard");
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
        <PolicyEditorForm
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
            <h2 className="text-base font-semibold text-carbon-950">Policy documents</h2>
            <p className="mt-1 text-sm text-carbon-500">
              Category, version, title, and current active agreement text.
            </p>
          </div>
          <button
            type="button"
            className="btn-primary self-start"
            onClick={() => {
              setForm(emptyPolicyForm);
              setFormError(null);
            }}
          >
            <Plus className="h-4 w-4" aria-hidden />
            Add policy
          </button>
        </div>

        {panel.error && (
          <p className="border-b border-rose-200/60 bg-rose-50 px-6 py-3 text-sm text-rose-700">
            {panel.error}
          </p>
        )}

        {panel.status === "loading" ? (
          <p className="px-6 py-8 text-sm text-carbon-500">Loading policies...</p>
        ) : panel.status === "empty" ? (
          <p className="px-6 py-8 text-sm text-carbon-500">No policy documents yet.</p>
        ) : panel.status === "error" ? (
          <p className="px-6 py-8 text-sm text-carbon-500">Could not load policies.</p>
        ) : (
          <PoliciesTable
            records={panel.records}
            busyId={busyId}
            onEdit={(record) => {
              setForm(policyFormFromRecord(record));
              setFormError(null);
            }}
            onDeactivate={deactivatePolicy}
            onHardDelete={hardDeletePolicy}
          />
        )}
      </section>
    </div>
  );
}
