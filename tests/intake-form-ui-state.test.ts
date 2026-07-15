import assert from "node:assert/strict";
import test from "node:test";
import * as ReactRuntime from "react";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";

import { AcknowledgementSection } from "../src/components/staff/intake/AcknowledgementSection";
import { RepairsSection } from "../src/components/staff/intake/RepairsSection";
import {
  EMPTY_ACKNOWLEDGEMENT_STATE,
  intakeSubmissionReadiness,
  parseActivePolicyResponse,
  resetAcknowledgements,
  resolvePolicyLoad,
  type ActivePolicy,
} from "../src/components/staff/intake/policies";
import { parseIntakePrefill } from "../src/components/staff/intake/prefill";

const activePolicies = [
  {
    id: "policy-terms",
    category: "TERMS",
    version: "2026-07-01.1",
    title: "Repair Terms",
    body: "Visible repair terms body.",
  },
  {
    id: "policy-warranty",
    category: "WARRANTY",
    version: "2026-07-01.1",
    title: "Warranty Coverage",
    body: "Visible warranty coverage body.",
  },
  {
    id: "policy-data",
    category: "DATA",
    version: "2026-07-01.1",
    title: "Data Handling",
    body: "Visible data handling body.",
  },
] satisfies readonly ActivePolicy[];

const readyPolicyState: {
  readonly kind: "ready";
  readonly requestId: number;
  readonly policies: readonly ActivePolicy[];
} = {
  kind: "ready",
  requestId: 1,
  policies: activePolicies,
};

function render(element: ReactRuntime.ReactElement): string {
  Object.defineProperty(globalThis, "React", {
    configurable: true,
    value: ReactRuntime,
  });
  return renderToStaticMarkup(element);
}

function countOccurrences(value: string, needle: string): number {
  return value.split(needle).length - 1;
}

function findLabelSegment(markup: string, title: string): string {
  const segment = markup.split("<label").find((part) => part.includes(title));
  assert.ok(segment);
  return segment;
}

function findButtonSegment(markup: string, label: string): string {
  const segment = markup
    .split("<button")
    .find((part) => part.includes(label) && part.includes("</button>"));
  assert.ok(segment);
  return segment;
}

test("renders active policy acknowledgement state", () => {
  // Given: only repair terms and pre-condition accuracy are accepted.
  const markup = render(
    createElement(AcknowledgementSection, {
      signature: "",
      policyState: readyPolicyState,
      acknowledgementState: {
        acceptedPolicyIds: ["policy-terms"],
        preConditionAccuracyAccepted: true,
      },
      onTogglePolicy: () => undefined,
      onPreConditionAccuracyAcceptedChange: () => undefined,
      onSignatureChange: () => undefined,
    })
  );

  // When: the policy labels are located in rendered markup.
  const termsSegment = findLabelSegment(markup, "Repair Terms");
  const warrantySegment = findLabelSegment(markup, "Warranty Coverage");
  const dataSegment = findLabelSegment(markup, "Data Handling");

  // Then: all versions are visible and only the accepted controls are checked.
  assert.ok(markup.includes("Repair Terms"));
  assert.ok(markup.includes("Warranty Coverage"));
  assert.ok(markup.includes("Data Handling"));
  assert.equal(countOccurrences(markup, "2026-07-01.1"), 3);
  assert.ok(termsSegment.includes('checked=""'));
  assert.equal(warrantySegment.includes('checked=""'), false);
  assert.equal(dataSegment.includes('checked=""'), false);
  assert.equal(countOccurrences(markup, 'checked=""'), 2);
});

test("renders custom repairs in order and common repairs as pressed controls", () => {
  // Given: custom repairs surround selected common repairs in form state.
  const markup = render(
    createElement(RepairsSection, {
      repairs: [
        "Custom Microsoldering",
        "Screen Replacement",
        "Data Recovery",
        "Housing Polish",
      ],
      customRepair: "",
      onCustomRepairChange: () => undefined,
      onToggleRepair: () => undefined,
      onAddCustomRepair: () => undefined,
    })
  );

  // When: selected common repair controls are located.
  const screenButton = findButtonSegment(markup, "Screen Replacement");
  const dataButton = findButtonSegment(markup, "Data Recovery");
  const customMicrosolderingLabel = ">Custom Microsoldering<button";
  const housingPolishLabel = ">Housing Polish<button";

  // Then: custom chips are unique, ordered, removable, and not duplicated.
  assert.equal(countOccurrences(markup, customMicrosolderingLabel), 1);
  assert.equal(countOccurrences(markup, housingPolishLabel), 1);
  assert.ok(
    markup.indexOf(customMicrosolderingLabel) <
      markup.indexOf(housingPolishLabel)
  );
  assert.equal(
    countOccurrences(markup, 'aria-label="Remove Custom Microsoldering"'),
    1
  );
  assert.equal(
    countOccurrences(markup, 'aria-label="Remove Housing Polish"'),
    1
  );
  assert.equal(
    countOccurrences(markup, 'aria-label="Remove Screen Replacement"'),
    0
  );
  assert.equal(countOccurrences(markup, 'aria-label="Remove Data Recovery"'), 0);
  assert.ok(screenButton.includes('aria-pressed="true"'));
  assert.ok(dataButton.includes('aria-pressed="true"'));
});

