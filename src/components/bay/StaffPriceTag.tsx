"use client";

// ---------------------------------------------------------------------------
// The staff-only price band shown against a bay part or a diagnosis suspect.
// Renders nothing at all when there is no band, so a public visitor and a
// staff member looking at unpriced bench work see exactly the same markup.
// ---------------------------------------------------------------------------

import { formatAud } from "@/lib/utils";
import type { PriceBand } from "./useStaffPrices";

export default function StaffPriceTag({
  repairType,
  band,
  compact = false,
}: {
  readonly repairType: string | null;
  readonly band: PriceBand | null;
  /** Tighter single-line form for the diagnosis suspect list. */
  readonly compact?: boolean;
}) {
  if (!repairType || !band) return null;

  const range =
    band.min === band.max
      ? formatAud(band.min)
      : `${formatAud(band.min)} – ${formatAud(band.max)}`;

  if (compact) {
    return (
      <span className="mnl-num mt-1 block text-[0.6875rem] text-signal-600">
        {range}
        <span className="mnl-dim ml-1.5 text-carbon-500">STAFF</span>
      </span>
    );
  }

  return (
    <div className="mt-3 border border-signal-500 bg-signal-100 px-3 py-2">
      <p className="mnl-dim flex items-center justify-between text-signal-600">
        <span>{repairType}</span>
        <span className="text-carbon-500">STAFF PRICE</span>
      </p>
      <p className="mnl-num mt-1 text-lg leading-none text-carbon-950">
        {range}
      </p>
      <p className="mnl-dim mt-1.5 text-carbon-500">
        {band.count} catalog {band.count === 1 ? "row" : "rows"} · model &amp;
        tier dependent
      </p>
    </div>
  );
}
