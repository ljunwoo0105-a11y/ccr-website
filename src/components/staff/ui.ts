/**
 * Presentation helpers shared by staff server pages and client components.
 * Pure functions only — safe to import anywhere.
 */

// Manifold drafting tag: squared, bordered, mono uppercase — matches the
// public site's PASS/sheet tags. Functional status hues are kept but toned to
// sit on bone paper (soft fill, inked border + text).
const BADGE_BASE =
  "inline-flex items-center border px-2 py-0.5 font-mono text-[0.625rem] font-semibold uppercase tracking-[0.08em]";

const TONE = {
  signal: "border-signal-500 bg-signal-100 text-signal-600",
  green: "border-emerald-600/60 bg-emerald-50 text-emerald-700",
  sky: "border-sky-500/60 bg-sky-50 text-sky-700",
  violet: "border-violet-500/60 bg-violet-50 text-violet-700",
  rose: "border-rose-500/70 bg-rose-50 text-rose-700",
  neutral: "border-carbon-200 bg-bone-200 text-carbon-700",
} as const;

export function intakeStatusBadge(status: string): string {
  const tone =
    status === "CHECKED_IN"
      ? TONE.sky
      : status === "IN_REPAIR"
        ? TONE.signal
        : status === "READY"
          ? TONE.green
          : status === "CANCELLED"
            ? TONE.rose
            : TONE.neutral;
  return `${BADGE_BASE} ${tone}`;
}

export function leadStatusBadge(status: string): string {
  const tone =
    status === "NEW"
      ? TONE.signal
      : status === "EMAILED"
        ? TONE.sky
        : status === "CONTACTED"
          ? TONE.violet
          : status === "BOOKED"
            ? TONE.green
            : TONE.neutral;
  return `${BADGE_BASE} ${tone}`;
}

export function qualityBadge(quality: string): string {
  const tone =
    quality === "GENUINE"
      ? TONE.green
      : quality === "OEM"
        ? TONE.sky
        : quality === "PREMIUM"
          ? TONE.violet
          : TONE.neutral;
  return `${BADGE_BASE} ${tone}`;
}

/** "CHECKED_IN" → "Checked in" */
export function statusLabel(status: string): string {
  const lower = status.replaceAll("_", " ").toLowerCase();
  return lower.charAt(0).toUpperCase() + lower.slice(1);
}

/** 365 → "12 mo", 180 → "6 mo", 90 → "90 days" */
export function warrantyLabel(days: number): string {
  if (days >= 360) return `${Math.round(days / 30.4)} mo`;
  if (days >= 180 && days % 30 === 0) return `${days / 30} mo`;
  return `${days} days`;
}

/** Gross margin % = (sell - cost) / sell. Null when sell is 0. */
export function marginPct(cost: number, sell: number): number | null {
  if (sell <= 0) return null;
  return ((sell - cost) / sell) * 100;
}

export function marginTone(pct: number): string {
  if (pct < 30) return "text-rose-600";
  if (pct < 45) return "text-signal-600";
  return "text-emerald-600";
}

export function stockBadge(qty: number): string {
  if (qty <= 0) return `${BADGE_BASE} ${TONE.rose}`;
  if (qty <= 1) return `${BADGE_BASE} ${TONE.signal}`;
  return `${BADGE_BASE} ${TONE.neutral}`;
}
