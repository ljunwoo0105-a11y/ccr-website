import assert from "node:assert/strict";
import test from "node:test";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";

import StaffPricingWorkbench from "../src/components/staff/StaffPricingWorkbench";
import {
  boundedDiagnosisDisplay,
  buildIntakeHref,
  initialWorkbenchState,
  pricingWorkbenchReducer,
  shouldShowBoardReference,
  visiblePricedParts,
} from "../src/components/staff/pricing-workbench/state";
import {
  type MatchResult,
  type WorkbenchAction,
} from "../src/components/staff/pricing-workbench/types";
import { pricedPart } from "./helpers/staff-pricing-workbench-fixtures";

function reduce(...actions: readonly WorkbenchAction[]) {
  return actions.reduce(pricingWorkbenchReducer, initialWorkbenchState);
}

test("anonymous server markup renders no staff pricing marker or price UI", () => {
  // Given: the public page includes the client workbench leaf.
  // When: React renders the initial anonymous HTML payload.
  const markup = renderToStaticMarkup(createElement(StaffPricingWorkbench));

  // Then: there is no staff marker, price text, or intake route in public HTML.
  assert.equal(markup, "");
  assert.doesNotMatch(markup, /data-staff-pricing|sellPrice|staff\/intake/i);
});

test("staff session and catalog cascade reset lower selections", () => {
  // Given: an authenticated staff session and a fully selected cascade.
  const state = reduce(
    { type: "SESSION_AUTHENTICATED" },
    { type: "OPTIONS_LOADED", key: "deviceTypes", values: ["Phone"] },
    { type: "SELECT_DEVICE_TYPE", value: "Phone" },
    { type: "OPTIONS_LOADED", key: "brands", values: ["Apple"] },
    { type: "SELECT_BRAND", value: "Apple" },
    { type: "OPTIONS_LOADED", key: "models", values: ["iPhone 15"] },
    { type: "SELECT_MODEL", value: "iPhone 15" },
    {
      type: "DIAGNOSES_LOADED",
      values: [
        {
          id: "rule-screen",
          symptomCode: "screen-cracked",
          symptomLabel: "Cracked screen",
          repairType: "Screen Replacement",
          outcome: "PART",
          scope: "EXACT_MODEL",
        },
      ],
    },
    { type: "SELECT_DIAGNOSIS", value: "rule-screen" },
    {
      type: "MATCH_LOADED",
      result: {
        outcome: "priced",
        diagnosisRuleId: "rule-screen",
        scope: "EXACT_MODEL",
        repairType: "Screen Replacement",
        parts: [pricedPart],
      },
    },
    { type: "SELECT_DEVICE_TYPE", value: "Tablet" }
  );

  // When: the device type changes.
  // Then: lower cascade state and private results are cleared.
  assert.equal(state.session, "authenticated");
  assert.equal(state.selection.deviceType, "Tablet");
  assert.equal(state.selection.brand, "");
  assert.equal(state.diagnoses.length, 0);
  assert.equal(state.match, null);
  assert.equal(state.selectedPartId, null);
});

test("stale request actions are ignored after a newer load starts", () => {
  // Given: a later request supersedes an earlier brand load.
  const state = reduce(
    { type: "SESSION_AUTHENTICATED" },
    { type: "LOAD_STARTED", requestId: 1, target: "brands" },
    { type: "LOAD_STARTED", requestId: 2, target: "brands" },
    { type: "LOAD_FAILED", requestId: 1, message: "old failure" },
    { type: "OPTIONS_LOADED", key: "brands", values: ["Apple"], requestId: 1 },
    { type: "OPTIONS_LOADED", key: "brands", values: ["Samsung"], requestId: 2 }
  );

  // When: both responses arrive out of order.
  // Then: only the current response mutates visible state.
  assert.equal(state.error, null);
  assert.deepEqual(state.options.brands, ["Samsung"]);
  assert.equal(state.loadingTarget, null);
});

test("intake and board routing preserve bounded diagnosis display", () => {
  // Given: a matched catalog part and a verbose diagnosis label.
  const diagnosis = "Cracked screen with top speaker glass lift";
  const href = buildIntakeHref({
    partId: "part-screen",
    diagnosisRuleId: "rule-screen",
    diagnosis,
  });

  // When: routing helpers build staff actions.
  // Then: intake carries ids plus bounded display, and board outcomes route to #circuit.
  assert.equal(
    href,
    "/staff/intake/new?partId=part-screen&diagnosisRuleId=rule-screen&diagnosis=Cracked+screen+with+top+speaker+glass+lift"
  );
  assert.equal(boundedDiagnosisDisplay("x".repeat(121)), null);
  assert.equal(shouldShowBoardReference({ outcome: "mainboard_required" }), true);
  assert.equal(shouldShowBoardReference({ outcome: "data_recovery_required" }), true);
});

test("gap outcomes never invent prices while related catalog rows can price service paths", () => {
  // Given: a catalog gap, a mainboard row, and a direct priced result.
  const gap: MatchResult = {
    outcome: "inspection_required",
    diagnosisRuleId: "rule-gap",
    scope: "EXACT_MODEL",
    repairType: "Screen Replacement",
    reason: "CATALOG_GAP",
    parts: [],
  };
  const board: MatchResult = {
    outcome: "mainboard_required",
    diagnosisRuleId: "rule-board",
    scope: "DEVICE",
    repairType: "Board-Level Repair",
    parts: [],
    relatedParts: [pricedPart],
  };

  // When: visible parts are derived for rendering.
  // Then: inspection stays unpriced and catalog-backed board service can show a row.
  assert.deepEqual(visiblePricedParts(gap), []);
  assert.deepEqual(visiblePricedParts(board), [pricedPart]);
});
