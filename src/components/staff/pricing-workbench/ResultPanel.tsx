"use client";

import { CircuitBoard } from "lucide-react";
import { formatAud } from "@/lib/utils";
import { warrantyLabel } from "@/components/staff/ui";
import { shouldShowBoardReference, visiblePricedParts } from "./state";
import type { MatchResult, PricedPart } from "./types";

interface ResultPanelProps {
  readonly result: MatchResult;
  readonly diagnosisLabel: string;
  /** Choosing a tier places the pre-order — the row IS the action. */
  readonly onPreOrder: (part: PricedPart) => void;
}

export default function ResultPanel({
  result,
  diagnosisLabel,
  onPreOrder,
}: ResultPanelProps) {
  const pricedParts = visiblePricedParts(result);

  return (
    <div className="border border-carbon-950 bg-bone-100">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-carbon-950 px-4 py-3">
        <div>
          <p className="mnl-dim text-carbon-500">MATCH RESULT</p>
          <h3 className="mnl-title text-xl text-carbon-950">
            {result.repairType ?? "Inspection required"}
          </h3>
        </div>
        {shouldShowBoardReference(result) ? (
          <a href="#circuit" className="mnl-btn-ghost mnl-btn-sm">
            <CircuitBoard className="h-4 w-4" aria-hidden="true" />
            View board reference
          </a>
        ) : null}
      </div>

      {pricedParts.length > 0 ? (
        <div className="divide-y divide-carbon-150">
          {pricedParts.map((part) => (
            <button
              key={part.id}
              type="button"
              onClick={() => onPreOrder(part)}
              aria-label={`Pre-order ${part.quality} at ${formatAud(part.sellPrice)}`}
              className="grid w-full gap-3 px-4 py-4 text-left transition hover:bg-signal-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-signal-600 md:grid-cols-[1fr_auto] md:items-center"
            >
              <span className="min-w-0">
                <span className="block font-semibold text-carbon-950">
                  {part.quality}
                  {part.colour ? ` · ${part.colour}` : ""}
                </span>
                <span className="mt-1 block text-sm text-carbon-600">
                  {warrantyLabel(part.warrantyDays)} warranty · Stock{" "}
                  {part.stockQty}
                </span>
              </span>
              <span className="flex items-center justify-end gap-3">
                <span className="mnl-num text-right text-2xl text-carbon-950">
                  {formatAud(part.sellPrice)}
                </span>
                <span className="mnl-dim shrink-0 text-signal-600">
                  PRE-ORDER →
                </span>
              </span>
            </button>
          ))}
        </div>
      ) : (
        <div className="px-4 py-5 text-sm leading-relaxed text-carbon-700">
          No catalog row backs this outcome yet. Book an inspection and quote
          from the bench after assessment.
        </div>
      )}

      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-carbon-150 bg-bone-200 px-4 py-3">
        <p className="max-w-xl text-xs text-carbon-600">
          Diagnosis: {diagnosisLabel}
          {result.reason ? ` · ${result.reason.replaceAll("_", " ")}` : ""}
        </p>
        {pricedParts.length > 0 ? (
          <p className="mnl-dim text-carbon-500">
            CHOOSE A TIER TO PRE-ORDER
          </p>
        ) : null}
      </div>
    </div>
  );
}
