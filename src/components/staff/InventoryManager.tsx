"use client";

import { useCallback, useEffect, useState } from "react";
import {
  AlertTriangle,
  Loader2,
  Minus,
  Plug,
  Plus,
  RefreshCw,
} from "lucide-react";
import { QUALITY_LABELS } from "@/lib/config";
import { qualityBadge, stockBadge } from "@/components/staff/ui";
import type {
  ApiEnvelope,
  PartRow,
  PosSyncResult,
} from "@/components/staff/types";

interface Props {
  /** POS_PROVIDER read server-side and passed down (env never hits the client). */
  provider: string;
}

export default function InventoryManager({ provider }: Props) {
  const [parts, setParts] = useState<PartRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<{
    ok: boolean;
    message: string;
  } | null>(null);
  const [syncing, setSyncing] = useState(false);
  const [syncResult, setSyncResult] = useState<PosSyncResult | null>(null);
  const [syncError, setSyncError] = useState<string | null>(null);

  const [savingId, setSavingId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/staff/parts?active=true");
      const json = (await res.json()) as ApiEnvelope<PartRow[]>;
      if (!res.ok || !json.ok || !json.data) {
        setError(json.error ?? "Could not load parts");
        setParts([]);
      } else {
        setParts(json.data);
      }
    } catch {
      setError("Network error — try again");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function testConnection() {
    setTesting(true);
    setTestResult(null);
    try {
      const res = await fetch("/api/staff/inventory/test");
      const json = (await res.json()) as ApiEnvelope<{
        ok: boolean;
        message: string;
      }>;
      if (res.ok && json.ok && json.data) {
        setTestResult(json.data);
      } else {
        setTestResult({
          ok: false,
          message: json.error ?? "Connection test failed",
        });
      }
    } catch {
      setTestResult({ ok: false, message: "Network error — try again" });
    } finally {
      setTesting(false);
    }
  }

  async function syncNow() {
    setSyncing(true);
    setSyncError(null);
    setSyncResult(null);
    try {
      const res = await fetch("/api/staff/inventory/sync", { method: "POST" });
      const json = (await res.json()) as ApiEnvelope<PosSyncResult>;
      if (!res.ok || !json.ok || !json.data) {
        setSyncError(json.error ?? "Sync failed");
      } else {
        setSyncResult(json.data);
        await load();
      }
    } catch {
      setSyncError("Network error — try again");
    } finally {
      setSyncing(false);
    }
  }

  async function updateStock(part: PartRow, nextQty: number) {
    const stockQty = Math.max(0, Math.round(nextQty));
    if (stockQty === part.stockQty) return;
    setSavingId(part.id);
    // Optimistic update; revert on failure.
    setParts((prev) =>
      prev.map((p) => (p.id === part.id ? { ...p, stockQty } : p))
    );
    try {
      const res = await fetch(`/api/staff/parts/${part.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ stockQty }),
      });
      const json = (await res.json()) as ApiEnvelope<PartRow>;
      if (!res.ok || !json.ok || !json.data) {
        setParts((prev) =>
          prev.map((p) => (p.id === part.id ? part : p))
        );
        setError(json.error ?? "Could not update stock");
      } else {
        const updated = json.data;
        setParts((prev) =>
          prev.map((p) => (p.id === updated.id ? updated : p))
        );
        setError(null);
      }
    } catch {
      setParts((prev) => prev.map((p) => (p.id === part.id ? part : p)));
      setError("Network error — try again");
    } finally {
      setSavingId(null);
    }
  }

  const lowStock = parts
    .filter((p) => p.stockQty <= 1)
    .sort((a, b) => a.stockQty - b.stockQty);

  return (
    <div className="space-y-6">
      {/* POS card */}
      <section className="card">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-sky-100 text-sky-700">
              <Plug className="h-5 w-5" aria-hidden />
            </span>
            <div>
              <h2 className="text-sm font-semibold text-slate-900">
                POS connection
              </h2>
              <p className="text-xs text-slate-500">
                Provider:{" "}
                <span className="font-semibold uppercase text-slate-700">
                  {provider}
                </span>
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              className="btn-ghost px-4 py-2"
              disabled={testing}
              onClick={() => void testConnection()}
            >
              {testing && (
                <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
              )}
              Test connection
            </button>
            <button
              type="button"
              className="btn-secondary px-4 py-2"
              disabled={syncing}
              onClick={() => void syncNow()}
            >
              {syncing ? (
                <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
              ) : (
                <RefreshCw className="h-4 w-4" aria-hidden />
              )}
              Sync now
            </button>
          </div>
        </div>

        {testResult && (
          <p
            className={
              testResult.ok
                ? "mt-3 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700"
                : "mt-3 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700"
            }
          >
            {testResult.message}
          </p>
        )}
        {syncError && (
          <p
            role="alert"
            className="mt-3 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700"
          >
            {syncError}
          </p>
        )}
        {syncResult && (
          <div className="mt-3 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700">
            <p>
              Synced from <span className="font-semibold">{syncResult.provider}</span>:{" "}
              {syncResult.itemsFetched} POS items fetched ·{" "}
              {syncResult.partsMatched} parts matched ·{" "}
              {syncResult.stockUpdated} stock levels updated ·{" "}
              <span
                className={
                  syncResult.unmatchedPosItems > 0
                    ? "font-semibold text-amber-700"
                    : undefined
                }
              >
                {syncResult.unmatchedPosItems} unmatched
              </span>
            </p>
            {syncResult.unmatchedPosItems > 0 && (
              <p className="mt-1 text-xs text-slate-500">
                Unmatched POS items are skipped — match parts by SKU or POS
                item id in the price list to include them.
              </p>
            )}
            {syncResult.errors.length > 0 && (
              <ul className="mt-1 list-inside list-disc text-xs text-rose-600">
                {syncResult.errors.map((err, i) => (
                  <li key={i}>{err}</li>
                ))}
              </ul>
            )}
          </div>
        )}
      </section>

      {error && (
        <p
          role="alert"
          className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700"
        >
          {error}
        </p>
      )}

      {/* Low stock */}
      <section className="card">
        <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold text-slate-900">
          <AlertTriangle className="h-4 w-4 text-amber-500" aria-hidden />
          Low stock (1 or fewer)
        </h2>
        {loading ? (
          <Loader2
            className="h-5 w-5 animate-spin text-ccr-primary"
            aria-hidden
          />
        ) : lowStock.length === 0 ? (
          <p className="text-sm text-slate-500">
            Nothing is running low. Nice.
          </p>
        ) : (
          <ul className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {lowStock.map((part) => (
              <li
                key={part.id}
                className="flex items-center justify-between gap-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm"
              >
                <span className="min-w-0">
                  <span className="block truncate font-medium text-slate-900">
                    {part.brand} {part.model}
                  </span>
                  <span className="block truncate text-xs text-slate-500">
                    {part.repairType}
                  </span>
                </span>
                <span className={stockBadge(part.stockQty)}>
                  {part.stockQty}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* Full stock table */}
      <section className="card overflow-hidden p-0">
        <div className="border-b border-slate-200 px-5 py-4">
          <h2 className="text-sm font-semibold text-slate-900">
            Stock on hand
          </h2>
          <p className="text-xs text-slate-500">
            Adjust quantities directly — changes save immediately.
          </p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[760px] text-left text-sm">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                <th className="px-4 py-3 font-semibold">Part</th>
                <th className="px-4 py-3 font-semibold">Quality</th>
                <th className="px-4 py-3 font-semibold">SKU</th>
                <th className="px-4 py-3 font-semibold">POS item</th>
                <th className="px-4 py-3 text-right font-semibold">Stock</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading && (
                <tr>
                  <td colSpan={5} className="px-4 py-10 text-center">
                    <Loader2
                      className="mx-auto h-6 w-6 animate-spin text-ccr-primary"
                      aria-hidden
                    />
                  </td>
                </tr>
              )}
              {!loading && parts.length === 0 && (
                <tr>
                  <td
                    colSpan={5}
                    className="px-4 py-10 text-center text-sm text-slate-500"
                  >
                    No active parts yet — add some in the price list.
                  </td>
                </tr>
              )}
              {!loading &&
                parts.map((part) => (
                  <tr key={part.id}>
                    <td className="px-4 py-2.5">
                      <span className="block font-medium text-slate-900">
                        {part.brand} {part.model}
                      </span>
                      <span className="block text-xs text-slate-500">
                        {part.repairType}
                      </span>
                    </td>
                    <td className="px-4 py-2.5">
                      <span className={qualityBadge(part.quality)}>
                        {QUALITY_LABELS[
                          part.quality as keyof typeof QUALITY_LABELS
                        ] ?? part.quality}
                      </span>
                    </td>
                    <td className="px-4 py-2.5 text-slate-600">
                      {part.sku ?? "—"}
                    </td>
                    <td className="max-w-[140px] truncate px-4 py-2.5 text-xs text-slate-500">
                      {part.posItemId ?? "Not linked"}
                    </td>
                    <td className="px-4 py-2.5">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          type="button"
                          aria-label={`Decrease stock for ${part.brand} ${part.model}`}
                          className="rounded-lg border border-slate-300 p-1.5 text-slate-600 transition hover:bg-slate-50 disabled:opacity-40"
                          disabled={savingId === part.id || part.stockQty <= 0}
                          onClick={() =>
                            void updateStock(part, part.stockQty - 1)
                          }
                        >
                          <Minus className="h-3.5 w-3.5" aria-hidden />
                        </button>
                        <input
                          type="number"
                          min={0}
                          step={1}
                          aria-label={`Stock quantity for ${part.brand} ${part.model}`}
                          className="input w-20 px-2 py-1.5 text-right tabular-nums"
                          defaultValue={part.stockQty}
                          key={`${part.id}-${part.stockQty}`}
                          disabled={savingId === part.id}
                          onBlur={(e) => {
                            const value = Number(e.target.value);
                            if (Number.isFinite(value)) {
                              void updateStock(part, value);
                            }
                          }}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") {
                              e.preventDefault();
                              e.currentTarget.blur();
                            }
                          }}
                        />
                        <button
                          type="button"
                          aria-label={`Increase stock for ${part.brand} ${part.model}`}
                          className="rounded-lg border border-slate-300 p-1.5 text-slate-600 transition hover:bg-slate-50 disabled:opacity-40"
                          disabled={savingId === part.id}
                          onClick={() =>
                            void updateStock(part, part.stockQty + 1)
                          }
                        >
                          <Plus className="h-3.5 w-3.5" aria-hidden />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
