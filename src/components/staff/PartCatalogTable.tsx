"use client";

import { Archive, Loader2, Pencil, RotateCcw, Trash2 } from "lucide-react";
import { QUALITY_LABELS } from "@/lib/config";
import { formatAud } from "@/lib/utils";
import { marginPct, marginTone, qualityBadge, stockBadge, warrantyLabel } from "@/components/staff/ui";
import type { CatalogPartRow } from "@/components/staff/part-catalog-schema";

type CatalogMode = "admin" | "staff";

type PartCatalogTableProps = {
  readonly mode: CatalogMode;
  readonly parts: readonly CatalogPartRow[];
  readonly loading: boolean;
  readonly busyRow: string | null;
  readonly onEdit: (part: CatalogPartRow) => void;
  readonly onDeactivate: (part: CatalogPartRow) => void;
  readonly onReactivate: (part: CatalogPartRow) => void;
  readonly onHardDelete: (part: CatalogPartRow) => void;
};

export function PartCatalogTable({
  mode,
  parts,
  loading,
  busyRow,
  onEdit,
  onDeactivate,
  onReactivate,
  onHardDelete,
}: PartCatalogTableProps) {
  const isAdmin = mode === "admin";
  const colSpan = isAdmin ? 12 : 8;
  return (
    <div className="card overflow-hidden p-0">
      <div className="overflow-x-auto">
        <table className={`w-full text-left text-sm ${isAdmin ? "min-w-[1080px]" : "min-w-[760px]"}`}>
          <thead>
            <tr className="border-b border-carbon-150 bg-bone-100 text-xs uppercase tracking-wide text-carbon-500">
              <th className="px-4 py-3 font-semibold">Device</th>
              <th className="px-4 py-3 font-semibold">Brand</th>
              <th className="px-4 py-3 font-semibold">Model</th>
              <th className="px-4 py-3 font-semibold">Repair</th>
              <th className="px-4 py-3 font-semibold">Quality</th>
              {isAdmin && <th className="px-4 py-3 text-right font-semibold">Cost</th>}
              <th className="px-4 py-3 text-right font-semibold">Sell</th>
              {isAdmin && <th className="px-4 py-3 text-right font-semibold">Margin</th>}
              <th className="px-4 py-3 font-semibold">Warranty</th>
              <th className="px-4 py-3 font-semibold">Stock</th>
              {isAdmin && <th className="px-4 py-3 font-semibold">Supplier</th>}
              {isAdmin && <th className="px-4 py-3 text-right font-semibold">Actions</th>}
            </tr>
          </thead>
          <tbody className="divide-y divide-carbon-150">
            {loading && (
              <tr>
                <td colSpan={colSpan} className="px-4 py-10 text-center">
                  <Loader2 className="mx-auto h-6 w-6 animate-spin text-signal-600" aria-hidden />
                </td>
              </tr>
            )}
            {!loading && parts.length === 0 && (
              <tr>
                <td colSpan={colSpan} className="px-4 py-10 text-center text-sm text-carbon-500">
                  No parts match the current filters.
                </td>
              </tr>
            )}
            {!loading &&
              parts.map((part) => (
                <PartCatalogRow
                  key={part.id}
                  mode={mode}
                  part={part}
                  busy={busyRow === part.id}
                  onEdit={onEdit}
                  onDeactivate={onDeactivate}
                  onReactivate={onReactivate}
                  onHardDelete={onHardDelete}
                />
              ))}
          </tbody>
        </table>
      </div>
      <div className="flex flex-wrap items-center justify-between gap-2 border-t border-carbon-150 bg-bone-100 px-4 py-3">
        <p className="text-xs text-carbon-500">
          {loading ? "Loading..." : `${parts.length} part${parts.length === 1 ? "" : "s"}`}
        </p>
        <p className="text-xs font-medium text-carbon-500">
          {isAdmin ? "Catalog changes are admin-only." : "Prices are read-only for staff."}
        </p>
      </div>
    </div>
  );
}

