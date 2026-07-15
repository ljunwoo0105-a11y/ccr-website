import assert from "node:assert/strict";
import test from "node:test";

import { responseErrorMessage } from "../src/components/staff/part-catalog-api";
import { parseCatalogPartsResponse } from "../src/components/staff/part-catalog-schema";

function catalogPart(overrides: Record<string, unknown> = {}): Record<string, unknown> {
  return {
    id: "part-1",
    deviceType: "Phone",
    brand: "Apple",
    model: "iPhone 15",
    repairType: "Screen Replacement",
    quality: "OEM",
    colour: null,
    costPrice: 80,
    sellPrice: 160,
    warrantyDays: 90,
    stockQty: 2,
    sku: null,
    supplier: null,
    posItemId: null,
    notes: null,
    active: true,
    createdAt: "2026-07-11T00:00:00.000Z",
    updatedAt: "2026-07-11T00:00:00.000Z",
    ...overrides,
  };
}

test("parseCatalogPartsResponse returns typed rows when the catalog envelope is valid", () => {
  // Given: a representative successful catalog response row from the API.
  const body = { ok: true, data: [catalogPart()] };

  // When: the catalog boundary parses the response.
  const parsed = parseCatalogPartsResponse(body);

  // Then: the exact row contract, including narrowed quality, is returned.
  assert.deepEqual(parsed, {
    ok: true,
    data: [catalogPart()],
  });
});

test("parseCatalogPartsResponse rejects malformed response envelopes", () => {
  // Given: an API response body that is missing the required data array.
  const body = { ok: true };

  // When / Then: the catalog boundary rejects it before UI state is updated.
  assert.throws(
    () => parseCatalogPartsResponse(body),
    /Invalid catalog response/
  );
});

test("parseCatalogPartsResponse rejects invalid part quality values", () => {
  // Given: a catalog response containing a part quality outside the configured tiers.
  const body = {
    ok: true,
    data: [catalogPart({ quality: "COUNTERFEIT" })],
  };

  // When / Then: the quality is rejected at the response boundary.
  assert.throws(
    () => parseCatalogPartsResponse(body),
    /Invalid catalog response/
  );
});

test("responseErrorMessage returns null for ok mutation success envelopes", async () => {
  // Given: a successful admin mutation response envelope.
  const response = new Response(JSON.stringify({ ok: true, data: { id: "part-1" } }), {
    status: 200,
  });

  // When: the catalog mutation handler asks for a visible message.
  const message = await responseErrorMessage(response, "Could not update the part");

  // Then: the success envelope remains observable as no inline error.
  assert.equal(message, null);
});

test("responseErrorMessage returns inline API error for failed mutation response", async () => {
  // Given: a failed admin mutation response with a server error envelope.
  const response = new Response(
    JSON.stringify({ ok: false, error: "Part is referenced by repair records" }),
    { status: 409 }
  );

  // When: the catalog mutation handler asks for the visible message.
  const message = await responseErrorMessage(response, "Could not update the part");

  // Then: the exact server message is available for the inline alert.
  assert.equal(message, "Part is referenced by repair records");
});

test("responseErrorMessage returns fallback for malformed json envelopes", async () => {
  // Given: a failed mutation response whose JSON body is not a valid API envelope.
  const response = new Response(JSON.stringify({ ok: "yes", error: "ignored" }), {
    status: 500,
  });

  // When: the catalog mutation handler asks for the visible message.
  const message = await responseErrorMessage(response, "Could not update the part");

  // Then: a stable inline fallback is used instead of trusting malformed data.
  assert.equal(message, "Could not update the part");
});

test("responseErrorMessage returns fallback for non-json failed mutation response", async () => {
  // Given: a failed mutation response that cannot be parsed to JSON.
  const response = new Response("not json", { status: 500 });

  // When: the catalog mutation handler asks for the visible message.
  const message = await responseErrorMessage(response, "Could not update the part");

  // Then: a stable inline fallback is available and no reload is required.
  assert.equal(message, "Could not update the part");
});
