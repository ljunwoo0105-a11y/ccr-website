"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { aiSettingsSchema } from "@/lib/validation";
import { Switch } from "@/components/admin/switch";
import { apiFetch, apiJson } from "@/components/admin/shared";

export interface AiSettings {
  monthlyBudgetUsd: number;
  blockAtCap: boolean;
  defaultPricingModel: string;
  defaultResearchModel: string;
  targetMarginPct: number;
}

export interface ModelOption {
  modelId: string;
  label: string;
}

function withCurrent(options: ModelOption[], current: string): ModelOption[] {
  if (current && !options.some((o) => o.modelId === current)) {
    return [...options, { modelId: current, label: `${current} (not in registry)` }];
  }
  return options;
}

export function AiSettingsForm({
  options,
  initial,
}: {
  options: ModelOption[];
  initial: AiSettings;
}) {
  const router = useRouter();
  const [pricingModel, setPricingModel] = useState(initial.defaultPricingModel);
  const [researchModel, setResearchModel] = useState(
    initial.defaultResearchModel
  );
  const [margin, setMargin] = useState(String(initial.targetMarginPct));
  const [budget, setBudget] = useState(String(initial.monthlyBudgetUsd));
  const [blockAtCap, setBlockAtCap] = useState(initial.blockAtCap);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<{
    ok: boolean;
    text: string;
  } | null>(null);

  async function save() {
    setMessage(null);
    const parsed = aiSettingsSchema.safeParse({
      monthlyBudgetUsd: Number(budget),
      blockAtCap,
      defaultPricingModel: pricingModel,
      defaultResearchModel: researchModel,
      targetMarginPct: Number(margin),
    });
    if (!parsed.success) {
      const issue = parsed.error.errors[0];
      setMessage({ ok: false, text: `${issue.path.join(".")}: ${issue.message}` });
      return;
    }
    setBusy(true);
    const result = await apiFetch<AiSettings>(
      "/api/admin/ai-settings",
      apiJson("PUT", parsed.data)
    );
    setBusy(false);
    if (!result.ok) {
      setMessage({ ok: false, text: result.error });
      return;
    }
    setMessage({ ok: true, text: "Settings saved." });
    router.refresh();
  }

  const noModels = options.length === 0;

  return (
    <section className="card">
      <h2 className="text-base font-semibold text-slate-900">
        Defaults &amp; budget
      </h2>
      <p className="mt-0.5 text-sm text-slate-500">
        Which models the AI features use by default, and the monthly spend
        guard-rail.
      </p>

      <form
        className="mt-5 space-y-4"
        onSubmit={(e) => {
          e.preventDefault();
          void save();
        }}
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="label" htmlFor="default-pricing-model">
              Default pricing model
            </label>
            <select
              id="default-pricing-model"
              className="input"
              value={pricingModel}
              onChange={(e) => setPricingModel(e.target.value)}
            >
              {withCurrent(options, pricingModel).map((o) => (
                <option key={o.modelId} value={o.modelId}>
                  {o.label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="label" htmlFor="default-research-model">
              Default research model
            </label>
            <select
              id="default-research-model"
              className="input"
              value={researchModel}
              onChange={(e) => setResearchModel(e.target.value)}
            >
              {withCurrent(options, researchModel).map((o) => (
                <option key={o.modelId} value={o.modelId}>
                  {o.label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="label" htmlFor="target-margin">
              Target margin %
            </label>
            <input
              id="target-margin"
              className="input"
              type="number"
              min="0"
              max="95"
              step="any"
              inputMode="decimal"
              value={margin}
              onChange={(e) => setMargin(e.target.value)}
              required
            />
            <p className="mt-1 text-xs text-slate-400">
              Used by the margin agent when recommending sell prices.
            </p>
          </div>
          <div>
            <label className="label" htmlFor="monthly-budget">
              Monthly budget (USD)
            </label>
            <input
              id="monthly-budget"
              className="input"
              type="number"
              min="0"
              step="any"
              inputMode="decimal"
              value={budget}
              onChange={(e) => setBudget(e.target.value)}
              required
            />
          </div>
        </div>

        <div className="flex items-center gap-3 rounded-lg bg-slate-50 px-4 py-3">
          <Switch
            checked={blockAtCap}
            onChange={setBlockAtCap}
            label="Block AI calls when the monthly budget is reached"
          />
          <span className="text-sm text-slate-700">
            Block AI calls when the monthly budget is reached
          </span>
        </div>

        {noModels && (
          <p className="rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-800">
            No enabled models in the registry — add and enable a model above
            before picking defaults.
          </p>
        )}

        {message && (
          <p
            className={
              message.ok
                ? "rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-700"
                : "rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700"
            }
            role="status"
          >
            {message.text}
          </p>
        )}

        <div className="flex justify-end">
          <button type="submit" className="btn-primary" disabled={busy}>
            {busy ? "Saving…" : "Save settings"}
          </button>
        </div>
      </form>
    </section>
  );
}
