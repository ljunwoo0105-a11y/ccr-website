import { inflateRawSync } from "node:zlib";

/**
 * Dependency-free parsing core for the price-file import: minimal .xlsx
 * reading (zip + worksheet XML) and CSV writing. No server-only imports so
 * the logic stays directly testable; the AI transcription entry points live
 * in ./extract.ts.
 */

export class ExtractError extends Error {}

export const CANONICAL_HEADER = [
  "deviceType",
  "brand",
  "model",
  "repairType",
  "quality",
  "colour",
  "costPrice",
  "sellPrice",
  "warrantyDays",
  "stockQty",
  "sku",
  "supplier",
  "notes",
] as const;

export type CanonicalColumn = (typeof CANONICAL_HEADER)[number];

/** One AI-transcribed row; values arrive as strings or numbers. */
export type PriceRowInput = Partial<
  Record<CanonicalColumn, string | number | null | undefined>
>;

export const MAX_XLSX_ROWS = 2000;
export const MAX_XLSX_COLS = 256;
/** Per-entry decompression ceiling — a price sheet is nowhere near this. */
const MAX_ENTRY_BYTES = 64 * 1024 * 1024;

// --- Minimal zip reading -----------------------------------------------------

interface ZipEntry {
  readonly name: string;
  readonly method: number;
  readonly compSize: number;
  readonly uncompSize: number;
  readonly offset: number;
}

function readZipEntries(buffer: Buffer): ZipEntry[] {
  // End-of-central-directory: scan back for PK\x05\x06.
  let eocd = -1;
  const floor = Math.max(0, buffer.length - 65_557);
  for (let i = buffer.length - 22; i >= floor; i--) {
    if (buffer.readUInt32LE(i) === 0x06054b50) {
      eocd = i;
      break;
    }
  }
  if (eocd === -1) throw new ExtractError("Not a valid .xlsx file (no zip directory).");

  const count = buffer.readUInt16LE(eocd + 10);
  let cursor = buffer.readUInt32LE(eocd + 16);
  const entries: ZipEntry[] = [];
  for (let i = 0; i < count; i++) {
    if (cursor + 46 > buffer.length || buffer.readUInt32LE(cursor) !== 0x02014b50) break;
    const method = buffer.readUInt16LE(cursor + 10);
    const compSize = buffer.readUInt32LE(cursor + 20);
    const uncompSize = buffer.readUInt32LE(cursor + 24);
    const nameLen = buffer.readUInt16LE(cursor + 28);
    const extraLen = buffer.readUInt16LE(cursor + 30);
    const commentLen = buffer.readUInt16LE(cursor + 32);
    const offset = buffer.readUInt32LE(cursor + 42);
    const name = buffer.subarray(cursor + 46, cursor + 46 + nameLen).toString("utf8");
    entries.push({ name, method, compSize, uncompSize, offset });
    cursor += 46 + nameLen + extraLen + commentLen;
  }
  return entries;
}

function readZipFile(buffer: Buffer, entry: ZipEntry): Buffer {
  if (
    entry.offset + 30 > buffer.length ||
    buffer.readUInt32LE(entry.offset) !== 0x04034b50
  ) {
    throw new ExtractError("Corrupt .xlsx file (bad local header).");
  }
  // Zip-bomb guard: trust neither size field — cap what we will inflate.
  if (entry.uncompSize > MAX_ENTRY_BYTES || entry.compSize > MAX_ENTRY_BYTES) {
    throw new ExtractError("That .xlsx is too large to read — export it as CSV instead.");
  }
  const nameLen = buffer.readUInt16LE(entry.offset + 26);
  const extraLen = buffer.readUInt16LE(entry.offset + 28);
  const start = entry.offset + 30 + nameLen + extraLen;
  const data = buffer.subarray(start, start + entry.compSize);
  if (entry.method === 0) return Buffer.from(data);
  if (entry.method === 8) {
    return inflateRawSync(data, { maxOutputLength: MAX_ENTRY_BYTES });
  }
  throw new ExtractError("Unsupported .xlsx compression method.");
}

// --- Worksheet XML -------------------------------------------------------------

const XML_ENTITIES: Record<string, string> = {
  amp: "&",
  lt: "<",
  gt: ">",
  quot: '"',
  apos: "'",
};

function decodeXml(text: string): string {
  return text.replace(/&(#x?[0-9a-fA-F]+|[a-z]+);/g, (whole, body: string) => {
    if (body.startsWith("#")) {
      const hex = body[1] === "x" || body[1] === "X";
      const code = parseInt(body.slice(hex ? 2 : 1), hex ? 16 : 10);
      // Reject NaN and out-of-range references instead of throwing.
      if (!Number.isInteger(code) || code < 0 || code > 0x10ffff) return whole;
      return String.fromCodePoint(code);
    }
    return XML_ENTITIES[body] ?? whole;
  });
}

function textOf(xml: string): string {
  // Concatenate every <t> run (plain and rich-text strings).
  let out = "";
  const re = /<t(?:\s[^>]*)?>([\s\S]*?)<\/t>/g;
  let match: RegExpExecArray | null;
  while ((match = re.exec(xml)) !== null) out += decodeXml(match[1]);
  return out;
}

