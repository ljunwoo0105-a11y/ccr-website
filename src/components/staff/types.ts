/**
 * Client-side shapes of the staff API payloads (Prisma rows after JSON
 * serialisation — Date fields become ISO strings). Kept local to the staff
 * components so client bundles never import server-only modules.
 */

export interface ApiEnvelope<T> {
  ok: boolean;
  data?: T;
  error?: string;
}

export interface PartRow {
  id: string;
  deviceType: string;
  brand: string;
  model: string;
  repairType: string;
  quality: string;
  colour: string | null;
  costPrice: number;
  sellPrice: number;
  warrantyDays: number;
  stockQty: number;
  sku: string | null;
  supplier: string | null;
  posItemId: string | null;
  notes: string | null;
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CustomerMatch {
  id: string;
  name: string;
  phone: string;
  email: string | null;
  suburb: string | null;
}

export interface CustomerRow extends CustomerMatch {
  notes: string | null;
  createdAt: string;
}

export interface IntakeRow {
  id: string;
  customerId: string;
  staffId: string;
  deviceType: string;
  brand: string;
  model: string;
  imei: string | null;
  serialNo: string | null;
  /** JSON array of repair type strings. */
  repairTypes: string;
  /** JSON object — see preConditionSchema. */
  preCondition: string;
  accessories: string | null;
  conditionNotes: string | null;
  partQuality: string | null;
  warrantyDays: number | null;
  quotedPrice: number | null;
  depositPaid: number | null;
  status: string;
  customerSignature: string | null;
  createdAt: string;
  updatedAt: string;
  completedAt: string | null;
  customer: CustomerRow;
}

export interface LeadRow {
  id: string;
  name: string;
  email: string;
  phone: string;
  suburb: string;
  referralSource: string;
  referralOther: string | null;
  deviceType: string;
  brand: string;
  model: string;
  repairType: string;
  issueNotes: string | null;
  fromPriceAud: number | null;
  partQuality: string | null;
  status: string;
  emailedAt: string | null;
  emailError: string | null;
  createdAt: string;
}

// --- AI pricing result (mirrors @/lib/ai/pricing, which is server-only) ----
export interface AiMarketResearch {
  marketLowAud: number | null;
  marketAvgAud: number | null;
  marketHighAud: number | null;
  competitors: Array<{ name: string; priceAud: number | null; note: string }>;
  summary: string;
}

export interface AiMarginRecommendation {
  recommendedPriceAud: number;
  marginPct: number;
  positioning: string;
  reasoning: string;
}

export interface AiPricingResult {
  research: AiMarketResearch;
  recommendation: AiMarginRecommendation;
}

// --- POS sync result (mirrors @/lib/pos/types) ------------------------------
export interface PosSyncResult {
  provider: string;
  itemsFetched: number;
  partsMatched: number;
  stockUpdated: number;
  unmatchedPosItems: number;
  errors: string[];
}

/** Parse a JSON-encoded string array column (e.g. RepairIntake.repairTypes). */
export function parseJsonStringArray(raw: string | null | undefined): string[] {
  if (!raw) return [];
  try {
    const value: unknown = JSON.parse(raw);
    return Array.isArray(value) ? value.map(String) : [];
  } catch {
    return [];
  }
}
