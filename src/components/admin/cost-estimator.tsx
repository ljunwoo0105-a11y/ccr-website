"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import { formatUsd } from "@/components/admin/shared";

export interface EstimatorModel {
  modelId: string;
  label: string;
  inputPerMTok: number;
  outputPerMTok: number;
}

/**
 * Pure client-side what-if calculator — no API calls. Token presets reflect
 * measured usage of the staff AI features; actual costs are logged per call.
 */
const PRESETS = [
  {
    key: "price_check",
    label: "Price check (research + margin)",
    description:
      "2 API calls per check — roughly 9,500 input + 2,100 output tokens combined.",
    inputTokens: 9500,
    outputTokens: 2100,
  },
] as const;

export function CostEstimator({ models }: { models: EstimatorModel[] }) {
  const [preset, setPreset] = useState<string>("price_check");
  const [usesPerMonth, setUsesPerMonth] = useState(100);
  const [inputTokens, setInputTokens] = useState("9500");
  const [outputTokens, setOutputTokens] = useState("2100");

  const activePreset = PRESETS.find((p) => p.key === preset);

  function choosePreset(key: string) {
    setPreset(key);
    const p = PRESETS.find((x) => x.key === key);
    if (p) {
      setInputTokens(String(p.inputTokens));
      setOutputTokens(String(p.outputTokens));
    }
  }

  function editTokens(setter: (v: string) => void, value: string) {
    setter(value);
    setPreset("custom");
  }

  const inTok = Math.max(0, Number(inputTokens) || 0);
  const outTok = Math.max(0, Number(outputTokens) || 0);
  const uses = Math.max(0, usesPerMonth);

  const rows = models.map((m) => {
    const perUse =
      (inTok / 1_000_000) * m.inputPerMTok +
      (outTok / 1_000_000) * m.outputPerMTok;
    return { ...m, perUse, perMonth: perUse * uses };
  });
  const cheapest =
    rows.length > 0 ? Math.min(...rows.map((r) => r.perMonth)) : 0;

  return (
    <section className="card">
      <h2 className="text-base font-semibold text-slate-900">
        Cost estimator
      </h2>
      <p className="mt-0.5 text-sm text-slate-500">
        Compare what a month of usage would cost on each enabled model.
      </p>

      <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div>
          <label className="label" htmlFor="est-preset">
            Feature preset
          </label>
          <select
            id="est-preset"
            className="input"
            value={preset}
            onChange={(e) => choosePreset(e.target.value)}
          >
            {PRESETS.map((p) => (
              <option key={p.key} value={p.key}>
                {p.label}
              </option>
            ))}
            <option value="custom">Custom</option>
          </select>
        </div>
        <div>
          <label className="label" htmlFor="est-uses">
            Uses per month — {usesPerMonth}
          </label>
          <input
            id="est-uses"
            type="range"
            min={0}
            max={1000}
            step={10}
            value={usesPerMonth}
            onChange={(e) => setUsesPerMonth(Number(e.target.value))}
            className="mt-3 w-full accent-[hsl(214,100%,35%)]"
          />
          <input
            type="number"
            min={0}
            className="input mt-2"
            aria-label="Uses per month"
            value={usesPerMonth}
            onChange={(e) =>
              setUsesPerMonth(Math.max(0, Number(e.target.value) || 0))
            }
          />
        </div>
        <div>
          <label className="label" htmlFor="est-input-tokens">
            Avg input tokens / use
          </label>
          <input
            id="est-input-tokens"
            className="input"
            type="number"
            min={0}
            value={inputTokens}
            onChange={(e) => editTokens(setInputTokens, e.target.value)}
          />
        </div>
        <div>
          <label className="label" htmlFor="est-output-tokens">
            Avg output tokens / use
          </label>
          <input
            id="est-output-tokens"
            className="input"
            type="number"
            min={0}
            value={outputTokens}
            onChange={(e) => editTokens(setOutputTokens, e.target.value)}
          />
        </div>
      </div>

      {activePreset && (
        <p className="mt-3 text-xs text-slate-400">{activePreset.description}</p>
      )}

      {rows.length === 0 ? (
        <p className="mt-5 rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-800">
          No enabled models in the registry — enable at least one model above
          to compare costs.
        </p>
      ) : (
        <div className="mt-5 overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-slate-200 text-xs uppercase tracking-wide text-slate-400">
                <th className="py-3 pr-4 font-medium">Model</th>
                <th className="px-4 py-3 font-medium">Cost per use</th>
                <th className="px-4 py-3 font-medium">Cost per month</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => {
                const isCheapest =
                  rows.length > 1 && r.perMonth === cheapest;
                return (
                  <tr
                    key={r.modelId}
                    className={cn(
                      "border-b border-slate-100 last:border-0",
                      isCheapest && "bg-emerald-50"
                    )}
                  >
                    <td className="py-3 pr-4">
                      <span className="font-medium text-slate-900">
                        {r.label}
                      </span>{" "}
                      <span className="font-mono text-xs text-slate-400">
                        {r.modelId}
                      </span>
                      {isCheapest && (
                        <span className="ml-2 rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-medium text-emerald-700">
                          cheapest
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-slate-700">
                      {formatUsd(r.perUse)}
                    </td>
                    <td className="px-4 py-3 font-medium text-slate-900">
                      {formatUsd(r.perMonth, 2)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      <p className="mt-4 text-xs text-slate-400">
        Estimates only — every real call is logged automatically with exact
        token counts and shown in the usage dashboard below.
      </p>
    </section>
  );
}
