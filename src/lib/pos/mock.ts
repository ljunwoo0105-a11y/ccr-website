import "server-only";
import { db } from "@/lib/db";
import type { PosAdapter, PosItem } from "@/lib/pos/types";

/**
 * Mock POS used in development (POS_PROVIDER=mock). It mirrors the current
 * parts table with small random stock movements so the sync flow can be
 * exercised end-to-end without a Loyverse account.
 */
export class MockPosAdapter implements PosAdapter {
  readonly provider = "mock";

  async testConnection(): Promise<{ ok: boolean; message: string }> {
    return { ok: true, message: "Mock POS ready (development mode)" };
  }

  async listItems(): Promise<PosItem[]> {
    const parts = await db.part.findMany({ take: 200 });
    return parts.map((p, i) => ({
      id: p.posItemId ?? `mock-${p.id}`,
      sku: p.sku ?? null,
      name: `${p.brand} ${p.model} ${p.repairType} (${p.quality})`,
      price: p.sellPrice,
      // Deterministic pseudo-movement so repeated syncs show changes.
      stock: Math.max(0, p.stockQty + ((i * 7) % 3) - 1),
    }));
  }
}
