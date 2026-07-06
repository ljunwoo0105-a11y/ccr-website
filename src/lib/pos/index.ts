import "server-only";
import { db } from "@/lib/db";
import { LoyverseAdapter } from "@/lib/pos/loyverse";
import { MockPosAdapter } from "@/lib/pos/mock";
import type { PosAdapter, SyncResult } from "@/lib/pos/types";

export function getPosAdapter(): PosAdapter {
  const provider = (process.env.POS_PROVIDER ?? "mock").toLowerCase();
  switch (provider) {
    case "loyverse":
      return new LoyverseAdapter();
    case "mock":
      return new MockPosAdapter();
    default:
      throw new Error(
        `Unknown POS_PROVIDER "${provider}". Supported: loyverse, mock.`
      );
  }
}

/**
 * Pull stock levels from the POS into the parts price list.
 * Matching order: Part.posItemId (exact) → Part.sku (case-insensitive).
 */
export async function syncInventoryFromPos(): Promise<SyncResult> {
  const adapter = getPosAdapter();
  const result: SyncResult = {
    provider: adapter.provider,
    itemsFetched: 0,
    partsMatched: 0,
    stockUpdated: 0,
    unmatchedPosItems: 0,
    errors: [],
  };

  const posItems = await adapter.listItems();
  result.itemsFetched = posItems.length;

  const parts = await db.part.findMany({
    select: { id: true, sku: true, posItemId: true, stockQty: true },
  });
  const byPosId = new Map(
    parts.filter((p) => p.posItemId).map((p) => [p.posItemId as string, p])
  );
  const bySku = new Map(
    parts
      .filter((p) => p.sku)
      .map((p) => [(p.sku as string).toLowerCase(), p])
  );

  for (const item of posItems) {
    const part =
      byPosId.get(item.id) ??
      (item.sku ? bySku.get(item.sku.toLowerCase()) : undefined);
    if (!part) {
      result.unmatchedPosItems += 1;
      continue;
    }
    result.partsMatched += 1;
    try {
      const data: { posItemId: string; stockQty?: number } = {
        posItemId: item.id,
      };
      if (item.stock !== null && item.stock !== part.stockQty) {
        data.stockQty = Math.max(0, Math.round(item.stock));
      }
      await db.part.update({ where: { id: part.id }, data });
      if (data.stockQty !== undefined) result.stockUpdated += 1;
    } catch (e) {
      result.errors.push(
        `Part ${part.id}: ${e instanceof Error ? e.message : "update failed"}`
      );
    }
  }

  return result;
}
