"use client";

// ---------------------------------------------------------------------------
// Staff price bands for the teardown bay.
//
// Public visitors get nothing: the session probe fails closed, so `enabled`
// stays false and no price ever reaches the DOM. For a signed-in staff session
// this fetches the sell-side catalog once and indexes it by
// deviceType|repairType, giving each bay part a price band across every model
// on file (the bay models a generic device, so a single figure would be a lie).
// ---------------------------------------------------------------------------

import { useEffect, useState } from "react";
import { fetchStaffSession } from "@/components/staff/pricing-workbench/source";

export interface PriceBand {
  readonly min: number;
  readonly max: number;
  /** Number of catalog rows behind the band (models × quality tiers). */
  readonly count: number;
}

export interface StaffPrices {
  readonly enabled: boolean;
  readonly loading: boolean;
  readonly lookup: (deviceType: string, repairType: string) => PriceBand | null;
}

interface CatalogRow {
  readonly deviceType: string;
  readonly repairType: string;
  readonly sellPrice: number;
}

const key = (deviceType: string, repairType: string) =>
  `${deviceType}|${repairType}`;

function indexRows(rows: readonly CatalogRow[]): Map<string, PriceBand> {
  const index = new Map<string, PriceBand>();
  for (const row of rows) {
    if (typeof row.sellPrice !== "number") continue;
    const k = key(row.deviceType, row.repairType);
    const prev = index.get(k);
    index.set(
      k,
      prev
        ? {
            min: Math.min(prev.min, row.sellPrice),
            max: Math.max(prev.max, row.sellPrice),
            count: prev.count + 1,
          }
        : { min: row.sellPrice, max: row.sellPrice, count: 1 }
    );
  }
  return index;
}

export function useStaffPrices(): StaffPrices {
  const [enabled, setEnabled] = useState(false);
  const [loading, setLoading] = useState(true);
  const [index, setIndex] = useState<Map<string, PriceBand>>(new Map());

  useEffect(() => {
    const controller = new AbortController();
    const browserFetch = globalThis.fetch.bind(globalThis);

    (async () => {
      try {
        const session = await fetchStaffSession(browserFetch, controller.signal);
        if (session.kind !== "authenticated") {
          setEnabled(false);
          return;
        }
        const res = await fetch("/api/staff/parts", {
          signal: controller.signal,
        });
        if (!res.ok) {
          setEnabled(false);
          return;
        }
        const json: unknown = await res.json();
        const rows =
          typeof json === "object" && json !== null && "data" in json
            ? (json as { data?: unknown }).data
            : null;
        if (!Array.isArray(rows)) {
          setEnabled(false);
          return;
        }
        setIndex(indexRows(rows as CatalogRow[]));
        setEnabled(true);
      } catch {
        // Aborts and network errors both fail closed — no prices shown.
        setEnabled(false);
      } finally {
        setLoading(false);
      }
    })();

    return () => controller.abort();
  }, []);

  return {
    enabled,
    loading,
    lookup: (deviceType, repairType) =>
      enabled ? index.get(key(deviceType, repairType)) ?? null : null,
  };
}
