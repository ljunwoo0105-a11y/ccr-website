/**
 * Presentation helpers shared by staff server pages and client components.
 * Pure functions only — safe to import anywhere.
 */

const BADGE_BASE =
  "inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold";

export function intakeStatusBadge(status: string): string {
  const tone =
    status === "CHECKED_IN"
      ? "bg-sky-100 text-sky-800"
      : status === "IN_REPAIR"
        ? "bg-amber-100 text-amber-800"
        : status === "READY"
          ? "bg-emerald-100 text-emerald-800"
          : status === "COLLECTED"
            ? "bg-slate-200 text-slate-700"
            : status === "CANCELLED"
              ? "bg-rose-100 text-rose-800"
              : "bg-slate-100 text-slate-700";
  return `${BADGE_BASE} ${tone}`;
}

export function leadStatusBadge(status: string): string {
  const tone =
    status === "NEW"
      ? "bg-orange-100 text-orange-800"
      : status === "EMAILED"
        ? "bg-sky-100 text-sky-800"
        : status === "CONTACTED"
          ? "bg-violet-100 text-violet-800"
          : status === "BOOKED"
            ? "bg-emerald-100 text-emerald-800"
            : "bg-slate-200 text-slate-700";
  return `${BADGE_BASE} ${tone}`;
}

export function qualityBadge(quality: string): string {
  const tone =
    quality === "GENUINE"
      ? "bg-emerald-100 text-emerald-800"
      : quality === "OEM"
        ? "bg-sky-100 text-sky-800"
        : quality === "PREMIUM"
          ? "bg-violet-100 text-violet-800"
          : "bg-slate-200 text-slate-700";
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
  if (pct < 45) return "text-amber-600";
  return "text-emerald-600";
}

export function stockBadge(qty: number): string {
  if (qty <= 0) return `${BADGE_BASE} bg-rose-100 text-rose-800`;
  if (qty <= 1) return `${BADGE_BASE} bg-amber-100 text-amber-800`;
  return `${BADGE_BASE} bg-slate-100 text-slate-700`;
}
