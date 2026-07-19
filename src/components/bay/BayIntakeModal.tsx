"use client";

// ---------------------------------------------------------------------------
// Walk-in intake, launched from the bay.
//
// Staff have no portal, so the counter's check-in has to happen here. This
// wraps the same IntakeForm the portal uses — the identical condition
// checklist, policy acknowledgements and signature — so a record filed from
// the landing page is the same legal record, not a lighter one. Only the
// completion behaviour differs: the portal opens the new intake, the bay
// confirms in place and lets staff file the next one.
// ---------------------------------------------------------------------------

import { useEffect, useRef, useState } from "react";
import { X } from "lucide-react";
import IntakeForm from "@/components/staff/IntakeForm";
import type { IntakePrefill } from "@/components/staff/intake/prefill";

export default function BayIntakeModal({
  prefill,
  deviceLabel,
  onClose,
}: {
  readonly prefill: IntakePrefill;
  /** "Apple iPhone 15 · Screen Replacement", for the dialog header. */
  readonly deviceLabel: string | null;
  readonly onClose: () => void;
}) {
  const [createdId, setCreatedId] = useState<string | null>(null);
  const closeRef = useRef<HTMLButtonElement>(null);

  // Escape closes; focus starts on the close control so keyboard users are
  // never dropped into a long form with no obvious way out.
  useEffect(() => {
    closeRef.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);

  // The bay's own scroll must not fight the dialog's.
  useEffect(() => {
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previous;
    };
  }, []);

  return (
    <div
      className="fixed inset-0 z-50 overflow-y-auto bg-carbon-950/70 p-4"
      role="dialog"
      aria-modal="true"
      aria-label="Walk-in repair intake"
    >
      <div className="mx-auto w-full max-w-3xl border border-carbon-950 bg-bone-100 shadow-hard-lg">
        <div className="flex items-start justify-between gap-4 border-b border-carbon-950 bg-bone-200 px-5 py-3">
          <div className="min-w-0">
            <p className="mnl-dim text-signal-600">WALK-IN INTAKE</p>
            <h2 className="mnl-title mt-0.5 truncate text-base text-carbon-950">
              {deviceLabel ?? "Device check-in"}
            </h2>
          </div>
          <button
            ref={closeRef}
            type="button"
            onClick={onClose}
            className="shrink-0 p-1.5 text-carbon-500 transition hover:bg-bone-100 hover:text-carbon-950"
            aria-label="Close intake form"
          >
            <X className="h-5 w-5" aria-hidden="true" />
          </button>
        </div>

        <div className="p-5">
          {createdId ? (
            <div className="py-6 text-center">
              <p className="mnl-dim text-signal-600">INTAKE FILED</p>
              <h3 className="mnl-title mt-1.5 text-lg text-carbon-950">
                Device checked in
              </h3>
              <p className="mnl-num mt-2 text-sm text-carbon-700">
                {createdId}
              </p>
              <p className="mt-2 text-xs leading-relaxed text-carbon-500">
                The condition record and signed acknowledgements are saved.
                An admin can open it in the portal.
              </p>
              <div className="mt-5 flex justify-center gap-2">
                <button
                  type="button"
                  className="mnl-btn mnl-btn-sm"
                  onClick={() => setCreatedId(null)}
                >
                  File another
                </button>
                <button type="button" className="mnl-chip" onClick={onClose}>
                  Done
                </button>
              </div>
            </div>
          ) : (
            <IntakeForm
              prefill={prefill}
              onCreated={setCreatedId}
              onCancel={onClose}
            />
          )}
        </div>
      </div>
    </div>
  );
}
