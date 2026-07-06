import { BUSINESS } from "@/lib/config";

/**
 * Kiosk hours helpers (Australia/Brisbane — no DST). Pure functions usable on
 * either side; the "OPEN NOW" pulse should be applied client-side after mount
 * (the marketing pages are ISR-cached, so server output can be up to an hour
 * stale — fine for the today-row highlight, not for open/closed state).
 */

const TIME_ZONE = "Australia/Brisbane";

/** Index into BUSINESS.hours for a JS day (0 = Sunday … 6 = Saturday). */
const DAY_TO_ROW: Record<number, number> = {
  0: 4, // Sunday
  1: 0, // Mon – Wed
  2: 0,
  3: 0,
  4: 1, // Thursday
  5: 2, // Friday
  6: 3, // Saturday
};

export function getBrisbaneNow(date = new Date()): {
  day: number;
  minutes: number;
} {
  const parts = new Intl.DateTimeFormat("en-AU", {
    timeZone: TIME_ZONE,
    weekday: "short",
    hour: "numeric",
    minute: "numeric",
    hour12: false,
  }).formatToParts(date);
  const get = (type: string) =>
    parts.find((p) => p.type === type)?.value ?? "";
  const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const day = Math.max(0, dayNames.indexOf(get("weekday").slice(0, 3)));
  const hour = Number(get("hour")) % 24;
  const minutes = hour * 60 + Number(get("minute"));
  return { day, minutes };
}

/** Parse "9:00am" / "5:30pm" into minutes since midnight. */
export function parseTime(value: string): number {
  const match = /^(\d{1,2}):(\d{2})\s*(am|pm)$/i.exec(value.trim());
  if (!match) return 0;
  let hour = Number(match[1]) % 12;
  if (match[3].toLowerCase() === "pm") hour += 12;
  return hour * 60 + Number(match[2]);
}

export type HoursStatus = {
  /** Index of today's row in BUSINESS.hours. */
  todayRow: number;
  isOpenNow: boolean;
  /** e.g. "5:30pm" — today's closing time. */
  closesAt: string;
  /** e.g. "9:00am" — today's opening time. */
  opensAt: string;
};

export function getHoursStatus(date = new Date()): HoursStatus {
  const { day, minutes } = getBrisbaneNow(date);
  const todayRow = DAY_TO_ROW[day] ?? 0;
  const row = BUSINESS.hours[todayRow];
  const open = parseTime(row.open);
  const close = parseTime(row.close);
  return {
    todayRow,
    isOpenNow: minutes >= open && minutes < close,
    closesAt: row.close,
    opensAt: row.open,
  };
}
