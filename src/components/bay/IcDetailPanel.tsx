"use client";

// ---------------------------------------------------------------------------
// IC detail overlay for the circuit sheet — opaque drawn plate inside the
// fixed-height board shell. Right column at sm+, bottom sheet on mobile.
// Tabs: SUMMARY (customer copy) / TECH (service-manual notes + symptoms).
// ---------------------------------------------------------------------------

import { useEffect, useRef } from "react";
import Link from "next/link";
import type { BoardIc } from "./board-data";

export default function IcDetailPanel({
  ic,
  tab,
  onTab,
  onClose,
}: {
  ic: BoardIc;
  tab: "summary" | "tech";
  onTab: (t: "summary" | "tech") => void;
  onClose: () => void;
}) {
  const panelRef = useRef<HTMLDivElement>(null);

  // Focus the panel when it opens / switches IC so keyboard users land in it.
  useEffect(() => {
    panelRef.current?.focus({ preventScroll: true });
  }, [ic.id]);

  return (
    <div
      ref={panelRef}
      role="region"
      aria-label={`${ic.ref} — ${ic.name}`}
      tabIndex={-1}
      onKeyDown={(e) => {
        if (e.key === "Escape") onClose();
      }}
      className="mnl-plate-flat shadow-hard absolute inset-x-3 bottom-3 z-30 flex max-h-[58%] flex-col overflow-hidden bg-bone-50 outline-none sm:inset-x-auto sm:bottom-3 sm:right-3 sm:top-3 sm:w-[268px] sm:max-h-none"
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-2 border-b border-carbon-950 px-3 py-2.5">
        <div className="min-w-0">
          <p className="mnl-dim text-signal-600">{ic.ref}</p>
          <h3 className="mnl-title mt-0.5 truncate text-sm text-carbon-950">
            {ic.name}
          </h3>
        </div>
        <button
          type="button"
          className="mnl-chip shrink-0 px-2 py-1"
          onClick={onClose}
          aria-label="Close component details"
        >
          ✕
        </button>
      </div>

      {/* Tabs */}
      <div
        className="flex gap-1.5 border-b border-carbon-150 px-3 py-2"
        role="tablist"
        aria-label="Detail level"
      >
        <button
          type="button"
          role="tab"
          id="ic-tab-summary"
          aria-selected={tab === "summary"}
          aria-controls="ic-tabpanel"
          data-active={tab === "summary"}
          className="mnl-chip px-2.5 py-1"
          onClick={() => onTab("summary")}
        >
          Summary
        </button>
        <button
          type="button"
          role="tab"
          id="ic-tab-tech"
          aria-selected={tab === "tech"}
          aria-controls="ic-tabpanel"
          data-active={tab === "tech"}
          className="mnl-chip px-2.5 py-1"
          onClick={() => onTab("tech")}
        >
          Tech
        </button>
      </div>

      {/* Body */}
      <div
        id="ic-tabpanel"
        role="tabpanel"
        aria-labelledby={tab === "summary" ? "ic-tab-summary" : "ic-tab-tech"}
        className="min-h-0 flex-1 overflow-y-auto p-3"
      >
        {tab === "summary" ? (
          <>
            <p className="text-xs leading-relaxed text-carbon-700">
              {ic.summary}
            </p>
            <p className="mnl-dim mt-3 border-t border-carbon-150 pt-2.5 text-carbon-500">
              POINTS TO THIS CHIP
            </p>
            <ul className="mt-1.5 space-y-1">
              {ic.symptoms.map((s) => (
                <li
                  key={s}
                  className="flex items-baseline gap-2 text-[0.6875rem] leading-relaxed text-carbon-700"
                >
                  <span className="mnl-dim shrink-0 text-signal-600">▸</span>
                  {s}
                </li>
              ))}
            </ul>
          </>
        ) : (
          <>
            <p className="mnl-dim text-carbon-500">TECH NOTES</p>
            <ul className="mt-1.5 space-y-1.5">
              {ic.tech.map((t) => (
                <li
                  key={t}
                  className="font-mono text-[11px] leading-relaxed text-carbon-700"
                >
                  <span className="mr-1 text-signal-600">▸</span>
                  {t}
                </li>
              ))}
            </ul>
          </>
        )}
      </div>

      {/* Pinned CTA */}
      <div className="shrink-0 border-t border-carbon-950 p-2.5">
        <Link href="/quote" className="mnl-btn mnl-btn-sm w-full">
          Book a board-level assessment →
        </Link>
      </div>
    </div>
  );
}
