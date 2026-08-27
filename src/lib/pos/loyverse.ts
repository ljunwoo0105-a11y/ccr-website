import "server-only";
import type { PosAdapter, PosItem } from "@/lib/pos/types";

/**
 * Loyverse POS adapter (https://developer.loyverse.com/docs/).
 * Token: personal access token from Loyverse back office → Access tokens,
 * supplied via LOYVERSE_API_TOKEN. Read-only scopes are sufficient.
 */

const BASE = "https://api.loyverse.com/v1.0";
const REQUEST_TIMEOUT_MS = 10_000;
const MAX_PAGES = 100;

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
      signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
    });
    if (!res.ok) {
      throw new Error(`Loyverse API ${res.status} on ${path}`);
    }
    return (await res.json()) as T;
  }

  private async eachPage<T extends { cursor?: string }>(
    resource: string,
    visit: (page: T) => void
  ): Promise<void> {
    let cursor: string | null = null;
    const seen = new Set<string>();

    for (let pageNumber = 0; pageNumber < MAX_PAGES; pageNumber += 1) {
      const path: string = cursor
        ? `/${resource}?limit=250&cursor=${encodeURIComponent(cursor)}`
        : `/${resource}?limit=250`;
      const page: T = await this.get<T>(path);
      visit(page);

      const next: string | null = page.cursor?.trim() || null;
      if (!next) return;
      if (seen.has(next)) {
        throw new Error(`Loyverse API repeated a pagination cursor for ${resource}`);
      }
      seen.add(next);
      cursor = next;
    }

    throw new Error(`Loyverse API exceeded ${MAX_PAGES} pages for ${resource}`);
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
    const variantToItem = new Map<string, string>();

    // Item catalog (names, SKUs, prices)
    await this.eachPage<{ items: LoyverseItem[]; cursor?: string }>(
      "items",
      (page) => {
      for (const item of page.items ?? []) {
        const v = item.variants?.[0];
        items.push({
          id: item.id,
          sku: v?.sku ?? null,
          name: item.item_name,
          price: v?.default_price ?? null,
          stock: null, // filled from inventory below
        });
        for (const variant of item.variants ?? []) {
          variantToItem.set(variant.variant_id, item.id);
        }
      }
      }
    );

    // Stock levels per variant
    const stockByVariant = new Map<string, number>();
    await this.eachPage<{
        inventory_levels: Array<{ variant_id: string; in_stock: number }>;
        cursor?: string;
      }>("inventory", (page) => {
        for (const level of page.inventory_levels ?? []) {
          stockByVariant.set(
            level.variant_id,
            (stockByVariant.get(level.variant_id) ?? 0) + level.in_stock
          );
        }
      }
    );

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
