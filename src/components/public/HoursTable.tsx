"use client";

import { useEffect, useState } from "react";
import { BUSINESS } from "@/lib/config";
import { getHoursStatus, type HoursStatus } from "@/lib/hours";
import { cn } from "@/lib/utils";

/**
 * Kiosk hours as a mono spec sheet. The open/closed status and the today-row
 * highlight are mount-gated: marketing pages are ISR-cached, so the server
 * renders all rows neutral and no status at all — the live state only appears
 * after hydration (no stale "OPEN NOW", no hydration mismatch).
 */
export default function HoursTable({ className }: { className?: string }) {
  const [status, setStatus] = useState<HoursStatus | null>(null);

  useEffect(() => {
    setStatus(getHoursStatus());
  }, []);

  return (
    <div
      className={cn(
        "rounded-lg border border-ink-700 bg-ink-800 p-6",
        className
      )}
    >
      <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2">
        <h3 className="mono-label text-ink-400">
          Kiosk hours
          <span className="sr-only">
            {" "}
            — {BUSINESS.name} at Orion Springfield Central
          </span>
        </h3>
        {status ? (
          status.isOpenNow ? (
            <span className="flex items-center gap-2">
              <span
                className="h-1.5 w-1.5 animate-status-pulse rounded-full bg-status-green"
                aria-hidden="true"
              />
              <span className="mono-label text-status-green">
                Open now · Closes {status.closesAt}
              </span>
            </span>
          ) : (
            <span className="mono-label text-ink-400">
              Opens {status.opensAt}
            </span>
          )
        ) : null}
      </div>

      <dl className="mt-5 space-y-1">
        {BUSINESS.hours.map((row, index) => {
          const isToday = status?.todayRow === index;
          return (
            <div
              key={row.days}
              className={cn(
                "leader-row py-2 font-mono text-[0.8125rem]",
                isToday && "-ml-3 border-l-2 border-gold-500 bg-ink-850 pl-3"
              )}
            >
              <dt
                className={cn(
                  "mono-label",
                  isToday ? "text-ink-50" : "text-ink-400"
                )}
              >
                {row.days}
              </dt>
              <dd className={cn("tnum", isToday ? "text-ink-50" : "text-ink-200")}>
                {row.open} – {row.close}
              </dd>
            </div>
          );
        })}
      </dl>

      <p className="mt-5 text-xs leading-relaxed text-ink-500">
        The kiosk follows Orion Springfield Central centre trading hours,
        including public holiday changes.
      </p>
    </div>
  );
}
