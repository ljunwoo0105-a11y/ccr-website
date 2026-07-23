"use client";

import { useEffect, useRef, useState } from "react";
import { FileUp, Loader2, X } from "lucide-react";
import { apiJson } from "@/lib/api-client";
import { cn } from "@/lib/utils";

/**
 * CSV price-list import. Two steps mirroring the server contract: upload →
 * preview (nothing written), then a single confirm applies the valid rows.
 * Error rows never block the rest — they are listed with line numbers so the
 * owner can fix the sheet and re-import just those.
 */

interface ImportRow {
  readonly line: number;
  readonly action: "create" | "update" | "error";
  readonly summary: string;
  readonly message?: string;
  readonly changes?: readonly string[];
}

interface ImportPayload {
  readonly mode: "preview" | "apply";
  readonly rows: readonly ImportRow[];
  readonly creates: number;
  readonly updates: number;
  readonly errors: number;
}

const TEMPLATE_CSV = [
  "deviceType,brand,model,repairType,quality,colour,costPrice,sellPrice,warrantyDays,stockQty,sku,supplier,notes",
  "Phone,Apple,iPhone 13,Screen Replacement,PREMIUM,,65,159,90,4,IP13-SCR-PREM,ExampleSupplier,",
  "Phone,Apple,iPhone 13,Screen Replacement,GENUINE,,120,249,365,2,IP13-SCR-GEN,ExampleSupplier,",
  "Phone,Samsung,Galaxy S22,Battery Replacement,OEM,,35,99,180,5,,,",
].join("\n");