function PartCatalogRow({
  mode,
  part,
  busy,
  onEdit,
  onDeactivate,
  onReactivate,
  onHardDelete,
}: {
  readonly mode: CatalogMode;
  readonly part: CatalogPartRow;
  readonly busy: boolean;
  readonly onEdit: (part: CatalogPartRow) => void;
  readonly onDeactivate: (part: CatalogPartRow) => void;
  readonly onReactivate: (part: CatalogPartRow) => void;
  readonly onHardDelete: (part: CatalogPartRow) => void;
}) {
  const margin =
    part.costPrice === undefined ? null : marginPct(part.costPrice, part.sellPrice);
  const isAdmin = mode === "admin";
  return (
    <tr className={part.active ? undefined : "opacity-50"}>
      <td className="px-4 py-2.5 text-carbon-700">{part.deviceType}</td>
      <td className="px-4 py-2.5 font-medium text-carbon-950">{part.brand}</td>
      <td className="px-4 py-2.5 text-carbon-950">{part.model}</td>
      <td className="px-4 py-2.5 text-carbon-700">{part.repairType}</td>
      <td className="px-4 py-2.5">
        <span className={qualityBadge(part.quality)}>
          {QUALITY_LABELS[part.quality]}
        </span>
      </td>
      {isAdmin && (
        <td className="px-4 py-2.5 text-right tabular-nums text-carbon-700">
          {part.costPrice === undefined ? "-" : formatAud(part.costPrice)}
        </td>
      )}
      <td className="px-4 py-2.5 text-right font-semibold tabular-nums text-carbon-950">{formatAud(part.sellPrice)}</td>
      {isAdmin && (
        <td className="px-4 py-2.5 text-right tabular-nums">
          {margin === null ? <span className="text-carbon-400">-</span> : <span className={`font-semibold ${marginTone(margin)}`}>{margin.toFixed(0)}%</span>}
        </td>
      )}
      <td className="px-4 py-2.5 text-carbon-700">{warrantyLabel(part.warrantyDays)}</td>
      <td className="px-4 py-2.5"><span className={stockBadge(part.stockQty)}>{part.stockQty}</span></td>
      {isAdmin && <td className="px-4 py-2.5 text-carbon-700">{part.supplier ?? "-"}</td>}
      {isAdmin && (
        <td className="px-4 py-2.5">
          <div className="flex items-center justify-end gap-1">
            <button type="button" title="Edit part" aria-label={`Edit ${part.brand} ${part.model} ${part.repairType}`} className="p-1.5 text-carbon-500 transition hover:bg-bone-200 hover:text-carbon-950" onClick={() => onEdit(part)}>
              <Pencil className="h-4 w-4" aria-hidden />
            </button>
            {part.active ? (
              <button type="button" title="Deactivate part" aria-label={`Deactivate ${part.brand} ${part.model}`} className="p-1.5 text-carbon-500 transition hover:bg-rose-50 hover:text-rose-600 disabled:opacity-50" disabled={busy} onClick={() => onDeactivate(part)}>
                <Archive className="h-4 w-4" aria-hidden />
              </button>
            ) : (
              <>
                <button type="button" title="Reactivate part" aria-label={`Reactivate ${part.brand} ${part.model}`} className="p-1.5 text-carbon-500 transition hover:bg-emerald-50 hover:text-emerald-600 disabled:opacity-50" disabled={busy} onClick={() => onReactivate(part)}>
                  <RotateCcw className="h-4 w-4" aria-hidden />
                </button>
                <button type="button" title="Hard delete part" aria-label={`Hard delete ${part.brand} ${part.model}`} className="p-1.5 text-carbon-500 transition hover:bg-rose-50 hover:text-rose-700 disabled:opacity-50" disabled={busy} onClick={() => onHardDelete(part)}>
                  <Trash2 className="h-4 w-4" aria-hidden />
                </button>
              </>
            )}
          </div>
        </td>
      )}
    </tr>
  );
}
