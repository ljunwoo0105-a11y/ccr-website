import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import test from "node:test";

import {
  buildRecordActionRequest,
  deleteConfirmationMatches,
  intakeStatusPatch,
  repairFormStatusPatch,
  repairTypesLabel,
} from "../src/components/admin/records-state";
import {
  buildPriceAccessQuery,
  filterPriceAccessRows,
  priceAccessCells,
} from "../src/components/admin/price-access-state";

const ROOT = process.cwd();

function source(path: string): string {
  return readFileSync(`${ROOT}/${path}`, "utf8");
}

test("record helpers build validated requests and destructive confirmation state", () => {
  const patch = intakeStatusPatch("READY");
  assert.deepEqual(patch, { kind: "ok", patch: { status: "READY" } });

  const request = buildRecordActionRequest({
    type: "intake",
    id: "intake-1",
    action: { kind: "patch", patch: patch.kind === "ok" ? patch.patch : {} },
  });
  assert.equal(request.url, "/api/admin/records/intakes/intake-1");
  assert.equal(request.init.method, "PATCH");
  assert.equal(
    new Headers(request.init.headers).get("Content-Type"),
    "application/json"
  );
  assert.equal(request.init.body, "{\"status\":\"READY\"}");

  assert.deepEqual(repairFormStatusPatch("ACCEPTED"), {
    kind: "ok",
    patch: { status: "ACCEPTED" },
  });
  assert.deepEqual(intakeStatusPatch("LOST"), {
    kind: "invalid",
    message: "Choose a valid intake status.",
  });
  assert.equal(deleteConfirmationMatches("DELETE"), true);
  assert.equal(deleteConfirmationMatches("delete"), false);
});

test("legacy intake repair type values are scan-safe", () => {
  assert.equal(repairTypesLabel("[\"Screen\",\"Battery\"]"), "Screen, Battery");
  assert.equal(repairTypesLabel(null), "Legacy row: repair list unavailable");
  assert.equal(repairTypesLabel("{bad json"), "Legacy row: repair list unavailable");
});

test("price access helpers keep pagination and redacted row context read-only", () => {
  const row = {
    id: "log-1",
    user: { id: "user-1", name: "Admin", email: "admin@example.test" },
    context: {
      deviceType: "Phone",
      brand: "Apple",
      model: "iPhone 15",
      symptomCode: "no-power",
      outcome: "PART",
      matchedPartCount: 2,
    },
    hash: { ipHashPrefix: "abc123def456", userAgent: "Mozilla/5.0" },
    createdAt: "2026-07-11T00:00:00.000Z",
  };

  assert.equal(buildPriceAccessQuery({ page: 2, pageSize: 25 }), "page=2&pageSize=25");
  assert.equal(filterPriceAccessRows([row], "iphone").length, 1);
  assert.equal(filterPriceAccessRows([row], "sellPrice").length, 0);

  const visible = JSON.stringify(priceAccessCells(row));
  assert.match(visible, /Admin/);
  assert.match(visible, /abc123def456/);
  assert.doesNotMatch(visible, /ipHash/);
  assert.doesNotMatch(visible, /costPrice|sellPrice|rawIp|price/i);
});

test("admin records and price-access pages expose required state surfaces", () => {
  const requiredFiles = [
    "src/app/admin/records/page.tsx",
    "src/app/admin/price-access/page.tsx",
    "src/app/api/admin/records/intakes/route.ts",
    "src/app/api/admin/records/repair-forms/route.ts",
    "src/components/admin/records-manager.tsx",
    "src/components/admin/price-access-manager.tsx",
  ];
  for (const path of requiredFiles) {
    assert.equal(existsSync(`${ROOT}/${path}`), true, `${path} must exist`);
  }

  const recordsManager = [
    source("src/components/admin/records-manager.tsx"),
    source("src/components/admin/records-list.tsx"),
    source("src/components/admin/records-delete-modal.tsx"),
    source("src/components/admin/shared.ts"),
  ].join("\n");
  assert.match(recordsManager, /Loading intakes/);
  assert.match(recordsManager, /No intake records/);
  assert.match(recordsManager, /DELETE/);
  assert.match(recordsManager, /Network error/);

  const priceAccessManager = source("src/components/admin/price-access-manager.tsx");
  assert.match(priceAccessManager, /Loading price access logs/);
  assert.match(priceAccessManager, /No price access logs/);
  assert.match(priceAccessManager, /readOnly/);
  assert.doesNotMatch(priceAccessManager, /costPrice|sellPrice|rawIp/);

  const listRoutes = [
    source("src/app/api/admin/records/intakes/route.ts"),
    source("src/app/api/admin/records/repair-forms/route.ts"),
  ].join("\n");
  assert.match(listRoutes, /withAdmin/);
  assert.match(listRoutes, /adminOk/);
  assert.doesNotMatch(listRoutes, /costPrice|sellPrice|rawIp/);
});
