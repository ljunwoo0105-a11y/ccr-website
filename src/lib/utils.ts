import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatAud(amount: number): string {
  return new Intl.NumberFormat("en-AU", {
    style: "currency",
    currency: "AUD",
    currencyDisplay: "code",
    minimumFractionDigits: amount % 1 === 0 ? 0 : 2,
  })
    .format(amount)
    .replace(/\u00a0/g, " ");
}

/**
 * Net price after a discount. type "PERCENT" takes value% off (capped at
 * 100); "AMOUNT" takes a flat dollar value off. Never goes below 0, rounded to
 * cents. No/zero discount returns the original price. Shared by the quote
 * builder (display) and the server (authoritative total).
 */
export function applyDiscount(
  price: number,
  type: string | null | undefined,
  value: number | null | undefined
): number {
  if (!type || value == null || value <= 0) return price;
  let net = price;
  if (type === "PERCENT") net = price * (1 - Math.min(value, 100) / 100);
  else if (type === "AMOUNT") net = price - value;
  net = Math.max(0, net);
  return Math.round(net * 100) / 100;
}

/** "50% off" / "$20 off" / "" — human label for a line discount. */
export function discountLabel(
  type: string | null | undefined,
  value: number | null | undefined
): string {
  if (!type || value == null || value <= 0) return "";
  if (type === "PERCENT") return `${value}% off`;
  return `${formatAud(value)} off`;
}

export function formatDate(d: Date | string | null | undefined): string {
  if (!d) return "—";
  return new Intl.DateTimeFormat("en-AU", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(d));
}

export function formatDateTime(d: Date | string | null | undefined): string {
  if (!d) return "—";
  return new Intl.DateTimeFormat("en-AU", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(d));
}
