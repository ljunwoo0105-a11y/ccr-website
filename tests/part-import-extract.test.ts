import assert from "node:assert/strict";
import test from "node:test";
import { deflateRawSync } from "node:zlib";

import {
  CANONICAL_HEADER,
  ExtractError,
  FALLBACK_QUALITY,
  fillMissingQuality,
  gridToCsv,
  parseXlsxGrid,
  rowsToCsv,
} from "../src/lib/parts/extract-core";

// --- In-test zip writer (store or deflate), enough for the xlsx reader ------

interface ZipInput {
  readonly name: string;
  readonly data: string;
  readonly deflate?: boolean;
  /** Lie about the decompressed size in the central directory. */
  readonly fakeUncompSize?: number;
}

function buildZip(files: readonly ZipInput[]): Buffer {
  const locals: Buffer[] = [];
  const centrals: Buffer[] = [];
  let offset = 0;

  for (const file of files) {
    const name = Buffer.from(file.name, "utf8");
    const raw = Buffer.from(file.data, "utf8");
    const stored = file.deflate ? deflateRawSync(raw) : raw;
    const method = file.deflate ? 8 : 0;

    const local = Buffer.alloc(30);
    local.writeUInt32LE(0x04034b50, 0);
    local.writeUInt16LE(20, 4);
    local.writeUInt16LE(method, 8);
    local.writeUInt32LE(stored.length, 18);
    local.writeUInt32LE(raw.length, 22);
    local.writeUInt16LE(name.length, 26);
    locals.push(local, name, stored);

    const central = Buffer.alloc(46);
    central.writeUInt32LE(0x02014b50, 0);
    central.writeUInt16LE(20, 4);
    central.writeUInt16LE(20, 6);
    central.writeUInt16LE(method, 10);
    central.writeUInt32LE(stored.length, 20);
    central.writeUInt32LE(file.fakeUncompSize ?? raw.length, 24);
    central.writeUInt16LE(name.length, 28);
    central.writeUInt32LE(offset, 42);
    centrals.push(central, name);

    offset += 30 + name.length + stored.length;
  }

  const centralStart = offset;
  const centralSize = centrals.reduce((total, part) => total + part.length, 0);
  const eocd = Buffer.alloc(22);
  eocd.writeUInt32LE(0x06054b50, 0);
  eocd.writeUInt16LE(files.length, 8);
  eocd.writeUInt16LE(files.length, 10);
  eocd.writeUInt32LE(centralSize, 12);
  eocd.writeUInt32LE(centralStart, 16);

  return Buffer.concat([...locals, ...centrals, eocd]);
}

const SHARED_STRINGS = [
  '<?xml version="1.0"?><sst xmlns="x">',
  "<si><t>brand</t></si>",
  "<si><t>Apple</t></si>",
  "<si><r><t>Sam</t></r><r><t>sung</t></r></si>",
  "<si><t>Screen &amp; digitiser &quot;combo&quot;</t></si>",
  "</sst>",
].join("");

const SHEET = [
  '<?xml version="1.0"?><worksheet xmlns="x"><sheetData>',
  // Header row: shared string + inline string + plain header.
  '<row r="1">',
  '<c r="A1" t="s"><v>0</v></c>',
  '<c r="B1" t="inlineStr"><is><t>model</t></is></c>',
  '<c r="C1" t="inlineStr"><is><t>cost</t></is></c>',
  "</row>",
  // Data row: shared string, number, skipped column handled by r refs.
  '<row r="2">',
  '<c r="A2" t="s"><v>1</v></c>',
  '<c r="C2"><v>65.5</v></c>',
  "</row>",
  // Rich text shared string + entity-bearing shared string + empty cell.
  '<row r="3">',
  '<c r="A3" t="s"><v>2</v></c>',
  '<c r="B3" t="s"><v>3</v></c>',
  '<c r="C3"/>',
  "</row>",
  // Whitespace-only row must be dropped.
  '<row r="4"><c r="A4" t="inlineStr"><is><t> </t></is></c></row>',
  "</sheetData></worksheet>",
].join("");

test("reads stored and deflated xlsx worksheets into a padded grid", () => {
  for (const deflate of [false, true]) {
    const zip = buildZip([
      { name: "[Content_Types].xml", data: "<Types/>", deflate },
      { name: "xl/sharedStrings.xml", data: SHARED_STRINGS, deflate },
      { name: "xl/worksheets/sheet1.xml", data: SHEET, deflate },
    ]);

    const grid = parseXlsxGrid(zip);

    assert.deepEqual(grid, [
      ["brand", "model", "cost"],
      ["Apple", "", "65.5"],
      ["Samsung", 'Screen & digitiser "combo"', ""],
    ]);
  }
});

