"use client";

import { useState } from "react";
import { Loader2, X } from "lucide-react";
import {
  DEVICE_TYPES,
  PART_QUALITIES,
  QUALITY_LABELS,
  QUALITY_DEFAULT_WARRANTY,
} from "@/lib/config";
import { marginPct, marginTone } from "@/components/staff/ui";
import type { ApiEnvelope, PartRow } from "@/components/staff/types";

interface Props {
  /** null = create a new part. */
  part: PartRow | null;
  onSaved: (part: PartRow) => void;
  onClose: () => void;
}

export default function PartFormModal({ part, onSaved, onClose }: Props) {
  const editing = part !== null;

  const [deviceType, setDeviceType] = useState(part?.deviceType ?? "Phone");
  const [brand, setBrand] = useState(part?.brand ?? "");
  const [model, setModel] = useState(part?.model ?? "");
  const [repairType, setRepairType] = useState(part?.repairType ?? "");
  const [quality, setQuality] = useState(part?.quality ?? "AFTERMARKET");
  const [colour, setColour] = useState(part?.colour ?? "");
  const [costPrice, setCostPrice] = useState(
    part ? String(part.costPrice) : ""
  );
  const [sellPrice, setSellPrice] = useState(
    part ? String(part.sellPrice) : ""
  );
  const [warrantyDays, setWarrantyDays] = useState(
    part ? String(part.warrantyDays) : String(QUALITY_DEFAULT_WARRANTY.AFTERMARKET)
  );
  const [stockQty, setStockQty] = useState(part ? String(part.stockQty) : "0");
  const [sku, setSku] = useState(part?.sku ?? "");
  const [supplier, setSupplier] = useState(part?.supplier ?? "");
  const [posItemId, setPosItemId] = useState(part?.posItemId ?? "");
  const [notes, setNotes] = useState(part?.notes ?? "");
  const [active, setActive] = useState(part?.active ?? true);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  function handleQualityChange(next: string) {
    setQuality(next);
    // Auto-fill the tier's default warranty when creating a new part.
    if (!editing && QUALITY_DEFAULT_WARRANTY[next] !== undefined) {
      setWarrantyDays(String(QUALITY_DEFAULT_WARRANTY[next]));
    }
  }

  const cost = Number(costPrice);
  const sell = Number(sellPrice);
  const margin =
    Number.isFinite(cost) && Number.isFinite(sell)
      ? marginPct(cost, sell)
      : null;

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setBusy(true);
    try {
      const payload = {
        deviceType,
        brand: brand.trim(),
        model: model.trim(),
        repairType: repairType.trim(),
        quality,
        colour: colour.trim() || null,
        costPrice: Number(costPrice),
        sellPrice: Number(sellPrice),
        warrantyDays: Math.round(Number(warrantyDays)),
        stockQty: Math.round(Number(stockQty)),
        sku: sku.trim() || null,
        supplier: supplier.trim() || null,
        posItemId: posItemId.trim() || null,
        notes: notes.trim() || null,
        active,
      };
      const res = await fetch(
        editing ? `/api/staff/parts/${part.id}` : "/api/staff/parts",
        {
          method: editing ? "PATCH" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        }
      );
      const json = (await res.json()) as ApiEnvelope<PartRow>;
      if (!res.ok || !json.ok || !json.data) {
        setError(json.error ?? "Could not save the part");
        setBusy(false);
        return;
      }
      onSaved(json.data);
    } catch {
      setError("Network error — try again");
      setBusy(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-slate-900/60 p-4 sm:items-center"
      role="dialog"
      aria-modal="true"
      aria-label={editing ? "Edit part" : "Add part"}
    >
      <div className="card w-full max-w-2xl">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-bold text-slate-900">
            {editing ? `Edit part — ${part.brand} ${part.model}` : "Add part"}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
            aria-label="Close"
          >
            <X className="h-5 w-5" aria-hidden />
          </button>
        </div>

        {error && (
          <p
            role="alert"
            className="mb-4 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700"
          >
            {error}
          </p>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div>
              <label htmlFor="pf-device" className="label">
                Device type
              </label>
              <select
                id="pf-device"
                className="input"
                value={deviceType}
                onChange={(e) => setDeviceType(e.target.value)}
              >
                {DEVICE_TYPES.map((d) => (
                  <option key={d} value={d}>
                    {d}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="pf-brand" className="label">
                Brand
              </label>
              <input
                id="pf-brand"
                className="input"
                required
                value={brand}
                onChange={(e) => setBrand(e.target.value)}
                placeholder="Apple"
              />
            </div>
            <div>
              <label htmlFor="pf-model" className="label">
                Model
              </label>
              <input
                id="pf-model"
                className="input"
                required
                value={model}
                onChange={(e) => setModel(e.target.value)}
                placeholder="iPhone 14 Pro"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="pf-repair" className="label">
                Repair type
              </label>
              <input
                id="pf-repair"
                className="input"
                required
                value={repairType}
                onChange={(e) => setRepairType(e.target.value)}
                placeholder="Screen Replacement"
              />
            </div>
            <div>
              <label htmlFor="pf-quality" className="label">
                Part quality
              </label>
              <select
                id="pf-quality"
                className="input"
                value={quality}
                onChange={(e) => handleQualityChange(e.target.value)}
              >
                {PART_QUALITIES.map((q) => (
                  <option key={q} value={q}>
                    {QUALITY_LABELS[q]}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label htmlFor="pf-colour" className="label">
              Colour{" "}
              <span className="text-slate-400">
                (optional — e.g. Black, White; used by the in-store quote builder)
              </span>
            </label>
            <input
              id="pf-colour"
              className="input"
              value={colour}
              onChange={(e) => setColour(e.target.value)}
              placeholder="Black"
            />
          </div>

          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            <div>
              <label htmlFor="pf-cost" className="label">
                Cost (AUD)
              </label>
              <input
                id="pf-cost"
                className="input"
                type="number"
                min={0}
                step="0.01"
                required
                value={costPrice}
                onChange={(e) => setCostPrice(e.target.value)}
              />
            </div>
            <div>
              <label htmlFor="pf-sell" className="label">
                Sell (AUD)
              </label>
              <input
                id="pf-sell"
                className="input"
                type="number"
                min={0}
                step="0.01"
                required
                value={sellPrice}
                onChange={(e) => setSellPrice(e.target.value)}
              />
            </div>
            <div>
              <label htmlFor="pf-warranty" className="label">
                Warranty (days)
              </label>
              <input
                id="pf-warranty"
                className="input"
                type="number"
                min={0}
                step={1}
                required
                value={warrantyDays}
                onChange={(e) => setWarrantyDays(e.target.value)}
              />
            </div>
            <div>
              <label htmlFor="pf-stock" className="label">
                Stock qty
              </label>
              <input
                id="pf-stock"
                className="input"
                type="number"
                min={0}
                step={1}
                required
                value={stockQty}
                onChange={(e) => setStockQty(e.target.value)}
              />
            </div>
          </div>

          {margin !== null && (
            <p className="text-sm text-slate-600">
              Margin preview:{" "}
              <span className={`font-semibold ${marginTone(margin)}`}>
                {margin.toFixed(1)}%
              </span>
            </p>
          )}

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div>
              <label htmlFor="pf-sku" className="label">
                SKU <span className="text-slate-400">(optional)</span>
              </label>
              <input
                id="pf-sku"
                className="input"
                value={sku}
                onChange={(e) => setSku(e.target.value)}
              />
            </div>
            <div>
              <label htmlFor="pf-supplier" className="label">
                Supplier <span className="text-slate-400">(optional)</span>
              </label>
              <input
                id="pf-supplier"
                className="input"
                value={supplier}
                onChange={(e) => setSupplier(e.target.value)}
              />
            </div>
            <div>
              <label htmlFor="pf-pos" className="label">
                POS item id <span className="text-slate-400">(optional)</span>
              </label>
              <input
                id="pf-pos"
                className="input"
                value={posItemId}
                onChange={(e) => setPosItemId(e.target.value)}
              />
            </div>
          </div>

          <div>
            <label htmlFor="pf-notes" className="label">
              Notes <span className="text-slate-400">(optional)</span>
            </label>
            <textarea
              id="pf-notes"
              className="input min-h-[70px]"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </div>

          {editing && (
            <label className="flex items-center gap-2 text-sm text-slate-700">
              <input
                type="checkbox"
                className="h-4 w-4 rounded border-slate-300 text-ccr-primary focus:ring-ccr-primary"
                checked={active}
                onChange={(e) => setActive(e.target.checked)}
              />
              Active (shown in the working price list)
            </label>
          )}

          <div className="flex justify-end gap-3 pt-2">
            <button type="button" className="btn-ghost" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="btn-secondary" disabled={busy}>
              {busy && <Loader2 className="h-4 w-4 animate-spin" aria-hidden />}
              {editing ? "Save changes" : "Add part"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
