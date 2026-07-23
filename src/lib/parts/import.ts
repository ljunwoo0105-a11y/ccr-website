import "server-only";
import { z } from "zod";
import { db } from "@/lib/db";
import { DEVICE_TYPES, PART_QUALITIES, QUALITY_LABELS } from "@/lib/config";
import { partSchema } from "@/lib/validation";

/**
 * Price-list CSV import for the admin catalog.
 *
 * Contract: the caller uploads raw CSV text; `mode: "preview"` returns what
 * WOULD happen row by row (create / update / error) without writing, and
 * `mode: "apply"` performs the writes for the valid rows in one transaction
 * and reports the same per-row breakdown. Row validation reuses `partSchema`
 * so the import can never accept a part the manual form would reject.
 *
 * Matching (update vs create), in order:
 *   1. `sku` — if the CSV row has one and exactly one existing part carries
 *      it, that part is updated.
 *   2. Composite identity — deviceType+brand+model+repairType+quality+colour
 *      (case-insensitive). Exactly one match updates; multiple = error row
 *      (ambiguous), none = create.
 * On update, only columns present in the CSV are written; empty cells leave
 * the stored value untouched. On create, empty optional cells use defaults.
 */

export const MAX_IMPORT_ROWS = 1000;

const REQUIRED_COLUMNS = [
  "devicetype",
  "brand",
  "model",
  "repairtype",
  "quality",
  "costprice",
  "sellprice",
] as const;

const OPTIONAL_COLUMNS = [
  "colour",
  "warrantydays",
  "stockqty",
  "sku",
  "supplier",
  "notes",
  "active",
] as const;

const COLUMN_ALIASES: Record<string, string> = {
  device: "devicetype",
  "device type": "devicetype",
  repair: "repairtype",
  "repair type": "repairtype",
  tier: "quality",
  cost: "costprice",
  "cost price": "costprice",
  sell: "sellprice",
  "sell price": "sellprice",
  price: "sellprice",
  warranty: "warrantydays",
  "warranty days": "warrantydays",
  stock: "stockqty",
  "stock qty": "stockqty",
  color: "colour",
};

export interface ImportRowResult {
  readonly line: number;
  readonly action: "create" | "update" | "error";
  readonly summary: string;
  readonly message?: string;
  /** For updates: "sellPrice 99 → 129" style change list. */
  readonly changes?: readonly string[];
}

export interface ImportResult {
  readonly ok: boolean;
  readonly mode: "preview" | "apply";
  readonly rows: readonly ImportRowResult[];
  readonly creates: number;
  readonly updates: number;
  readonly errors: number;
  /** Set when the file itself is unusable (bad header, too many rows). */
  readonly fileError?: string;
}

// --- CSV parsing (dependency-free) ---------------------------------------

function detectDelimiter(headerLine: string): string {
  const candidates = [",", ";", "\t"];
  let best = ",";
  let bestCount = 0;
  for (const candidate of candidates) {
    const count = headerLine.split(candidate).length - 1;
    if (count > bestCount) {
      best = candidate;
      bestCount = count;
    }
  }
  return best;
}

/** RFC-4180-ish: quoted fields, "" escapes, newlines inside quotes. */
function parseCsv(text: string, delimiter: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let cell = "";
  let inQuotes = false;
  const source = text.charCodeAt(0) === 0xfeff ? text.slice(1) : text;

  for (let i = 0; i < source.length; i++) {
    const ch = source[i];
    if (inQuotes) {
      if (ch === '"') {
        if (source[i + 1] === '"') {
          cell += '"';
          i++;
        } else {
          inQuotes = false;
        }
      } else {
        cell += ch;
      }
      continue;
    }
    if (ch === '"') {
      inQuotes = true;
    } else if (ch === delimiter) {
      row.push(cell);
      cell = "";
    } else if (ch === "\n" || ch === "\r") {
      if (ch === "\r" && source[i + 1] === "\n") i++;
      row.push(cell);
      cell = "";
      rows.push(row);
      row = [];
    } else {
      cell += ch;
    }
  }
  row.push(cell);
  rows.push(row);

  return rows.filter((cells) => cells.some((value) => value.trim() !== ""));
}