export default function PartImportModal({
  onDone,
  onClose,
}: {
  /** Called after a successful apply so the catalog can reload. */
  readonly onDone: (notice: string) => void;
  readonly onClose: () => void;
}) {
  const [csv, setCsv] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const [preview, setPreview] = useState<ImportPayload | null>(null);
  const [busy, setBusy] = useState<"preview" | "apply" | null>(null);
  const [error, setError] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  async function submit(mode: "preview" | "apply", text: string) {
    setBusy(mode);
    setError(null);
    try {
      const res = await fetch("/api/admin/parts/import", apiJson("POST", { csv: text, mode }));
      const body = (await res.json()) as {
        ok?: boolean;
        error?: string;
        data?: ImportPayload;
      };
      if (!res.ok || !body.ok || !body.data) {
        setError(body.error ?? "Could not read the file.");
        setPreview(null);
        return;
      }
      if (mode === "preview") {
        setPreview(body.data);
      } else {
        onDone(
          `Imported: ${body.data.creates} new part${body.data.creates === 1 ? "" : "s"}, ${body.data.updates} updated${body.data.errors > 0 ? `, ${body.data.errors} row${body.data.errors === 1 ? "" : "s"} skipped` : ""}.`
        );
      }
    } catch {
      setError("Network error — try again.");
    } finally {
      setBusy(null);
    }
  }

  function handleFile(file: File | undefined) {
    if (!file) return;
    setFileName(file.name);
    setPreview(null);
    setError(null);
    const reader = new FileReader();
    reader.onload = () => {
      const text = String(reader.result ?? "");
      setCsv(text);
      void submit("preview", text);
    };
    reader.onerror = () => setError("Could not read the file.");
    reader.readAsText(file);
  }

  function downloadTemplate() {
    const blob = new Blob([TEMPLATE_CSV], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "ccr-pricelist-template.csv";
    link.click();
    URL.revokeObjectURL(url);
  }

  const applicable = preview ? preview.creates + preview.updates : 0;

  return (
    <div
      className="fixed inset-0 z-50 overflow-y-auto bg-carbon-950/60 p-4"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Import price list"
        className="mx-auto flex max-h-[88vh] w-full max-w-2xl flex-col border border-carbon-950 bg-bone-50 shadow-hard-lg"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-4 border-b border-carbon-150 px-5 py-4">
          <div>
            <h2 className="text-base font-semibold text-carbon-950">
              Import price list
            </h2>
            <p className="mt-0.5 text-xs text-carbon-500">
              CSV with columns: deviceType, brand, model, repairType, quality,
              costPrice, sellPrice — plus optional colour, warrantyDays,
              stockQty, sku, supplier, notes, active.{" "}
              <button
                type="button"
                onClick={downloadTemplate}
                className="font-medium text-signal-600 underline-offset-2 hover:underline"
              >
                Download template
              </button>
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close import"
            className="shrink-0 p-1 text-carbon-500 hover:text-carbon-950"
          >
            <X className="h-4 w-4" aria-hidden />
          </button>
        </div>

        <div className="flex-1 space-y-4 overflow-y-auto px-5 py-4">
          <div className="flex flex-wrap items-center gap-3">
            <input
              ref={fileRef}
              type="file"
              accept=".csv,text/csv,text/plain"
              className="hidden"
              onChange={(event) => handleFile(event.target.files?.[0])}
            />
            <button
              type="button"
              className="btn-secondary inline-flex items-center gap-2 px-3 py-2 text-sm"
              disabled={busy !== null}
              onClick={() => fileRef.current?.click()}
            >
              <FileUp className="h-4 w-4" aria-hidden />
              {fileName ? "Choose a different file" : "Choose CSV file"}
            </button>
            {fileName ? (
              <span className="font-mono text-xs text-carbon-600">{fileName}</span>
            ) : null}
            {busy === "preview" ? (
              <span className="inline-flex items-center gap-2 text-sm text-carbon-600">
                <Loader2 className="h-4 w-4 animate-spin text-signal-600" aria-hidden />
                Checking file…
              </span>
            ) : null}
          </div>

          {error ? (
            <p role="alert" className="border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
              {error}
            </p>
          ) : null}

          {preview ? (
            <>
              <div className="flex flex-wrap gap-4 border border-carbon-150 bg-bone-100 px-4 py-3 text-sm">
                <span className="font-semibold text-emerald-700">
                  {preview.creates} new
                </span>
                <span className="font-semibold text-sky-700">
                  {preview.updates} updated
                </span>
                <span className={cn("font-semibold", preview.errors > 0 ? "text-rose-700" : "text-carbon-400")}>
                  {preview.errors} error row{preview.errors === 1 ? "" : "s"}
                </span>
                <span className="text-carbon-500">
                  Nothing has been written yet.
                </span>
              </div>

              <div className="max-h-72 overflow-y-auto border border-carbon-150">
                <table className="w-full text-left text-xs">
                  <thead className="sticky top-0 bg-bone-200 uppercase tracking-wide text-carbon-500">
                    <tr>
                      <th className="px-3 py-2 font-medium">Line</th>
                      <th className="px-3 py-2 font-medium">Action</th>
                      <th className="px-3 py-2 font-medium">Part</th>
                      <th className="px-3 py-2 font-medium">Detail</th>
                    </tr>
                  </thead>
                  <tbody>
                    {preview.rows.map((row) => (
                      <tr key={row.line} className="border-t border-carbon-150 align-top">
                        <td className="px-3 py-1.5 font-mono text-carbon-500">{row.line}</td>
                        <td className="px-3 py-1.5">
                          <span
                            className={cn(
                              "inline-flex rounded-full px-2 py-0.5 font-medium",
                              row.action === "create" && "bg-emerald-50 text-emerald-700",
                              row.action === "update" && "bg-sky-50 text-sky-700",
                              row.action === "error" && "bg-rose-50 text-rose-700"
                            )}
                          >
                            {row.action}
                          </span>
                        </td>
                        <td className="px-3 py-1.5 text-carbon-950">{row.summary}</td>
                        <td className="px-3 py-1.5 text-carbon-600">
                          {row.message ?? row.changes?.join(", ") ?? "—"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          ) : null}
        </div>

        <div className="flex items-center justify-end gap-3 border-t border-carbon-150 px-5 py-4">
          <button
            type="button"
            onClick={onClose}
            className="px-3 py-1.5 text-sm font-medium text-carbon-500 hover:text-carbon-950"
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={!preview || applicable === 0 || busy !== null || !csv}
            onClick={() => csv && void submit("apply", csv)}
            className="border border-carbon-950 bg-signal-500 px-4 py-1.5 text-sm font-semibold text-carbon-950 hover:bg-signal-400 disabled:opacity-50"
          >
            {busy === "apply"
              ? "Importing…"
              : `Import ${applicable} part${applicable === 1 ? "" : "s"}`}
          </button>
        </div>
      </div>
    </div>
  );
}
