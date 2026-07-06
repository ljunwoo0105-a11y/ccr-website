/**
 * Public-site formatting helpers. Warranty is always described in words —
 * part prices never appear anywhere on the public site.
 */

/** 365 → "Up to 12 months", 180 → "Up to 6 months", 90 → "90 days". */
export function warrantyWords(days: number): string {
  if (days >= 365) return "Up to 12 months";
  if (days >= 180) return `Up to ${Math.round(days / 30)} months`;
  return `${days} days`;
}
