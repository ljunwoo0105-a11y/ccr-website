"use client";

// ---------------------------------------------------------------------------
// Staff pricing for the teardown bay.
//
// Public visitors get nothing: the session probe fails closed, so `enabled`
// stays false and no price ever reaches the DOM.
//
// The bay models a generic device, so pricing has two levels of precision:
//   • no model picked  → a band across every model on file (orientation only)
//   • model picked     → the exact catalog rows, one per quality tier
// Staff quoting a real customer use the second; the band just tells them the
// spread before they know which handset is on the counter.
// ---------------------------------------------------------------------------

import { useEffect, useMemo, useState } from "react";
import { fetchStaffSession } from "@/components/staff/pricing-workbench/source";

export interface PriceBand {
  readonly min: number;
  readonly max: number;
  /** Number of catalog rows behind the band (models × quality tiers). */
  readonly count: number;
}

/** One exact catalog row: a quality tier for a specific model's repair. */
export interface PriceQuote {
  readonly id: string;
  readonly quality: string;
  readonly colour: string | null;
  readonly sellPrice: number;
  readonly warrantyDays: number;
  readonly stockQty: number;
}

export interface CatalogRow extends PriceQuote {
  readonly deviceType: string;
  readonly brand: string;
  readonly model: string;
  readonly repairType: string;
}

export interface StaffPrices {
  readonly enabled: boolean;
  readonly loading: boolean;
  /** Brands with at least one row for this device type. */
  readonly brands: (deviceType: string) => readonly string[];
  /** Models for a device type + brand. */
  readonly models: (deviceType: string, brand: string) => readonly string[];
  /** Exact rows for one model's repair, cheapest tier first. */
  readonly quotes: (
    deviceType: string,
    brand: string,
    model: string,
    repairType: string
  ) => readonly PriceQuote[];
  /** Spread across all models, for when no model is picked yet. */
  readonly band: (deviceType: string, repairType: string) => PriceBand | null;
}

const EMPTY: readonly never[] = [];

function isRow(value: unknown): value is CatalogRow {
  if (typeof value !== "object" || value === null) return false;
  const r = value as Record<string, unknown>;
  return (
    typeof r.deviceType === "string" &&
    typeof r.brand === "string" &&
    typeof r.model === "string" &&
    typeof r.repairType === "string" &&
    typeof r.sellPrice === "number"
  );
}

export function useStaffPrices(): StaffPrices {
  const [enabled, setEnabled] = useState(false);
  const [loading, setLoading] = useState(true);
  const [rows, setRows] = useState<readonly CatalogRow[]>(EMPTY);

  useEffect(() => {
    const controller = new AbortController();
    const browserFetch = globalThis.fetch.bind(globalThis);

    (async () => {
      try {
        const session = await fetchStaffSession(browserFetch, controller.signal);
        if (session.kind !== "authenticated") return;

        const res = await fetch("/api/staff/parts", {
          signal: controller.signal,
        });
        if (!res.ok) return;

        const json: unknown = await res.json();
        const data =
          typeof json === "object" && json !== null && "data" in json
            ? (json as { data?: unknown }).data
            : null;
        if (!Array.isArray(data)) return;

        setRows(data.filter(isRow));
        setEnabled(true);
      } catch {
        // Aborts and network errors both fail closed — no prices shown.
      } finally {
        setLoading(false);
      }
    })();

    return () => controller.abort();
  }, []);

  return useMemo<StaffPrices>(() => {
    if (!enabled) {
      return {
        enabled: false,
        loading,
        brands: () => EMPTY,
        models: () => EMPTY,
        quotes: () => EMPTY,
        band: () => null,
      };
    }

    const sorted = (values: Iterable<string>) =>
      [...new Set(values)].sort((a, b) => a.localeCompare(b));

    return {
      enabled: true,
      loading,
      brands: (deviceType) =>
        sorted(
          rows.filter((r) => r.deviceType === deviceType).map((r) => r.brand)
        ),
      models: (deviceType, brand) =>
        sorted(
          rows
            .filter((r) => r.deviceType === deviceType && r.brand === brand)
            .map((r) => r.model)
        ),
      quotes: (deviceType, brand, model, repairType) =>
        rows
          .filter(
            (r) =>
              r.deviceType === deviceType &&
              r.brand === brand &&
              r.model === model &&
              r.repairType === repairType
          )
          .map(({ id, quality, colour, sellPrice, warrantyDays, stockQty }) => ({
            id,
            quality,
            colour,
            sellPrice,
            warrantyDays,
            stockQty,
          }))
          .sort((a, b) => a.sellPrice - b.sellPrice),
      band: (deviceType, repairType) => {
        let min = Infinity;
        let max = -Infinity;
        let count = 0;
        for (const r of rows) {
          if (r.deviceType !== deviceType || r.repairType !== repairType) continue;
          min = Math.min(min, r.sellPrice);
          max = Math.max(max, r.sellPrice);
          count += 1;
        }
        return count === 0 ? null : { min, max, count };
      },
    };
  }, [enabled, loading, rows]);
}
