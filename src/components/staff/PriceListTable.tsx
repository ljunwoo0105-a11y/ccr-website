"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  Archive,
  Loader2,
  Pencil,
  Plus,
  RotateCcw,
  Search,
  Sparkles,
} from "lucide-react";
import {
  DEVICE_TYPES,
  PART_QUALITIES,
  QUALITY_LABELS,
} from "@/lib/config";
import { formatAud } from "@/lib/utils";
import {
  marginPct,
  marginTone,
  qualityBadge,
  stockBadge,
  warrantyLabel,
} from "@/components/staff/ui";
import type { ApiEnvelope, PartRow } from "@/components/staff/types";
import PartFormModal from "@/components/staff/PartFormModal";
import AiPriceModal from "@/components/staff/AiPriceModal";

type ModalState = { mode: "create" } | { mode: "edit"; part: PartRow } | null;

export default function PriceListTable() {
  const [parts, setParts] = useState<PartRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [deviceType, setDeviceType] = useState("");
  const [brand, setBrand] = useState("");
  const [quality, setQuality] = useState("");
  const [showInactive, setShowInactive] = useState(false);
  const [brands, setBrands] = useState<string[]>([]);

  const [modal, setModal] = useState<ModalState>(null);
  const [aiPart, setAiPart] = useState<PartRow | null>(null);
  const [busyRow, setBusyRow] = useState<string | null>(null);

  const requestIdRef = useRef(0);

  // Debounce the search box (300 ms).
  useEffect(() => {
    const t = setTimeout(() => setSearch(searchInput.trim()), 300);
    return () => clearTimeout(t);
  }, [searchInput]);

  const load = useCallback(async () => {
    const requestId = ++requestIdRef.current;
    setLoading(true);
    setError(null);
    try {
      const qs = new URLSearchParams();
      if (search) qs.set("search", search);
      if (deviceType) qs.set("deviceType", deviceType);
      if (brand) qs.set("brand", brand);
      if (quality) qs.set("quality", quality);
      qs.set("active", showInactive ? "all" : "true");
      const res = await fetch(`/api/staff/parts?${qs.toString()}`);
      const json = (await res.json()) as ApiEnvelope<PartRow[]>;
      if (requestId !== requestIdRef.current) return; // stale response
      if (!res.ok || !json.ok || !json.data) {
        setError(json.error ?? "Could not load the price list");
        setParts([]);
      } else {
        setParts(json.data);
        setBrands((prev) =>
          Array.from(
            new Set([...prev, ...(json.data ?? []).map((p) => p.brand)])
          ).sort()
        );
      }
    } catch {
      if (requestId === requestIdRef.current) {
        setError("Network error — try again");
      }
    } finally {
      if (requestId === requestIdRef.current) setLoading(false);
    }
  }, [search, deviceType, brand, quality, showInactive]);

  useEffect(() => {
    void load();
  }, [load]);

  async function deactivate(part: PartRow) {
    if (
      !window.confirm(
        `Deactivate ${part.brand} ${part.model} — ${part.repairType}? It stays in the database and can be reactivated.`
      )
    ) {
      return;
    }
    setBusyRow(part.id);
    try {
      await fetch(`/api/staff/parts/${part.id}`, { method: "DELETE" });
      await load();
    } finally {
      setBusyRow(null);
    }
  }

  async function reactivate(part: PartRow) {
    setBusyRow(part.id);
    try {
      await fetch(`/api/staff/parts/${part.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ active: true }),
      });
      await load();
    } finally {
      setBusyRow(null);
    }
  }

  function handleSaved() {
    setModal(null);
    void load();
  }

  function handleAiApplied(updated: PartRow) {
    setParts((prev) => prev.map((p) => (p.id === updated.id ? updated : p)));
    setAiPart(null);
  }

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="card flex flex-wrap items-end gap-3 p-4">
        <div className="min-w-[200px] flex-1">
          <label htmlFor="pl-search" className="label">
            Search
          </label>
          <div className="relative">
            <Search
              className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
              aria-hidden
            />
            <input
              id="pl-search"
              className="input pl-9"
              placeholder="Brand, model, repair or SKU…"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
            />
          </div>
        </div>
        <div>
          <label htmlFor="pl-device" className="label">
            Device
          </label>
          <select
            id="pl-device"
            className="input w-36"
            value={deviceType}
            onChange={(e) => setDeviceType(e.target.value)}
          >
            <option value="">All devices</option>
            {DEVICE_TYPES.map((d) => (
              <option key={d} value={d}>
                {d}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="pl-brand" className="label">
            Brand
          </label>
          <select
            id="pl-brand"
            className="input w-36"
            value={brand}
            onChange={(e) => setBrand(e.target.value)}
          >
            <option value="">All brands</option>
            {brands.map((b) => (
              <option key={b} value={b}>
                {b}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="pl-quality" className="label">
            Quality
          </label>
          <select
            id="pl-quality"
            className="input w-44"
            value={quality}
            onChange={(e) => setQuality(e.target.value)}
          >
            <option value="">All tiers</option>
            {PART_QUALITIES.map((q) => (
              <option key={q} value={q}>
                {QUALITY_LABELS[q]}
              </option>
            ))}
          </select>
        </div>
        <label className="flex h-[42px] items-center gap-2 text-sm text-slate-700">
          <input
            type="checkbox"
            className="h-4 w-4 rounded border-slate-300 text-ccr-primary focus:ring-ccr-primary"
            checked={showInactive}
            onChange={(e) => setShowInactive(e.target.checked)}
          />
          Show inactive
        </label>
        <button
          type="button"
          className="btn-secondary px-4 py-2.5"
          onClick={() => setModal({ mode: "create" })}
        >
          <Plus className="h-4 w-4" aria-hidden />
          Add part
        </button>
      </div>

      {error && (
        <p
          role="alert"
          className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700"
        >
          {error}
        </p>
      )}

      {/* Table */}
      <div className="card overflow-hidden p-0">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[1080px] text-left text-sm">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                <th className="px-4 py-3 font-semibold">Device</th>
                <th className="px-4 py-3 font-semibold">Brand</th>
                <th className="px-4 py-3 font-semibold">Model</th>
                <th className="px-4 py-3 font-semibold">Repair</th>
                <th className="px-4 py-3 font-semibold">Quality</th>
                <th className="px-4 py-3 text-right font-semibold">Cost</th>
                <th className="px-4 py-3 text-right font-semibold">Sell</th>
                <th className="px-4 py-3 text-right font-semibold">Margin</th>
                <th className="px-4 py-3 font-semibold">Warranty</th>
                <th className="px-4 py-3 font-semibold">Stock</th>
                <th className="px-4 py-3 font-semibold">Supplier</th>
                <th className="px-4 py-3 text-right font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading && (
                <tr>
                  <td colSpan={12} className="px-4 py-10 text-center">
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
                    colSpan={12}
                    className="px-4 py-10 text-center text-sm text-slate-500"
                  >
                    No parts match the current filters.
                  </td>
                </tr>
              )}
              {!loading &&
                parts.map((part) => {
                  const margin = marginPct(part.costPrice, part.sellPrice);
                  return (
                    <tr
                      key={part.id}
                      className={part.active ? undefined : "opacity-50"}
                    >
                      <td className="px-4 py-2.5 text-slate-600">
                        {part.deviceType}
                      </td>
                      <td className="px-4 py-2.5 font-medium text-slate-900">
                        {part.brand}
                      </td>
                      <td className="px-4 py-2.5 text-slate-900">
                        {part.model}
                      </td>
                      <td className="px-4 py-2.5 text-slate-700">
                        {part.repairType}
                      </td>
                      <td className="px-4 py-2.5">
                        <span className={qualityBadge(part.quality)}>
                          {QUALITY_LABELS[
                            part.quality as keyof typeof QUALITY_LABELS
                          ] ?? part.quality}
                        </span>
                      </td>
                      <td className="px-4 py-2.5 text-right tabular-nums text-slate-600">
                        {formatAud(part.costPrice)}
                      </td>
                      <td className="px-4 py-2.5 text-right font-semibold tabular-nums text-slate-900">
                        {formatAud(part.sellPrice)}
                      </td>
                      <td className="px-4 py-2.5 text-right tabular-nums">
                        {margin !== null ? (
                          <span className={`font-semibold ${marginTone(margin)}`}>
                            {margin.toFixed(0)}%
                          </span>
                        ) : (
                          <span className="text-slate-400">—</span>
                        )}
                      </td>
                      <td className="px-4 py-2.5 text-slate-600">
                        {warrantyLabel(part.warrantyDays)}
                      </td>
                      <td className="px-4 py-2.5">
                        <span className={stockBadge(part.stockQty)}>
                          {part.stockQty}
                        </span>
                      </td>
                      <td className="px-4 py-2.5 text-slate-600">
                        {part.supplier ?? "—"}
                      </td>
                      <td className="px-4 py-2.5">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            type="button"
                            title="Edit part"
                            aria-label={`Edit ${part.brand} ${part.model} ${part.repairType}`}
                            className="rounded-lg p-1.5 text-slate-500 transition hover:bg-slate-100 hover:text-slate-900"
                            onClick={() => setModal({ mode: "edit", part })}
                          >
                            <Pencil className="h-4 w-4" aria-hidden />
                          </button>
                          <button
                            type="button"
                            title="AI price check"
                            aria-label={`AI price check for ${part.brand} ${part.model}`}
                            className="rounded-lg p-1.5 text-violet-500 transition hover:bg-violet-50 hover:text-violet-700"
                            onClick={() => setAiPart(part)}
                          >
                            <Sparkles className="h-4 w-4" aria-hidden />
                          </button>
                          {part.active ? (
                            <button
                              type="button"
                              title="Deactivate part"
                              aria-label={`Deactivate ${part.brand} ${part.model}`}
                              className="rounded-lg p-1.5 text-slate-500 transition hover:bg-rose-50 hover:text-rose-600 disabled:opacity-50"
                              disabled={busyRow === part.id}
                              onClick={() => void deactivate(part)}
                            >
                              <Archive className="h-4 w-4" aria-hidden />
                            </button>
                          ) : (
                            <button
                              type="button"
                              title="Reactivate part"
                              aria-label={`Reactivate ${part.brand} ${part.model}`}
                              className="rounded-lg p-1.5 text-slate-500 transition hover:bg-emerald-50 hover:text-emerald-600 disabled:opacity-50"
                              disabled={busyRow === part.id}
                              onClick={() => void reactivate(part)}
                            >
                              <RotateCcw className="h-4 w-4" aria-hidden />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
            </tbody>
          </table>
        </div>
        <div className="flex flex-wrap items-center justify-between gap-2 border-t border-slate-200 bg-slate-50 px-4 py-3">
          <p className="text-xs text-slate-500">
            {loading ? "Loading…" : `${parts.length} part${parts.length === 1 ? "" : "s"}`}
          </p>
          <p className="text-xs font-medium text-slate-500">
            Cost prices are confidential — staff only.
          </p>
        </div>
      </div>

      {modal && (
        <PartFormModal
          part={modal.mode === "edit" ? modal.part : null}
          onSaved={handleSaved}
          onClose={() => setModal(null)}
        />
      )}
      {aiPart && (
        <AiPriceModal
          part={aiPart}
          onApplied={handleAiApplied}
          onClose={() => setAiPart(null)}
        />
      )}
    </div>
  );
}
