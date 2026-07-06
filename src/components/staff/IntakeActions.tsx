"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2, Loader2, Printer, Wrench, XCircle } from "lucide-react";
import type { ApiEnvelope } from "@/components/staff/types";

interface Props {
  id: string;
  status: string;
}

export default function IntakeActions({ id, status }: Props) {
  const router = useRouter();
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function setStatus(next: string, confirmMessage?: string) {
    if (confirmMessage && !window.confirm(confirmMessage)) return;
    setError(null);
    setBusy(next);
    try {
      const res = await fetch(`/api/staff/intakes/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: next }),
      });
      const json = (await res.json()) as ApiEnvelope<unknown>;
      if (!res.ok || !json.ok) {
        setError(json.error ?? "Could not update the status");
        return;
      }
      router.refresh();
    } catch {
      setError("Network error — try again");
    } finally {
      setBusy(null);
    }
  }

  const open = status !== "COLLECTED" && status !== "CANCELLED";

  return (
    <div className="print:hidden">
      {error && (
        <p
          role="alert"
          className="mb-3 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700"
        >
          {error}
        </p>
      )}
      <div className="flex flex-wrap gap-2">
        {status === "CHECKED_IN" && (
          <button
            type="button"
            className="btn-secondary px-4 py-2.5"
            disabled={busy !== null}
            onClick={() => void setStatus("IN_REPAIR")}
          >
            {busy === "IN_REPAIR" ? (
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
            ) : (
              <Wrench className="h-4 w-4" aria-hidden />
            )}
            Start repair
          </button>
        )}
        {status === "IN_REPAIR" && (
          <button
            type="button"
            className="btn-secondary px-4 py-2.5"
            disabled={busy !== null}
            onClick={() => void setStatus("READY")}
          >
            {busy === "READY" ? (
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
            ) : (
              <CheckCircle2 className="h-4 w-4" aria-hidden />
            )}
            Mark ready
          </button>
        )}
        {status === "READY" && (
          <button
            type="button"
            className="btn-primary px-4 py-2.5"
            disabled={busy !== null}
            onClick={() => void setStatus("COLLECTED")}
          >
            {busy === "COLLECTED" ? (
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
            ) : (
              <CheckCircle2 className="h-4 w-4" aria-hidden />
            )}
            Collected
          </button>
        )}
        {open && (
          <button
            type="button"
            className="btn-ghost px-4 py-2.5 text-rose-600 hover:bg-rose-50"
            disabled={busy !== null}
            onClick={() =>
              void setStatus("CANCELLED", "Cancel this repair job?")
            }
          >
            {busy === "CANCELLED" ? (
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
            ) : (
              <XCircle className="h-4 w-4" aria-hidden />
            )}
            Cancel
          </button>
        )}
        <button
          type="button"
          className="btn-ghost px-4 py-2.5"
          onClick={() => window.print()}
        >
          <Printer className="h-4 w-4" aria-hidden />
          Print
        </button>
      </div>
    </div>
  );
}
