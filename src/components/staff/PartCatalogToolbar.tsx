"use client";

import { FileUp, Plus, Search } from "lucide-react";
import { DEVICE_TYPES, PART_QUALITIES, QUALITY_LABELS } from "@/lib/config";

type CatalogMode = "admin" | "staff";

type PartCatalogToolbarProps = {
  readonly mode: CatalogMode;
  readonly searchInput: string;
  readonly deviceType: string;
  readonly brand: string;
  readonly quality: string;
  readonly brands: readonly string[];
  readonly showInactive: boolean;
  readonly onSearchInput: (value: string) => void;
  readonly onDeviceType: (value: string) => void;
  readonly onBrand: (value: string) => void;
  readonly onQuality: (value: string) => void;
  readonly onShowInactive: (value: boolean) => void;
  readonly onCreate: () => void;
  readonly onImport: () => void;
};

export function PartCatalogToolbar({
  mode,
  searchInput,
  deviceType,
  brand,
  quality,
  brands,
  showInactive,
  onSearchInput,
  onDeviceType,
  onBrand,
  onQuality,
  onShowInactive,
  onCreate,
  onImport,
}: PartCatalogToolbarProps) {
  return (
    <div className="card flex flex-wrap items-end gap-3 p-4">
      <div className="min-w-[200px] flex-1">
        <label htmlFor="pl-search" className="label">
          Search
        </label>
        <div className="relative">
          <Search
            className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-carbon-400"
            aria-hidden
          />
          <input
            id="pl-search"
            className="input pl-9"
            placeholder="Brand, model, repair or SKU..."
            value={searchInput}
            onChange={(event) => onSearchInput(event.target.value)}
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
          onChange={(event) => onDeviceType(event.target.value)}
        >
          <option value="">All devices</option>
          {DEVICE_TYPES.map((device) => (
            <option key={device} value={device}>
              {device}
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
          onChange={(event) => onBrand(event.target.value)}
        >
          <option value="">All brands</option>
          {brands.map((item) => (
            <option key={item} value={item}>
              {item}
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
          onChange={(event) => onQuality(event.target.value)}
        >
          <option value="">All tiers</option>
          {PART_QUALITIES.map((item) => (
            <option key={item} value={item}>
              {QUALITY_LABELS[item]}
            </option>
          ))}
        </select>
      </div>
      {mode === "admin" && (
        <>
          <label className="flex h-[42px] items-center gap-2 text-sm text-carbon-700">
            <input
              type="checkbox"
              className="h-4 w-4 rounded border-carbon-200 text-signal-600 focus:ring-signal-500"
              checked={showInactive}
              onChange={(event) => onShowInactive(event.target.checked)}
            />
            Show inactive
          </label>
          <button type="button" className="btn-secondary px-4 py-2.5" onClick={onImport}>
            <FileUp className="h-4 w-4" aria-hidden />
            Import
          </button>
          <button type="button" className="btn-secondary px-4 py-2.5" onClick={onCreate}>
            <Plus className="h-4 w-4" aria-hidden />
            Add part
          </button>
        </>
      )}
    </div>
  );
}