test("returns empty intake prefill when query values are absent", () => {
  // Given: an empty intake query.
  const params = new URLSearchParams();
  // When: optional prefill is parsed.
  const result = parseIntakePrefill(params);
  // Then: no values are inferred.
  assert.deepEqual(result, {});
});

test("parses bounded prefill fields without trusting price or warranty", () => {
  // Given: safe matching fields plus untrusted pricing hints.
  const params = new URLSearchParams({
    partId: "  part-123  ",
    diagnosisRuleId: "  rule-456  ",
    diagnosis: "  Cracked screen  ",
    display: "  Front display assembly  ",
    quotedPrice: "99.99",
    warrantyDays: "90",
  });
  // When: optional prefill is parsed.
  const result = parseIntakePrefill(params);
  // Then: only the supported trimmed fields survive.
  assert.deepEqual(result, {
    partId: "part-123",
    diagnosisRuleId: "rule-456",
    diagnosis: "Cracked screen",
    display: "Front display assembly",
  });
});

test("drops unsafe prefill fields while retaining valid fields", () => {
  // Given: a control character and an overlong diagnosis rule id.
  const params = new URLSearchParams({
    partId: `part${String.fromCharCode(0)}123`,
    diagnosisRuleId: "x".repeat(81),
    diagnosis: "Battery not charging",
    display: "Power system",
  });
  // When: optional prefill is parsed.
  const result = parseIntakePrefill(params);
  // Then: invalid fields are dropped independently.
  assert.deepEqual(result, {
    diagnosis: "Battery not charging",
    display: "Power system",
  });
});

test("blocks submission when an active policy is not accepted", () => {
  // Given: every requirement except warranty acknowledgement is complete.
  const input = {
    policyState: readyPolicyState,
    acceptedPolicyIds: ["policy-terms", "policy-data"],
    preConditionAccuracyAccepted: true,
    repairs: ["Screen Replacement"],
    signature: "Alex Staff",
  };
  // When: readiness is evaluated.
  const result = intakeSubmissionReadiness(input);
  // Then: the missing-policy blocker is returned.
  assert.deepEqual(result, {
    kind: "blocked",
    reason: "missingPolicies",
    message: "Accept every active repair policy.",
  });
});

test("allows submission when all intake requirements are complete", () => {
  // Given: every policy, condition, repair, and signature requirement is complete.
  const input = {
    policyState: readyPolicyState,
    acceptedPolicyIds: activePolicies.map((policy) => policy.id),
    preConditionAccuracyAccepted: true,
    repairs: ["Screen Replacement"],
    signature: "Alex Staff",
  };
  // When: readiness is evaluated.
  const result = intakeSubmissionReadiness(input);
  // Then: active policy ids are returned for submission.
  assert.deepEqual(result, {
    kind: "ready",
    acceptedPolicyIds: ["policy-terms", "policy-warranty", "policy-data"],
  });
});

test("parses the active-policy success envelope", () => {
  // Given: the private route success envelope.
  const envelope = { ok: true, data: { policies: activePolicies } };
  // When: the boundary parses the response.
  const result = parseActivePolicyResponse(envelope);
  // Then: active policies are ready for the UI.
  assert.deepEqual(result, { kind: "ready", policies: activePolicies });
});

test("rejects malformed policies and ignores stale fetch completion", () => {
  // Given: malformed policy data and a newer request still loading.
  const malformed = parseActivePolicyResponse({
    ok: true,
    data: { policies: [{ id: "x" }] },
  });
  const current = { kind: "loading", requestId: 2 } as const;
  // When: the older request resolves with the malformed result.
  const resolved = resolvePolicyLoad(current, 1, malformed);
  // Then: parsing fails and stale state cannot replace the current request.
  assert.deepEqual(malformed, {
    kind: "failed",
    message: "Required policies could not be loaded.",
  });
  assert.deepEqual(resolved, current);
});

test("resets policy and pre-condition acknowledgement state", () => {
  // Given: acknowledgements are currently selected.
  const state = {
    acceptedPolicyIds: ["policy-terms"],
    preConditionAccuracyAccepted: true,
  };
  // When: the intake is reset.
  const result = resetAcknowledgements(state);
  // Then: the shared empty acknowledgement state is restored.
  assert.deepEqual(result, EMPTY_ACKNOWLEDGEMENT_STATE);
});