// --- Cell coercion ---------------------------------------------------------

const QUALITY_BY_LABEL = new Map<string, string>(
  Object.entries(QUALITY_LABELS).map(([value, label]) => [
    label.toLowerCase(),
    value,
  ])
);

function coerceQuality(raw: string): string | null {
  const upper = raw.trim().toUpperCase();
  if ((PART_QUALITIES as readonly string[]).includes(upper)) return upper;
  return QUALITY_BY_LABEL.get(raw.trim().toLowerCase()) ?? null;
}

function coerceDeviceType(raw: string): string | null {
  const needle = raw.trim().toLowerCase();
  return DEVICE_TYPES.find((value) => value.toLowerCase() === needle) ?? null;
}

function coerceNumber(raw: string): number | null {
  const cleaned = raw.replace(/[$€£,\s]|AUD|USD/gi, "");
  if (cleaned === "") return null;
  const value = Number(cleaned);
  return Number.isFinite(value) ? value : null;
}

function coerceBoolean(raw: string): boolean | null {
  const needle = raw.trim().toLowerCase();
  if (["true", "yes", "y", "1", "active"].includes(needle)) return true;
  if (["false", "no", "n", "0", "inactive"].includes(needle)) return false;
  return null;
}

// --- Row assembly ----------------------------------------------------------

type ParsedRow = {
  readonly line: number;
  readonly values: Partial<z.infer<typeof partSchema>>;
  /** Column names present in the file (drives update-only-provided). */
  readonly provided: ReadonlySet<string>;
  readonly error?: string;
};

function assembleRow(
  line: number,
  header: readonly string[],
  cells: readonly string[]
): ParsedRow {
  const get = (column: string): string | undefined => {
    const index = header.indexOf(column);
    if (index === -1) return undefined;
    return cells[index]?.trim() ?? "";
  };

  const provided = new Set<string>();
  const values: Record<string, unknown> = {};
  const problems: string[] = [];

  const deviceRaw = get("devicetype") ?? "";
  const device = deviceRaw ? coerceDeviceType(deviceRaw) : null;
  if (!device) problems.push(deviceRaw ? `unknown deviceType "${deviceRaw}"` : "deviceType is required");
  else values.deviceType = device;

  for (const key of ["brand", "model", "repairtype"] as const) {
    const value = get(key) ?? "";
    if (!value) problems.push(`${key === "repairtype" ? "repairType" : key} is required`);
    else values[key === "repairtype" ? "repairType" : key] = value;
  }

  const qualityRaw = get("quality") ?? "";
  const quality = qualityRaw ? coerceQuality(qualityRaw) : null;
  if (!quality) {
    problems.push(
      qualityRaw
        ? `unknown quality "${qualityRaw}" (use ${PART_QUALITIES.join("/")})`
        : "quality is required"
    );
  } else {
    values.quality = quality;
  }

  for (const key of ["costprice", "sellprice"] as const) {
    const raw = get(key) ?? "";
    const value = raw === "" ? null : coerceNumber(raw);
    if (value === null) {
      problems.push(raw === "" ? `${key === "costprice" ? "costPrice" : "sellPrice"} is required` : `${key} "${raw}" is not a number`);
    } else {
      values[key === "costprice" ? "costPrice" : "sellPrice"] = value;
    }
  }

  const warrantyRaw = get("warrantydays");
  if (warrantyRaw !== undefined) {
    provided.add("warrantyDays");
    if (warrantyRaw !== "") {
      const value = coerceNumber(warrantyRaw);
      if (value === null || !Number.isInteger(value)) problems.push(`warrantyDays "${warrantyRaw}" is not a whole number`);
      else values.warrantyDays = value;
    }
  }

  const stockRaw = get("stockqty");
  if (stockRaw !== undefined) {
    provided.add("stockQty");
    if (stockRaw !== "") {
      const value = coerceNumber(stockRaw);
      if (value === null || !Number.isInteger(value)) problems.push(`stockQty "${stockRaw}" is not a whole number`);
      else values.stockQty = value;
    }
  }

  for (const key of ["colour", "sku", "supplier", "notes"] as const) {
    const raw = get(key);
    if (raw !== undefined) {
      provided.add(key);
      if (raw !== "") values[key] = raw;
    }
  }

  const activeRaw = get("active");
  if (activeRaw !== undefined) {
    provided.add("active");
    if (activeRaw !== "") {
      const value = coerceBoolean(activeRaw);
      if (value === null) problems.push(`active "${activeRaw}" is not true/false`);
      else values.active = value;
    }
  }

  if (problems.length > 0) {
    return { line, values: {}, provided, error: problems.join("; ") };
  }
  return { line, values: values as ParsedRow["values"], provided };
}

