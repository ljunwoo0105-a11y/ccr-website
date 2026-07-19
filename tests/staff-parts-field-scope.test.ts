import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

import { parseCatalogPartsResponse } from "../src/components/staff/part-catalog-schema";

const ADMIN_ONLY_FIELDS = ["costPrice", "supplier", "posItemId", "notes", "sku"];

test("staff parts API response omits admin-only fields and still parses", () => {
  // Given: the sell-side row shape the parts API returns to STAFF sessions.
  const staffRow = {
    id: "part-1",
    deviceType: "Phone",
    brand: "Apple",
    model: "iPhone 15",
    repairType: "Screen Replacement",
    quality: "AFTERMARKET",
    colour: null,
    sellPrice: 219,
    warrantyDays: 90,
    stockQty: 3,
    active: true,
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-01T00:00:00.000Z",
  };

  // When: the client boundary parser receives it.
  const parsed = parseCatalogPartsResponse({ ok: true, data: [staffRow] });

  // Then: it parses without any admin-only cost/supplier fields present.
  assert.equal(parsed.ok, true);
  for (const field of ADMIN_ONLY_FIELDS) {
    assert.equal(field in staffRow, false, field);
  }
});

test("parts route confines STAFF to a select without cost/supplier data", () => {
  // Given: the GET handler serves both roles from one route.
  const source = readFileSync("src/app/api/staff/parts/route.ts", "utf8");

  // When/Then: the staff branch uses an explicit select that names no
  // admin-only field, and staff cannot unpin the active filter.
  const selectBlock = source.match(
    /const STAFF_PART_SELECT = \{[\s\S]*?\} as const;/
  )?.[0];
  assert.ok(selectBlock, "STAFF_PART_SELECT must exist");
  for (const field of ADMIN_ONLY_FIELDS) {
    assert.doesNotMatch(selectBlock, new RegExp(`\\b${field}\\b`), field);
  }
  assert.match(source, /if \(!isAdmin \|\| active === "true"\) where\.active = true;/);
  assert.match(source, /select: STAFF_PART_SELECT/);
});