test("rejects buffers that are not zip archives", () => {
  assert.throws(() => parseXlsxGrid(Buffer.from("just text")), ExtractError);
  assert.throws(
    () => parseXlsxGrid(buildZip([{ name: "readme.txt", data: "hello" }])),
    /No worksheet/
  );
});

test("truncated archives fail as ExtractError, never a raw RangeError", () => {
  const zip = buildZip([{ name: "xl/worksheets/sheet1.xml", data: SHEET }]);
  // Chop the local data out from under the central directory.
  const truncated = Buffer.concat([zip.subarray(0, 10), zip.subarray(zip.length - 60)]);
  assert.throws(() => parseXlsxGrid(truncated), ExtractError);
});

test("refuses zip entries that claim oversized decompressed data", () => {
  const zip = buildZip([
    {
      name: "xl/worksheets/sheet1.xml",
      data: SHEET,
      deflate: true,
      fakeUncompSize: 512 * 1024 * 1024,
    },
  ]);
  assert.throws(() => parseXlsxGrid(zip), /too large/);
});

test("caps crafted column references instead of ballooning the row", () => {
  const sheet =
    '<worksheet><sheetData><row r="1">' +
    '<c r="A1" t="inlineStr"><is><t>ok</t></is></c>' +
    '<c r="ZZZZ1" t="inlineStr"><is><t>far away</t></is></c>' +
    "</row></sheetData></worksheet>";
  const grid = parseXlsxGrid(buildZip([{ name: "xl/worksheets/sheet1.xml", data: sheet }]));
  assert.deepEqual(grid, [["ok"]]);
});

test("invalid character references decode to their literal text", () => {
  const sheet =
    '<worksheet><sheetData><row r="1">' +
    '<c r="A1" t="inlineStr"><is><t>bad &#x110000; and &#abc; kept &#65;</t></is></c>' +
    "</row></sheetData></worksheet>";
  const grid = parseXlsxGrid(buildZip([{ name: "xl/worksheets/sheet1.xml", data: sheet }]));
  assert.deepEqual(grid, [["bad &#x110000; and &#abc; kept A"]]);
});

test("grid CSV escapes delimiters, quotes and newlines", () => {
  const csv = gridToCsv([
    ["plain", 'with "quotes"', "with,comma"],
    ["line\nbreak", "", "ok"],
  ]);

  assert.equal(
    csv,
    'plain,"with ""quotes""","with,comma"\n"line\nbreak",,ok'
  );
});

test("grid CSV quotes semicolons and tabs so delimiter sniffing stays on comma", () => {
  assert.equal(gridToCsv([["a;b", "c\td"]]), '"a;b","c\td"');
});

test("blank quality tiers default to the lowest tier with a count", () => {
  const { rows, defaulted } = fillMissingQuality([
    { brand: "Apple", quality: "GENUINE" },
    { brand: "Apple", quality: "  " },
    { brand: "Samsung", quality: null },
    { brand: "Oppo" },
  ]);

  assert.equal(defaulted, 3);
  assert.deepEqual(
    rows.map((row) => row.quality),
    ["GENUINE", FALLBACK_QUALITY, FALLBACK_QUALITY, FALLBACK_QUALITY]
  );
});

test("transcribed rows serialise onto the canonical header", () => {
  const csv = rowsToCsv([
    {
      deviceType: "Phone",
      brand: "Apple",
      model: "iPhone 14",
      repairType: "Screen Replacement",
      quality: "PREMIUM",
      costPrice: 65.5,
      stockQty: 3,
    },
    { brand: 'Acme, "Best"', model: "X\nPro", sellPrice: "199" },
  ]);

  const lines = csv.split("\n");
  assert.equal(lines[0], CANONICAL_HEADER.join(","));
  assert.equal(lines[1], "Phone,Apple,iPhone 14,Screen Replacement,PREMIUM,,65.5,,,3,,,");
  // The embedded newline keeps row 2 spread over two physical lines; the
  // leading comma is the empty deviceType cell.
  assert.equal(lines.slice(2).join("\n"), ',"Acme, ""Best""","X\nPro",,,,,199,,,,,');
});
