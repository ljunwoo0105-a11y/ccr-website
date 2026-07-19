"use client";

// ---------------------------------------------------------------------------
// The staff-only price shown against a bay part or a diagnosis suspect.
//
// With a model picked this is the ACCURATE quote: one line per quality tier
// straight from the catalog row, with its warranty and stock. Without one it
// degrades to a spread across models, clearly marked as such so nobody reads
// an orientation figure as a quote. Renders nothing at all for public
// visitors, so their DOM is unchanged.
// ---------------------------------------------------------------------------

import { QUALITY_LABELS } from "@/lib/config";
import { formatAud } from "@/lib/utils";
import { warrantyLabel } from "@/components/staff/ui";
import type { PriceBand, PriceQuote } from "./useStaffPrices";

export interface PartPricing {
  readonly repairType: string | null;
  readonly quotes: readonly PriceQuote[];
  readonly band: PriceBand | null;
  /** "Apple iPhone 15" when a model is picked, else null. */
  readonly modelLabel: string | null;
}

function qualityLabel(quality: string): string {
  return QUALITY_LABELS[quality as keyof typeof QUALITY_LABELS] ?? quality;
}

export default function StaffPriceTag({
  pricing,
  compact = false,
  onConfirmQuote,
}: {
  readonly pricing: PartPricing;
  /** Tighter form for the diagnosis suspect list. */
  readonly compact?: boolean;
  /**
   * Confirming a tier IS choosing the catalog part: the server re-derives
   * quality, warranty and price from its id, so this is the whole quote.
   */
  readonly onConfirmQuote?: (quote: PriceQuote) => void;
}) {
  const { repairType, quotes, band, modelLabel } = pricing;
  if (!repairType) return null;

  // A model is picked but this repair has no row for it — say so rather than
  // silently falling back to a spread from other models.
  if (modelLabel && quotes.length === 0) {
    return compact ? (
      <span className="mnl-dim mt-1 block text-carbon-500">
        NO CATALOG ROW FOR {modelLabel.toUpperCase()}
      </span>
    ) : (
      <div className="mt-3 border border-carbon-150 bg-bone-200 px-3 py-2">
        <p className="mnl-dim text-carbon-500">{repairType}</p>
        <p className="mt-1 text-xs leading-relaxed text-carbon-700">
          No catalog row for {modelLabel}. Quote from the bench after
          inspection.
        </p>
      </div>
    );
  }

  if (compact) {
    if (quotes.length > 0) {
      const cheapest = quotes[0];
      return (
        <span className="mnl-num mt-1 block text-[0.6875rem] text-signal-600">
          {formatAud(cheapest.sellPrice)}
          <span className="mnl-dim ml-1.5 text-carbon-500">
            {qualityLabel(cheapest.quality).toUpperCase()}
            {quotes.length > 1 ? ` +${quotes.length - 1} TIER` : ""}
          </span>
        </span>
      );
    }
    if (!band) return null;
    return (
      <span className="mnl-num mt-1 block text-[0.6875rem] text-signal-600">
        {formatAud(band.min)} – {formatAud(band.max)}
        <span className="mnl-dim ml-1.5 text-carbon-500">RANGE</span>
      </span>
    );
  }

  if (quotes.length > 0) {
    return (
      <div className="mt-3 border border-signal-500 bg-signal-100">
        <p className="mnl-dim flex items-center justify-between border-b border-signal-500/40 px-3 py-1.5 text-signal-600">
          <span className="truncate">{repairType}</span>
          <span className="shrink-0 text-carbon-500">{modelLabel}</span>
        </p>
        <ul className="divide-y divide-signal-500/30">
          {quotes.map((q) => {
            const detail = (
              <>
                <span className="min-w-0">
                  <span className="block truncate font-mono text-[0.6875rem] font-semibold text-carbon-950">
                    {qualityLabel(q.quality)}
                  </span>
                  <span className="mnl-dim text-carbon-500">
                    {warrantyLabel(q.warrantyDays)} · STOCK {q.stockQty}
                  </span>
                </span>
                <span className="mnl-num shrink-0 text-base leading-none text-carbon-950">
                  {formatAud(q.sellPrice)}
                </span>
              </>
            );
            return (
              <li key={q.id}>
                {onConfirmQuote ? (
                  <button
                    type="button"
                    onClick={() => onConfirmQuote(q)}
                    className="flex w-full items-baseline justify-between gap-3 px-3 py-1.5 text-left transition-colors hover:bg-signal-500/20 focus:outline-none focus-visible:ring-2 focus-visible:ring-signal-600"
                    aria-label={`Confirm ${qualityLabel(q.quality)} at ${formatAud(q.sellPrice)} and start intake`}
                  >
                    {detail}
                  </button>
                ) : (
                  <span className="flex items-baseline justify-between gap-3 px-3 py-1.5">
                    {detail}
                  </span>
                )}
              </li>
            );
          })}
        </ul>
        {onConfirmQuote ? (
          <p className="mnl-dim border-t border-signal-500/40 px-3 py-1.5 text-carbon-500">
            PICK A TIER TO CONFIRM THE PART &amp; CHECK THE DEVICE IN
          </p>
        ) : null}
      </div>
    );
  }

  if (!band) return null;
  return (
    <div className="mt-3 border border-carbon-150 bg-bone-200 px-3 py-2">
      <p className="mnl-dim flex items-center justify-between text-carbon-500">
        <span>{repairType}</span>
        <span>RANGE ONLY</span>
      </p>
      <p className="mnl-num mt-1 text-lg leading-none text-carbon-950">
        {formatAud(band.min)} – {formatAud(band.max)}
      </p>
      <p className="mnl-dim mt-1.5 text-carbon-500">
        Across {band.count} rows · pick a model above for the exact price
      </p>
    </div>
  );
}
