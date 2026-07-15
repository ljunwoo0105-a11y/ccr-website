"use client";

import { Save, X } from "lucide-react";
import { policyCategoryValues, type PolicyForm } from "./policies-types";

type PolicyFormProps = {
  readonly form: PolicyForm;
  readonly error: string | null;
  readonly busy: boolean;
  readonly onChange: (form: PolicyForm) => void;
  readonly onSubmit: () => void;
  readonly onCancel: () => void;
};

export function PolicyEditorForm({
  form,
  error,
  busy,
  onChange,
  onSubmit,
  onCancel,
}: PolicyFormProps) {
  const title = form.id ? "Edit policy" : "Create policy";
  return (
    <section className="card">
      <div className="flex flex-col gap-2 border-b border-carbon-150 pb-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-base font-semibold text-carbon-950">{title}</h2>
          <p className="mt-1 text-sm text-carbon-500">
            Active policies become the current customer agreement text for their category.
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
          Category
          <select
            className="mt-1 w-full rounded-md border border-carbon-150 bg-white px-3 py-2 text-carbon-950"
            value={form.category}
            onChange={(event) => {
              const category = policyCategoryValues.find(
                (value) => value === event.target.value
              );
              if (category) onChange({ ...form, category });
            }}
          >
            {policyCategoryValues.map((category) => (
              <option key={category} value={category}>
                {category}
              </option>
            ))}
          </select>
        </label>
        <label className="text-sm font-medium text-carbon-700">
          Version
          <input
            className="mt-1 w-full rounded-md border border-carbon-150 bg-white px-3 py-2 font-mono text-sm text-carbon-950"
            value={form.version}
            onChange={(event) => onChange({ ...form, version: event.target.value })}
            placeholder="2099-01-01.1"
          />
        </label>
        <label className="flex items-center gap-2 pt-7 text-sm font-medium text-carbon-700">
          <input
            type="checkbox"
            checked={form.active}
            onChange={(event) => onChange({ ...form, active: event.target.checked })}
          />
          Active policy
        </label>
        <label className="text-sm font-medium text-carbon-700 lg:col-span-3">
          Title
          <input
            className="mt-1 w-full rounded-md border border-carbon-150 bg-white px-3 py-2 text-carbon-950"
            value={form.title}
            onChange={(event) => onChange({ ...form, title: event.target.value })}
          />
        </label>
        <label className="text-sm font-medium text-carbon-700 lg:col-span-3">
          Body
          <textarea
            className="mt-1 min-h-48 w-full rounded-md border border-carbon-150 bg-white px-3 py-2 text-carbon-950"
            value={form.body}
            onChange={(event) => onChange({ ...form, body: event.target.value })}
          />
        </label>
        <div className="flex flex-wrap gap-3 lg:col-span-3">
          <button type="submit" className="btn-primary" disabled={busy}>
            <Save className="h-4 w-4" aria-hidden />
            {busy ? "Saving..." : "Save policy"}
          </button>
          <button type="button" className="btn-ghost px-4 py-2" onClick={onCancel}>
            Cancel
          </button>
        </div>
      </form>
    </section>
  );
}
