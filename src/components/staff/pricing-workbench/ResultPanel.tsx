"use client";

import Link from "next/link";
import { ArrowRight, CircuitBoard, ClipboardList } from "lucide-react";
import { formatAud } from "@/lib/utils";
import { warrantyLabel } from "@/components/staff/ui";
import {
  buildIntakeHref,
  shouldShowBoardReference,
  visiblePricedParts,
} from "./state";
import type { MatchResult } from "./types";

interface ResultPanelProps {
  readonly result: MatchResult;
  readonly diagnosisLabel: string;
  readonly selectedPartId: string | null;
  readonly onSelectPart: (partId: string) => void;
}

export default function ResultPanel({
  result,
  diagnosisLabel,
  selectedPartId,
  onSelectPart,
}: ResultPanelProps) {
  const pricedParts = visiblePricedParts(result);
  const selectedPart = pricedParts.find((part) => part.id === selectedPartId) ?? null;
  const canOpenIntake = selectedPart !== null && result.diagnosisRuleId !== null;

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
            <label
              key={part.id}
              className="grid cursor-pointer gap-3 px-4 py-4 transition hover:bg-bone-200 md:grid-cols-[1fr_auto] md:items-center"
            >
              <span className="flex min-w-0 items-start gap-3">
                <input
                  type="radio"
                  name="staff-priced-option"
                  className="mt-1 h-4 w-4 border-carbon-950 text-signal-600 focus:ring-signal-500"
                  checked={selectedPartId === part.id}
                  onChange={() => onSelectPart(part.id)}
                />
                <span className="min-w-0">
                  <span className="block font-semibold text-carbon-950">
                    {part.quality}
                    {part.colour ? ` · ${part.colour}` : ""}
                  </span>
                  <span className="mt-1 block text-sm text-carbon-600">
                    {warrantyLabel(part.warrantyDays)} warranty · Stock {part.stockQty}
                  </span>
                </span>
              </span>
              <span className="mnl-num text-right text-2xl text-carbon-950">
                {formatAud(part.sellPrice)}
              </span>
            </label>
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
        {canOpenIntake ? (
          <Link
            href={buildIntakeHref({
              partId: selectedPart.id,
              diagnosisRuleId: result.diagnosisRuleId,
              diagnosis: diagnosisLabel,
            })}
            className="mnl-btn mnl-btn-sm"
          >
            <ClipboardList className="h-4 w-4" aria-hidden="true" />
            Start intake
            <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </Link>
        ) : null}
      </div>
    </div>
  );
}
