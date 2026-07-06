import "server-only";
import type { PosAdapter, PosItem } from "@/lib/pos/types";

/**
 * Loyverse POS adapter (https://developer.loyverse.com/docs/).
 * Token: personal access token from Loyverse back office → Access tokens,
 * supplied via LOYVERSE_API_TOKEN. Read-only scopes are sufficient.
 */

const BASE = "https://api.loyverse.com/v1.0";

interface LoyverseVariant {
  variant_id: string;
  sku: string | null;
  default_price: number | null;
}
interface LoyverseItem {
  id: string;
  item_name: string;
  variants: LoyverseVariant[];
}

export class LoyverseAdapter implements PosAdapter {
  readonly provider = "loyverse";

  private token(): string {
    const token = process.env.LOYVERSE_API_TOKEN;
    if (!token) {
      throw new Error("LOYVERSE_API_TOKEN is not configured in .env");
    }
    return token;
  }

  private async get<T>(path: string): Promise<T> {
    const res = await fetch(`${BASE}${path}`, {
      headers: { Authorization: `Bearer ${this.token()}` },
      cache: "no-store",
    });
    if (!res.ok) {
      throw new Error(`Loyverse API ${res.status} on ${path}`);
    }
    return (await res.json()) as T;
  }

  async testConnection(): Promise<{ ok: boolean; message: string }> {
    try {
      await this.get<{ items: unknown[] }>("/items?limit=1");
      return { ok: true, message: "Connected to Loyverse" };
    } catch (e) {
      return {
        ok: false,
        message: e instanceof Error ? e.message : "Connection failed",
      };
    }
  }

  async listItems(): Promise<PosItem[]> {
    const items: PosItem[] = [];
    let cursor: string | null = null;

    // Item catalog (names, SKUs, prices)
    do {
      const qs: string = cursor
        ? `/items?limit=250&cursor=${encodeURIComponent(cursor)}`
        : "/items?limit=250";
      const page = await this.get<{ items: LoyverseItem[]; cursor?: string }>(qs);
      for (const item of page.items ?? []) {
        const v = item.variants?.[0];
        items.push({
          id: item.id,
          sku: v?.sku ?? null,
          name: item.item_name,
          price: v?.default_price ?? null,
          stock: null, // filled from inventory below
        });
      }
      cursor = page.cursor ?? null;
    } while (cursor);

    // Stock levels per variant
    const stockByVariant = new Map<string, number>();
    cursor = null;
    do {
      const qs: string = cursor
        ? `/inventory?limit=250&cursor=${encodeURIComponent(cursor)}`
        : "/inventory?limit=250";
      const page = await this.get<{
        inventory_levels: Array<{ variant_id: string; in_stock: number }>;
        cursor?: string;
      }>(qs);
      for (const level of page.inventory_levels ?? []) {
        stockByVariant.set(
          level.variant_id,
          (stockByVariant.get(level.variant_id) ?? 0) + level.in_stock
        );
      }
      cursor = page.cursor ?? null;
    } while (cursor);

    // Re-walk items to attach stock (variant ids needed a second pass).
    // Loyverse keys stock by variant; we re-fetch item variants mapping.
    cursor = null;
    const variantToItem = new Map<string, string>();
    do {
      const qs: string = cursor
        ? `/items?limit=250&cursor=${encodeURIComponent(cursor)}`
        : "/items?limit=250";
      const page = await this.get<{ items: LoyverseItem[]; cursor?: string }>(qs);
      for (const item of page.items ?? []) {
        for (const v of item.variants ?? []) {
          variantToItem.set(v.variant_id, item.id);
        }
      }
      cursor = page.cursor ?? null;
    } while (cursor);

    const stockByItem = new Map<string, number>();
    for (const [variantId, stock] of stockByVariant) {
      const itemId = variantToItem.get(variantId);
      if (itemId) {
        stockByItem.set(itemId, (stockByItem.get(itemId) ?? 0) + stock);
      }
    }
    for (const item of items) {
      const stock = stockByItem.get(item.id);
      if (stock !== undefined) item.stock = stock;
    }

    return items;
  }
}
