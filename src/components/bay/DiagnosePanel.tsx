"use client";

// ---------------------------------------------------------------------------
// DIAGNOSE tabpanel — the guided fault-trace wizard UI. Pure DOM (no three
// imports); lives in the BOM inspector column. Structure mirrors the PARTS
// tab: scrollable body + pinned footer so the CTA never overflows the
// max-h-[560px] column.
// ---------------------------------------------------------------------------

import { useEffect, useRef } from "react";
import Link from "next/link";
import type { Diagnosis } from "./useDiagnosis";
import type { Likelihood } from "./diagnostics/types";
import StaffPriceTag from "./StaffPriceTag";
import type { PartPricing } from "./StaffPriceTag";

const RANK_LABEL: Record<Likelihood, string> = {
  primary: "PRIMARY",
  likely: "LIKELY",
  possible: "POSSIBLE",
};

export default function DiagnosePanel({
  diag,
  partName,
  selected,
  onPickSuspect,
  onHoverSuspect,
  partPrice,
  onCheckIn,
}: {
  diag: Diagnosis;
  /** Resolve a partId to its display name (from the device's parts). */
  partName: (id: string) => string;
  selected: string | null;
  onPickSuspect: (partId: string) => void;
  onHoverSuspect: (partId: string | null) => void;
  /** Staff-only pricing for a suspect part; empty for public visitors. */
  partPrice: (partId: string) => PartPricing;
  /** Set for a staff session: check the device in instead of quoting it. */
  onCheckIn?: () => void;
}) {
  const headingRef = useRef<HTMLHeadingElement>(null);

  // Move focus to the heading only on IN-PANEL transitions (answering a
  // question, reaching a verdict) — NOT on the menu/loading phases, so a
  // device switch (which resets to loading→menu) never yanks focus off the
  // device chip the user just activated.
  useEffect(() => {
    if (diag.phase === "asking" || diag.phase === "verdict") {
      headingRef.current?.focus({ preventScroll: false });
    }
  }, [diag.phase, diag.question, diag.verdict]);

  return (
    <div
      role="tabpanel"
      id="bay-panel-diagnose"
      aria-labelledby="bay-tab-diagnose"
      className="flex min-h-0 flex-1 flex-col"
    >
      {/* Focus moves to each new heading (SRs read it on focus), so the region
          itself is NOT aria-live — that would double-announce. */}
      <div className="min-h-0 flex-1 overflow-y-auto p-4">
        {diag.phase === "loading" && (
          <p className="mnl-dim text-carbon-500">LOADING FAULT TREES…</p>
        )}

        {diag.phase === "error" && (
          <p className="font-mono text-xs leading-relaxed text-rose-600">
            Fault trees failed to load — refresh to retry.
          </p>
        )}

        {diag.phase === "menu" && (
          <>
            <p className="mnl-dim text-carbon-500">FAULT TRACE · START</p>
            <h3
              ref={headingRef}
              tabIndex={-1}
              className="mnl-title mt-2 text-sm text-carbon-950 outline-none"
            >
              What&apos;s the device doing?
            </h3>
            <div className="mt-4 flex flex-col gap-2">
              {diag.symptoms.map((s) => (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => diag.start(s.id)}
                  className="mnl-chip w-full justify-between text-left normal-case tracking-normal"
                >
                  <span className="flex min-w-0 flex-col">
                    <span className="font-semibold">{s.label}</span>
                    {s.tagline ? (
                      <span className="mt-0.5 text-[0.625rem] font-normal text-carbon-500">
                        {s.tagline}
                      </span>
                    ) : null}
                  </span>
                  <span className="mnl-dim shrink-0 text-signal-600" aria-hidden="true">
                    ▸
                  </span>
                </button>
              ))}
            </div>
          </>
        )}

        {diag.phase === "asking" && diag.question && (
          <>
            <p className="mnl-dim text-carbon-500">
              FAULT TRACE · STEP {String(diag.step).padStart(2, "0")}
            </p>
            <h3
              ref={headingRef}
              tabIndex={-1}
              className="mnl-title mt-2 text-sm leading-snug text-carbon-950 outline-none"
            >
              {diag.question.question}
            </h3>
            {diag.question.help ? (
              <p className="mt-2 text-xs leading-relaxed text-carbon-500">
                {diag.question.help}
              </p>
            ) : null}
            <div className="mt-4 flex flex-col gap-2" role="group" aria-label="Answers">
              {diag.question.options.map((o) => (
                <button
                  key={o.id}
                  type="button"
                  onClick={() => diag.answer(o.id)}
                  className="mnl-chip w-full justify-between text-left normal-case tracking-normal"
                >
                  <span className="flex min-w-0 flex-col">
                    <span className="font-semibold">{o.label}</span>
                    {o.hint ? (
                      <span className="mt-0.5 text-[0.625rem] font-normal text-carbon-500">
                        {o.hint}
                      </span>
                    ) : null}
                  </span>
                  <span className="mnl-dim shrink-0 text-signal-600" aria-hidden="true">
                    ▸
                  </span>
                </button>
              ))}
            </div>
          </>
        )}

        {diag.phase === "verdict" && diag.verdict && (
          <>
            {diag.verdict.urgent ? (
              <p className="mb-3 border border-rose-500/70 bg-rose-50 px-3 py-2 font-mono text-[0.6875rem] font-semibold uppercase tracking-[0.1em] text-rose-700">
                ⚠ Safety first — see below
              </p>
            ) : null}
            <p className="mnl-dim text-signal-600">VERDICT</p>
            <h3
              ref={headingRef}
              tabIndex={-1}
              className="mnl-title mt-1.5 text-sm text-carbon-950 outline-none"
            >
              {diag.verdict.title}
            </h3>
            <p className="mt-2.5 text-xs leading-relaxed text-carbon-700">
              {diag.verdict.summary}
            </p>

            <p className="mnl-dim mt-4 border-t border-carbon-150 pt-3 text-carbon-500">
              SUSPECT COMPONENTS
            </p>
            <ul className="mt-2 space-y-1.5">
              {diag.verdict.suspects.map((s, i) => {
                const first = s.partIds[0];
                const isSel = s.partIds.includes(selected ?? "");
                const label =
                  s.label ?? s.partIds.map((p) => partName(p)).join(" + ");
                return (
                  <li key={first}>
                    <button
                      type="button"
                      aria-current={isSel ? "true" : undefined}
                      onClick={() => onPickSuspect(first)}
                      onMouseEnter={() => onHoverSuspect(first)}
                      onMouseLeave={() => onHoverSuspect(null)}
                      onFocus={() => onHoverSuspect(first)}
                      onBlur={() => onHoverSuspect(null)}
                      className={`w-full border px-3 py-2 text-left transition-colors ${
                        s.likelihood === "primary"
                          ? "border-signal-500 bg-signal-100"
                          : "border-carbon-150 hover:bg-bone-200"
                      } ${isSel ? "ring-1 ring-signal-500" : ""}`}
                    >
                      <span className="flex items-baseline gap-2">
                        <span className="mnl-dim mnl-num shrink-0 text-signal-600">
                          {String(i + 1).padStart(2, "0")}
                        </span>
                        <span className="min-w-0 flex-1 truncate font-mono text-xs font-semibold text-carbon-950">
                          {label}
                        </span>
                        <span className="mnl-dim shrink-0 text-carbon-500">
                          {RANK_LABEL[s.likelihood]}
                        </span>
                      </span>
                      <span className="mt-1 block text-[0.6875rem] leading-relaxed text-carbon-700">
                        {s.why}
                      </span>
                      <StaffPriceTag pricing={partPrice(first)} compact />
                    </button>
                  </li>
                );
              })}
            </ul>

            {diag.verdict.relatedIcs?.length ? (
              <div className="mt-4 border-t border-carbon-150 pt-3">
                <p className="mnl-dim text-carbon-500">BOARD-LEVEL TRAIL</p>
                {diag.verdict.relatedIcs.map((l) => (
                  <p
                    key={l.icId}
                    className="mt-1.5 text-[0.6875rem] leading-relaxed text-carbon-700"
                  >
                    <a href="#circuit" className="mnl-link text-carbon-950">
                      ▸ {l.icId.toUpperCase()}
                    </a>{" "}
                    {l.note}
                  </p>
                ))}
              </div>
            ) : null}
          </>
        )}
      </div>

      {/* Pinned footer */}
      <div className="flex shrink-0 gap-2 border-t border-carbon-950 p-3">
        {diag.phase === "verdict" ? (
          <>
            {onCheckIn ? (
              <button
                type="button"
                className="mnl-btn mnl-btn-sm flex-1"
                onClick={onCheckIn}
              >
                Check this device in →
              </button>
            ) : (
              <Link href="/quote" className="mnl-btn mnl-btn-sm flex-1">
                Get this fixed →
              </Link>
            )}
            <button type="button" className="mnl-chip" onClick={diag.restart}>
              ⟲ Again
            </button>
          </>
        ) : (
          <>
            <button
              type="button"
              className="mnl-chip"
              disabled={!diag.canGoBack}
              onClick={diag.back}
            >
              ← Back
            </button>
            <button
              type="button"
              className="mnl-chip"
              disabled={diag.phase === "menu"}
              onClick={diag.restart}
            >
              ⟲ Restart
            </button>
          </>
        )}
      </div>
    </div>
  );
}
