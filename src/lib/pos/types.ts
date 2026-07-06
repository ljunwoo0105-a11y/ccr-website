/**
 * POS integration contract. The site links part stock levels with the shop's
 * point-of-sale system through this adapter interface — adding another POS
 * later means adding one file that implements PosAdapter.
 */

export interface PosItem {
  /** POS-side item id (stable). */
  id: string;
  sku: string | null;
  name: string;
  /** POS sell price, if exposed. */
  price: number | null;
  /** Units in stock across stores, null when the POS doesn't track it. */
  stock: number | null;
}

export interface PosAdapter {
  readonly provider: string;
  /** Cheap connectivity check used by the staff UI. */
  testConnection(): Promise<{ ok: boolean; message: string }>;
  /** Full item list (paginated internally). */
  listItems(): Promise<PosItem[]>;
}

export interface SyncResult {
  provider: string;
  itemsFetched: number;
  partsMatched: number;
  stockUpdated: number;
  unmatchedPosItems: number;
  errors: string[];
}