// --- Matching and application ----------------------------------------------

function identity(values: {
  deviceType?: string;
  brand?: string;
  model?: string;
  repairType?: string;
  quality?: string;
  colour?: string | null;
}): string {
  return [
    values.deviceType ?? "",
    values.brand ?? "",
    values.model ?? "",
    values.repairType ?? "",
    values.quality ?? "",
    values.colour ?? "",
  ]
    .join("|")
    .toLowerCase();
}

function rowSummary(values: ParsedRow["values"]): string {
  return `${values.brand} ${values.model} · ${values.repairType} · ${values.quality}${values.colour ? ` · ${values.colour}` : ""}`;
}

export async function importPriceList(
  csv: string,
  mode: "preview" | "apply"
): Promise<ImportResult> {
  const failFile = (fileError: string): ImportResult => ({
    ok: false,
    mode,
    rows: [],
    creates: 0,
    updates: 0,
    errors: 0,
    fileError,
  });

  const delimiter = detectDelimiter(csv.split(/\r?\n/, 1)[0] ?? "");
  const grid = parseCsv(csv, delimiter);
  if (grid.length < 2) {
    return failFile("The file needs a header row and at least one data row.");
  }

  const header = grid[0].map((cell) => {
    const normalized = cell.trim().toLowerCase().replace(/[_-]+/g, " ").trim();
    return COLUMN_ALIASES[normalized] ?? normalized.replace(/\s+/g, "");
  });
  const missing = REQUIRED_COLUMNS.filter((column) => !header.includes(column));
  if (missing.length > 0) {
    return failFile(
      `Missing required column(s): ${missing.join(", ")}. Required: deviceType, brand, model, repairType, quality, costPrice, sellPrice. Optional: ${OPTIONAL_COLUMNS.join(", ")}.`
    );
  }

  const dataRows = grid.slice(1);
  if (dataRows.length > MAX_IMPORT_ROWS) {
    return failFile(`Too many rows (${dataRows.length}). The limit is ${MAX_IMPORT_ROWS} per import.`);
  }

  // Existing catalog snapshot for matching (all parts incl. inactive).
  const existing = await db.part.findMany({
    select: {
      id: true,
      deviceType: true,
      brand: true,
      model: true,
      repairType: true,
      quality: true,
      colour: true,
      costPrice: true,
      sellPrice: true,
      warrantyDays: true,
      stockQty: true,
      sku: true,
      supplier: true,
      notes: true,
      active: true,
    },
  });
  const bySku = new Map<string, typeof existing>();
  for (const part of existing) {
    const sku = part.sku?.trim().toLowerCase();
    if (!sku) continue;
    const bucket = bySku.get(sku) ?? [];
    bucket.push(part);
    bySku.set(sku, bucket);
  }
  const byIdentity = new Map<string, typeof existing>();
  for (const part of existing) {
    const key = identity(part);
    const bucket = byIdentity.get(key) ?? [];
    bucket.push(part);
    byIdentity.set(key, bucket);
  }

  const results: ImportRowResult[] = [];
  const creates: { line: number; data: z.infer<typeof partSchema> }[] = [];
  const updates: {
    line: number;
    id: string;
    data: Partial<z.infer<typeof partSchema>>;
  }[] = [];
  const seenInFile = new Map<string, number>();

  for (let i = 0; i < dataRows.length; i++) {
    const line = i + 2; // 1-based, after header
    const parsed = assembleRow(line, header, dataRows[i]);
    if (parsed.error) {
      results.push({ line, action: "error", summary: dataRows[i].slice(0, 4).join(" "), message: parsed.error });
      continue;
    }

    const key = identity(parsed.values);
    const duplicateOf = seenInFile.get(key);
    if (duplicateOf !== undefined) {
      results.push({
        line,
        action: "error",
        summary: rowSummary(parsed.values),
        message: `duplicate of line ${duplicateOf} (same device/brand/model/repair/quality/colour)`,
      });
      continue;
    }
    seenInFile.set(key, line);

    // Resolve the target part.
    const sku = typeof parsed.values.sku === "string" ? parsed.values.sku.trim().toLowerCase() : "";
    let target: (typeof existing)[number] | null = null;
    let ambiguous = false;
    if (sku && bySku.has(sku)) {
      const bucket = bySku.get(sku)!;
      if (bucket.length === 1) target = bucket[0];
      else ambiguous = true;
    }
    if (!target && !ambiguous) {
      const bucket = byIdentity.get(key) ?? [];
      if (bucket.length === 1) target = bucket[0];
      else if (bucket.length > 1) ambiguous = true;
    }
    if (ambiguous) {
      results.push({
        line,
        action: "error",
        summary: rowSummary(parsed.values),
        message: "matches more than one existing part — fix the duplicates in the catalog first or give the rows distinct SKUs",
      });
      continue;
    }

    if (!target) {
      // Create. Fill defaults, then run the canonical schema.
      const candidate = {
        warrantyDays: 90,
        stockQty: 0,
        active: true,
        ...parsed.values,
      };
      const validated = partSchema.safeParse(candidate);
      if (!validated.success) {
        results.push({
          line,
          action: "error",
          summary: rowSummary(parsed.values),
          message: validated.error.errors.map((issue) => `${issue.path.join(".")}: ${issue.message}`).join("; "),
        });
        continue;
      }
      creates.push({ line, data: validated.data });
      results.push({ line, action: "create", summary: rowSummary(parsed.values) });
      continue;
    }

    // Update: only provided fields; always the required price columns.
    const patch: Partial<z.infer<typeof partSchema>> = {
      costPrice: parsed.values.costPrice,
      sellPrice: parsed.values.sellPrice,
    };
    for (const key2 of ["warrantyDays", "stockQty", "colour", "sku", "supplier", "notes", "active"] as const) {
      if (parsed.provided.has(key2) && parsed.values[key2] !== undefined) {
        (patch as Record<string, unknown>)[key2] = parsed.values[key2];
      }
    }
    const validated = partSchema.partial().safeParse(patch);
    if (!validated.success) {
      results.push({
        line,
        action: "error",
        summary: rowSummary(parsed.values),
        message: validated.error.errors.map((issue) => `${issue.path.join(".")}: ${issue.message}`).join("; "),
      });
      continue;
    }

    const changes: string[] = [];
    for (const [field, next] of Object.entries(validated.data)) {
      const current = (target as Record<string, unknown>)[field];
      if (current !== next && !(current === null && next === undefined)) {
        changes.push(`${field} ${current ?? "—"} → ${next ?? "—"}`);
      }
    }
    if (changes.length === 0) {
      results.push({ line, action: "update", summary: rowSummary(parsed.values), changes: ["no changes"] });
      continue;
    }
    updates.push({ line, id: target.id, data: validated.data });
    results.push({ line, action: "update", summary: rowSummary(parsed.values), changes });
  }

  const errorCount = results.filter((row) => row.action === "error").length;
  const changedUpdates = updates.length;

  if (mode === "apply" && (creates.length > 0 || changedUpdates > 0)) {
    await db.$transaction(async (transaction) => {
      for (const entry of creates) {
        await transaction.part.create({ data: entry.data });
      }
      for (const entry of updates) {
        await transaction.part.update({ where: { id: entry.id }, data: entry.data });
      }
    });
  }

  return {
    ok: true,
    mode,
    rows: results,
    creates: creates.length,
    updates: changedUpdates,
    errors: errorCount,
  };
}
