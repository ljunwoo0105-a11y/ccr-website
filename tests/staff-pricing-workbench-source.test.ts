import assert from "node:assert/strict";
import test from "node:test";

import { visiblePricedParts } from "../src/components/staff/pricing-workbench/state";
import {
  fetchCatalogOptions,
  fetchPricingMatch,
  fetchStaffSession,
} from "../src/components/staff/pricing-workbench/source";
import { pricedPart } from "./helpers/staff-pricing-workbench-fixtures";

test("source helpers parse anonymous, malformed, match, and abort responses", async () => {
  // Given: fake protected endpoints with successful and malformed responses.
  const calls: string[] = [];
  const fakeFetch = async (input: RequestInfo | URL, init?: RequestInit) => {
    const url = String(input);
    calls.push(url);
    if (init?.signal?.aborted) throw new DOMException("Aborted", "AbortError");
    if (url === "/api/staff/session") {
      return Response.json({ ok: false, error: "Unauthenticated" }, { status: 401 });
    }
    if (url.includes("deviceType=Other")) {
      return Response.json({ ok: true, data: { brands: [1] } });
    }
    if (url.startsWith("/api/staff/quote/catalog")) {
      return Response.json({ ok: true, data: { brands: ["Apple"] } });
    }
    if (url === "/api/staff/pricing/match") {
      return Response.json({
        ok: true,
        data: {
          outcome: "priced",
          diagnosisRuleId: "rule-screen",
          scope: "EXACT_MODEL",
          repairType: "Screen Replacement",
          parts: [pricedPart],
        },
      });
    }
    return Response.json({ ok: false, error: "Unhandled fake route" }, { status: 404 });
  };

  // When: helper functions cross protected fetch boundaries.
  const session = await fetchStaffSession(fakeFetch, new AbortController().signal);
  const options = await fetchCatalogOptions(
    fakeFetch,
    { deviceType: "Phone", brand: "", model: "" },
    new AbortController().signal
  );
  const match = await fetchPricingMatch(
    fakeFetch,
    {
      deviceType: "Phone",
      brand: "Apple",
      model: "iPhone 15",
      symptomCode: "screen-cracked",
    },
    new AbortController().signal
  );

  // Then: anonymous is hidden, catalog shape is parsed, and match prices survive.
  assert.deepEqual(session, { kind: "anonymous" });
  assert.deepEqual(options, { key: "brands", values: ["Apple"] });
  assert.deepEqual(visiblePricedParts(match), [pricedPart]);
  assert.equal(calls[1], "/api/staff/quote/catalog?deviceType=Phone");
  const aborted = new AbortController();
  aborted.abort();
  await assert.rejects(
    () =>
      fetchCatalogOptions(
        fakeFetch,
        { deviceType: "Phone", brand: "", model: "" },
        aborted.signal
      ),
    /Abort/
  );
  await assert.rejects(
    () =>
      fetchCatalogOptions(
        fakeFetch,
        { deviceType: "Other", brand: "", model: "" },
        new AbortController().signal
      ),
    /Malformed catalog response/
  );
});

test("fetch sequence keeps final prices on the audited match response", async () => {
  const mutableCalls: { url: string; method: string }[] = [];
  const fakeFetch = async (input: RequestInfo | URL, init?: RequestInit) => {
    const url = String(input);
    const method = init?.method ?? "GET";
    mutableCalls.push({ url, method });
    if (url === "/api/staff/quote/catalog") {
      return Response.json({ ok: true, data: { deviceTypes: ["Phone"] } });
    }
    if (url === "/api/staff/quote/catalog?deviceType=Phone") {
      return Response.json({ ok: true, data: { brands: ["Apple"] } });
    }
    if (url === "/api/staff/quote/catalog?deviceType=Phone&brand=Apple") {
      return Response.json({ ok: true, data: { models: ["iPhone 15"] } });
    }
    if (url.includes("repairType=")) {
      return Response.json({
        ok: true,
        data: {
          parts: [{ ...pricedPart, id: "secondary-price-path" }],
        },
      });
    }
    if (url === "/api/staff/pricing/match") {
      return Response.json({
        ok: true,
        data: {
          outcome: "mainboard_required",
          diagnosisRuleId: "rule-board",
          scope: "EXACT_MODEL",
          repairType: "Board-Level Repair",
          parts: [{ ...pricedPart, id: "audited-board-service" }],
        },
      });
    }
    return Response.json({ ok: false, error: "Unhandled fake route" }, { status: 404 });
  };

  await fetchCatalogOptions(
    fakeFetch,
    { deviceType: "", brand: "", model: "" },
    new AbortController().signal
  );
  await fetchCatalogOptions(
    fakeFetch,
    { deviceType: "Phone", brand: "", model: "" },
    new AbortController().signal
  );
  await fetchCatalogOptions(
    fakeFetch,
    { deviceType: "Phone", brand: "Apple", model: "" },
    new AbortController().signal
  );
  const match = await fetchPricingMatch(
    fakeFetch,
    {
      deviceType: "Phone",
      brand: "Apple",
      model: "iPhone 15",
      symptomCode: "no-power",
    },
    new AbortController().signal
  );

  assert.deepEqual(
    mutableCalls.map((call) => `${call.method} ${call.url}`),
    [
      "GET /api/staff/quote/catalog",
      "GET /api/staff/quote/catalog?deviceType=Phone",
      "GET /api/staff/quote/catalog?deviceType=Phone&brand=Apple",
      "POST /api/staff/pricing/match",
    ]
  );
  assert.equal(
    mutableCalls.filter((call) => call.url === "/api/staff/pricing/match").length,
    1
  );
  assert.equal(
    mutableCalls.some((call) => call.url.includes("repairType=")),
    false
  );
  assert.deepEqual(visiblePricedParts(match).map((part) => part.id), [
    "audited-board-service",
  ]);
});
