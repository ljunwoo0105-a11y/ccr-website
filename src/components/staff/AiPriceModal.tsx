"use client";

import { useEffect, useRef, useState } from "react";
import { Loader2, Sparkles, X, TrendingUp, Search } from "lucide-react";
import { formatAud } from "@/lib/utils";
import { marginTone } from "@/components/staff/ui";
import type {
  AiPricingResult,
  ApiEnvelope,
  PartRow,
} from "@/components/staff/types";

interface Props {
  part: PartRow;
  /** Called with the updated part after "Apply as sell price". */
  onApplied: (part: PartRow) => void;
  onClose: () => void;
}

const POSITIONING_BADGES: Record<string, { label: string; cls: string }> = {
  below_market: { label: "Below market", cls: "bg-sky-100 text-sky-800" },
  at_market: { label: "At market", cls: "bg-emerald-100 text-emerald-800" },
  above_market: { label: "Above market", cls: "bg-amber-100 text-amber-800" },
  no_market_data: { label: "No market data", cls: "bg-slate-200 text-slate-700" },
};

export default function AiPriceModal({ part, onApplied, onClose }: Props) {
  const [result, setResult] = useState<AiPricingResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [applying, setApplying] = useState(false);
  const [applyError, setApplyError] = useState<string | null>(null);
  const startedRef = useRef(false);

  useEffect(() => {
    // Guard against React strict-mode double effects — one AI run per open.
    if (startedRef.current) return;
    startedRef.current = true;

    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/staff/ai/pricing", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ partId: part.id }),
        });
        const json = (await res.json()) as ApiEnvelope<AiPricingResult>;
        if (cancelled) return;
        if (!res.ok || !json.ok || !json.data) {
          setError(json.error ?? "AI pricing failed — try again");
          return;
        }
        setResult(json.data);
      } catch {
        if (!cancelled) setError("Network error — try again");
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [part.id]);

  async function handleApply() {
    if (!result) return;
    setApplyError(null);
    setApplying(true);
    try {
      const res = await fetch(`/api/staff/parts/${part.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sellPrice: result.recommendation.recommendedPriceAud,
        }),
      });
      const json = (await res.json()) as ApiEnvelope<PartRow>;
      if (!res.ok || !json.ok || !json.data) {
        setApplyError(json.error ?? "Could not update the part");
        setApplying(false);
        return;
      }
      onApplied(json.data);
    } catch {
      setApplyError("Network error — try again");
      setApplying(false);
    }
  }

  const positioning = result
    ? POSITIONING_BADGES[result.recommendation.positioning] ??
      POSITIONING_BADGES.no_market_data
    : null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-slate-900/60 p-4 sm:items-center"
      role="dialog"
      aria-modal="true"
      aria-label="AI price check"
    >
      <div className="card w-full max-w-2xl">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="flex items-center gap-2 text-lg font-bold text-slate-900">
            <Sparkles className="h-5 w-5 text-violet-600" aria-hidden />
            AI price check
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
            aria-label="Close"
          >
            <X className="h-5 w-5" aria-hidden />
          </button>
        </div>

        <p className="mb-4 text-sm text-slate-600">
          {part.brand} {part.model} — {part.repairType} · cost{" "}
          {formatAud(part.costPrice)} · currently selling at{" "}
          {formatAud(part.sellPrice)}
        </p>

        {!result && !error && (
          <div className="flex flex-col items-center gap-3 py-12">
            <Loader2
              className="h-8 w-8 animate-spin text-ccr-primary"
              aria-hidden
            />
            <p className="text-sm font-medium text-slate-700">
              Researching the market…
            </p>
            <p className="text-xs text-slate-500">
              Live competitor research can take 30–60 seconds.
            </p>
          </div>
        )}

        {error && (
          <p
            role="alert"
            className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700"
          >
            {error}
          </p>
        )}

        {result && (
          <div className="space-y-4">
            <section className="rounded-xl border border-slate-200 bg-slate-50 p-4">
              <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold text-slate-900">
                <Search className="h-4 w-4 text-slate-500" aria-hidden />
                Market research
              </h3>
              <dl className="mb-3 grid grid-cols-3 gap-3 text-center">
                {(
                  [
                    ["Low", result.research.marketLowAud],
                    ["Average", result.research.marketAvgAud],
                    ["High", result.research.marketHighAud],
                  ] as const
                ).map(([label, value]) => (
                  <div
                    key={label}
                    className="rounded-lg border border-slate-200 bg-white p-2"
                  >
                    <dt className="text-xs text-slate-500">{label}</dt>
                    <dd className="text-base font-bold text-slate-900">
                      {value !== null ? formatAud(value) : "—"}
                    </dd>
                  </div>
                ))}
              </dl>
              {result.research.competitors.length > 0 && (
                <ul className="mb-3 space-y-1.5">
                  {result.research.competitors.map((c, i) => (
                    <li
                      key={`${c.name}-${i}`}
                      className="flex items-baseline justify-between gap-3 text-sm"
                    >
                      <span className="font-medium text-slate-800">
                        {c.name}
                        {c.note && (
                          <span className="ml-2 font-normal text-xs text-slate-500">
                            {c.note}
                          </span>
                        )}
                      </span>
                      <span className="shrink-0 font-semibold text-slate-900">
                        {c.priceAud !== null ? formatAud(c.priceAud) : "—"}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
              <p className="text-xs leading-relaxed text-slate-600">
                {result.research.summary}
              </p>
            </section>

            <section className="rounded-xl border border-violet-200 bg-violet-50 p-4">
              <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold text-slate-900">
                <TrendingUp className="h-4 w-4 text-violet-600" aria-hidden />
                Recommendation
              </h3>
              <div className="mb-2 flex flex-wrap items-center gap-3">
                <span className="text-3xl font-bold text-slate-900">
                  {formatAud(result.recommendation.recommendedPriceAud)}
                </span>
                <span
                  className={`text-sm font-semibold ${marginTone(result.recommendation.marginPct)}`}
                >
                  {result.recommendation.marginPct.toFixed(1)}% margin
                </span>
                {positioning && (
                  <span
                    className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold ${positioning.cls}`}
                  >
                    {positioning.label}
                  </span>
                )}
              </div>
              <p className="text-xs leading-relaxed text-slate-600">
                {result.recommendation.reasoning}
              </p>
            </section>

            {applyError && (
              <p
                role="alert"
                className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700"
              >
                {applyError}
              </p>
            )}
          </div>
        )}

        <div className="mt-5 flex justify-end gap-3">
          <button type="button" className="btn-ghost" onClick={onClose}>
            Close
          </button>
          {result && (
            <button
              type="button"
              className="btn-primary"
              onClick={handleApply}
              disabled={applying}
            >
              {applying && (
                <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
              )}
              Apply {formatAud(result.recommendation.recommendedPriceAud)} as
              sell price
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