function columnIndex(ref: string): number {
  let index = 0;
  for (const ch of ref) {
    if (ch < "A" || ch > "Z") break;
    index = index * 26 + (ch.charCodeAt(0) - 64);
  }
  return index - 1;
}

/** First worksheet of an .xlsx as a trimmed string grid. */
export function parseXlsxGrid(buffer: Buffer): string[][] {
  try {
    return parseXlsxGridInner(buffer);
  } catch (e) {
    // Truncated downloads, renamed zips and hostile input all funnel into one
    // friendly failure instead of a raw RangeError/zlib 500.
    if (e instanceof ExtractError) throw e;
    throw new ExtractError("Corrupt or unreadable .xlsx file — try re-exporting it as CSV.");
  }
}

function parseXlsxGridInner(buffer: Buffer): string[][] {
  const entries = readZipEntries(buffer);
  const byName = new Map(entries.map((entry) => [entry.name, entry]));

  const sheetEntry =
    byName.get("xl/worksheets/sheet1.xml") ??
    entries
      .filter((entry) => /^xl\/worksheets\/sheet\d+\.xml$/.test(entry.name))
      .sort((a, b) => a.name.localeCompare(b.name, "en", { numeric: true }))[0];
  if (!sheetEntry) throw new ExtractError("No worksheet found in the .xlsx file.");

  const shared: string[] = [];
  const sharedEntry = byName.get("xl/sharedStrings.xml");
  if (sharedEntry) {
    const xml = readZipFile(buffer, sharedEntry).toString("utf8");
    const re = /<si(?:\s[^>]*)?>([\s\S]*?)<\/si>/g;
    let match: RegExpExecArray | null;
    while ((match = re.exec(xml)) !== null) shared.push(textOf(match[1]));
  }

  const sheetXml = readZipFile(buffer, sheetEntry).toString("utf8");
  const grid: string[][] = [];
  const rowRe = /<row(?:\s[^>]*)?>([\s\S]*?)<\/row>/g;
  const cellRe = /<c\s([^>]*?)\/>|<c\s([^>]*?)>([\s\S]*?)<\/c>/g;
  let rowMatch: RegExpExecArray | null;
  while ((rowMatch = rowRe.exec(sheetXml)) !== null) {
    if (grid.length >= MAX_XLSX_ROWS) break;
    const cells: string[] = [];
    let cellMatch: RegExpExecArray | null;
    let fallbackColumn = 0;
    while ((cellMatch = cellRe.exec(rowMatch[1])) !== null) {
      const attrs = cellMatch[1] ?? cellMatch[2] ?? "";
      const body = cellMatch[3] ?? "";
      const ref = /r="([A-Z]+)\d+"/.exec(attrs)?.[1];
      const column = ref ? columnIndex(ref) : fallbackColumn;
      fallbackColumn = column + 1;
      // A crafted r="ZZZZZ1" must not balloon the row array.
      if (column < 0 || column >= MAX_XLSX_COLS) continue;
      const type = /t="([^"]+)"/.exec(attrs)?.[1] ?? "n";

      let value = "";
      if (type === "inlineStr") {
        value = textOf(body);
      } else {
        const raw = /<v(?:\s[^>]*)?>([\s\S]*?)<\/v>/.exec(body)?.[1] ?? "";
        const decoded = decodeXml(raw);
        value = type === "s" ? (shared[Number(decoded)] ?? "") : decoded;
      }
      while (cells.length < column) cells.push("");
      cells[column] = value.trim();
    }
    grid.push(cells);
  }

  return grid.filter((cells) => cells.some((value) => value !== ""));
}

// --- CSV writing ----------------------------------------------------------------

function csvCell(value: string): string {
  // Semicolons and tabs are quoted too: the importer sniffs the delimiter
  // from the header line, and an unquoted ";" could flip its choice.
  return /[",;\t\n\r]/.test(value) ? `"${value.replace(/"/g, '""')}"` : value;
}

export function gridToCsv(grid: readonly (readonly string[])[]): string {
  return grid.map((row) => row.map(csvCell).join(",")).join("\n");
}

/**
 * Tier-less supplier lists are common (tiers mostly exist for screens); the
 * importer hard-requires a quality, so blank ones get the safest default —
 * the lowest tier with the shortest warranty — and the count is disclosed.
 */
export const FALLBACK_QUALITY = "AFTERMARKET";

export function fillMissingQuality(rows: readonly PriceRowInput[]): {
  rows: PriceRowInput[];
  defaulted: number;
} {
  let defaulted = 0;
  const filled = rows.map((row) => {
    const quality = row.quality;
    if (quality === undefined || quality === null || String(quality).trim() === "") {
      defaulted++;
      return { ...row, quality: FALLBACK_QUALITY };
    }
    return row;
  });
  return { rows: filled, defaulted };
}

/** Canonical-header CSV from transcribed rows. */
export function rowsToCsv(rows: readonly PriceRowInput[]): string {
  const lines = [CANONICAL_HEADER.join(",")];
  for (const row of rows) {
    lines.push(
      CANONICAL_HEADER.map((key) => {
        const value = row[key];
        return csvCell(value === undefined || value === null ? "" : String(value).trim());
      }).join(",")
    );
  }
  return lines.join("\n");
}
