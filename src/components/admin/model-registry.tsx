"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Pencil, Plus, Trash2 } from "lucide-react";
import type { AiModel } from "@prisma/client";
import { aiModelSchema } from "@/lib/validation";
import { Modal } from "@/components/admin/modal";
import { Switch } from "@/components/admin/switch";
import { apiFetch, apiJson } from "@/components/admin/shared";

interface FormState {
  id: string | null; // null = adding
  label: string;
  modelId: string;
  inputPerMTok: string;
  outputPerMTok: string;
  enabled: boolean;
  notes: string;
}

const EMPTY_FORM: FormState = {
  id: null,
  label: "",
  modelId: "",
  inputPerMTok: "",
  outputPerMTok: "",
  enabled: true,
  notes: "",
};

export function ModelRegistry({
  models,
  defaultModelIds,
}: {
  models: AiModel[];
  defaultModelIds: string[];
}) {
  const router = useRouter();
  const [form, setForm] = useState<FormState | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [listError, setListError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  function openAdd() {
    setFormError(null);
    setForm(EMPTY_FORM);
  }

  function openEdit(m: AiModel) {
    setFormError(null);
    setForm({
      id: m.id,
      label: m.label,
      modelId: m.modelId,
      inputPerMTok: String(m.inputPerMTok),
      outputPerMTok: String(m.outputPerMTok),
      enabled: m.enabled,
      notes: m.notes ?? "",
    });
  }

  async function submitForm() {
    if (!form) return;
    const parsed = aiModelSchema.safeParse({
      label: form.label,
      modelId: form.modelId,
      inputPerMTok: Number(form.inputPerMTok),
      outputPerMTok: Number(form.outputPerMTok),
      enabled: form.enabled,
      notes: form.notes.trim() === "" ? null : form.notes.trim(),
    });
    if (!parsed.success) {
      const issue = parsed.error.errors[0];
      setFormError(`${issue.path.join(".")}: ${issue.message}`);
      return;
    }
    setBusy(true);
    const result = form.id
      ? await apiFetch<AiModel>(
          `/api/admin/ai-models/${form.id}`,
          apiJson("PATCH", parsed.data)
        )
      : await apiFetch<AiModel>(
          "/api/admin/ai-models",
          apiJson("POST", parsed.data)
        );
    setBusy(false);
    if (!result.ok) {
      setFormError(result.error);
      return;
    }
    setForm(null);
    router.refresh();
  }

  async function toggleEnabled(m: AiModel) {
    setListError(null);
    const result = await apiFetch<AiModel>(
      `/api/admin/ai-models/${m.id}`,
      apiJson("PATCH", { enabled: !m.enabled })
    );
    if (!result.ok) setListError(result.error);
    router.refresh();
  }

  async function deleteModel(m: AiModel) {
    if (
      !window.confirm(
        `Delete "${m.label}" (${m.modelId}) from the registry? Past usage logs are kept.`
      )
    ) {
      return;
    }
    setListError(null);
    const result = await apiFetch<{ deleted: boolean }>(
      `/api/admin/ai-models/${m.id}`,
      { method: "DELETE" }
    );
    if (!result.ok) setListError(result.error);
    router.refresh();
  }

  return (
    <section className="card p-0">
      <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
        <div>
          <h2 className="text-base font-semibold text-slate-900">
            Model registry
          </h2>
          <p className="mt-0.5 text-sm text-slate-500">
            The Anthropic models the site is allowed to call, with their
            pricing.
          </p>
        </div>
        <button type="button" className="btn-primary" onClick={openAdd}>
          <Plus className="h-4 w-4" aria-hidden />
          Add model
        </button>
      </div>

      {listError && (
        <p className="border-b border-red-100 bg-red-50 px-6 py-3 text-sm text-red-700">
          {listError}
        </p>
      )}

      {models.length === 0 ? (
        <p className="px-6 py-8 text-sm text-slate-500">
          No models registered yet. Add one to enable the AI pricing tools.
        </p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-slate-200 text-xs uppercase tracking-wide text-slate-400">
                <th className="px-6 py-3 font-medium">Label</th>
                <th className="px-4 py-3 font-medium">Model id</th>
                <th className="px-4 py-3 font-medium">Input $/MTok</th>
                <th className="px-4 py-3 font-medium">Output $/MTok</th>
                <th className="px-4 py-3 font-medium">Enabled</th>
                <th className="px-4 py-3 font-medium">Notes</th>
                <th className="px-4 py-3 font-medium">
                  <span className="sr-only">Actions</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {models.map((m) => {
                const isDefault = defaultModelIds.includes(m.modelId);
                return (
                  <tr
                    key={m.id}
                    className="border-b border-slate-100 last:border-0"
                  >
                    <td className="px-6 py-3 font-medium text-slate-900">
                      {m.label}
                      {isDefault && (
                        <span className="ml-2 rounded-full bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-700">
                          default
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 font-mono text-xs text-slate-600">
                      {m.modelId}
                    </td>
                    <td className="px-4 py-3 text-slate-700">
                      ${m.inputPerMTok}
                    </td>
                    <td className="px-4 py-3 text-slate-700">
                      ${m.outputPerMTok}
                    </td>
                    <td className="px-4 py-3">
                      <Switch
                        checked={m.enabled}
                        onChange={() => toggleEnabled(m)}
                        label={`${m.label} enabled`}
                      />
                    </td>
                    <td className="max-w-[16rem] truncate px-4 py-3 text-slate-500">
                      {m.notes ?? "—"}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          type="button"
                          onClick={() => openEdit(m)}
                          aria-label={`Edit ${m.label}`}
                          className="rounded p-1.5 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
                        >
                          <Pencil className="h-4 w-4" aria-hidden />
                        </button>
                        <button
                          type="button"
                          onClick={() => deleteModel(m)}
                          disabled={isDefault}
                          aria-label={`Delete ${m.label}`}
                          title={
                            isDefault
                              ? "This model is a configured default — pick a different default first"
                              : undefined
                          }
                          className="rounded p-1.5 text-slate-400 transition hover:bg-red-50 hover:text-red-600 disabled:cursor-not-allowed disabled:opacity-40"
                        >
                          <Trash2 className="h-4 w-4" aria-hidden />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      <p className="border-t border-slate-100 px-6 py-3 text-xs text-slate-400">
        Prices are USD per million tokens — check platform.claude.com for
        current pricing.
      </p>

      {form && (
        <Modal
          title={form.id ? "Edit model" : "Add model"}
          onClose={() => setForm(null)}
        >
          <form
            className="space-y-4"
            onSubmit={(e) => {
              e.preventDefault();
              void submitForm();
            }}
          >
            <div>
              <label className="label" htmlFor="model-label">
                Label
              </label>
              <input
                id="model-label"
                className="input"
                value={form.label}
                onChange={(e) => setForm({ ...form, label: e.target.value })}
                placeholder="Claude Opus 4.8"
                required
              />
            </div>
            <div>
              <label className="label" htmlFor="model-id">
                Model id
              </label>
              <input
                id="model-id"
                className="input font-mono"
                value={form.modelId}
                onChange={(e) => setForm({ ...form, modelId: e.target.value })}
                placeholder="claude-opus-4-8"
                required
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="label" htmlFor="model-input-price">
                  Input $/MTok
                </label>
                <input
                  id="model-input-price"
                  className="input"
                  type="number"
                  min="0"
                  step="any"
                  inputMode="decimal"
                  value={form.inputPerMTok}
                  onChange={(e) =>
                    setForm({ ...form, inputPerMTok: e.target.value })
                  }
                  required
                />
              </div>
              <div>
                <label className="label" htmlFor="model-output-price">
                  Output $/MTok
                </label>
                <input
                  id="model-output-price"
                  className="input"
                  type="number"
                  min="0"
                  step="any"
                  inputMode="decimal"
                  value={form.outputPerMTok}
                  onChange={(e) =>
                    setForm({ ...form, outputPerMTok: e.target.value })
                  }
                  required
                />
              </div>
            </div>
            <div>
              <label className="label" htmlFor="model-notes">
                Notes <span className="font-normal text-slate-400">(optional)</span>
              </label>
              <input
                id="model-notes"
                className="input"
                value={form.notes}
                onChange={(e) => setForm({ ...form, notes: e.target.value })}
                placeholder="e.g. best for market research"
              />
            </div>
            <div className="flex items-center gap-3">
              <Switch
                checked={form.enabled}
                onChange={(v) => setForm({ ...form, enabled: v })}
                label="Model enabled"
              />
              <span className="text-sm text-slate-700">
                Enabled (available to AI features)
              </span>
            </div>

            {formError && (
              <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
                {formError}
              </p>
            )}

            <div className="flex justify-end gap-3 pt-2">
              <button
                type="button"
                className="btn-ghost"
                onClick={() => setForm(null)}
              >
                Cancel
              </button>
              <button type="submit" className="btn-primary" disabled={busy}>
                {busy ? "Saving…" : form.id ? "Save changes" : "Add model"}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </section>
  );
}
