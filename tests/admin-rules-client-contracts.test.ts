import assert from "node:assert/strict";
import test from "node:test";
import {
  deleteDiagnosisRule,
  listDiagnosisRules,
  saveDiagnosisRule,
  toDiagnosisPayload,
} from "../src/components/admin/diagnoses-request";
import {
  beginDiagnosisLoad,
  beginDiagnosisSubmit,
  settleDiagnosisLoad,
} from "../src/components/admin/diagnoses-state";
import type { DiagnosisForm } from "../src/components/admin/diagnoses-types";
import {
  deletePolicy,
  listPolicies,
  savePolicy,
  toPolicyPayload,
} from "../src/components/admin/policies-request";
import {
  beginPolicyLoad,
  beginPolicySubmit,
  settlePolicyLoad,
} from "../src/components/admin/policies-state";
import type { PolicyForm } from "../src/components/admin/policies-types";

type CapturedCall = {
  readonly url: string;
  readonly init: RequestInit | undefined;
};

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

function captureFetch(
  response: Response,
  calls: CapturedCall[]
): (url: string, init?: RequestInit) => Promise<Response> {
  return async (url, init) => {
    calls.push({ url, init });
    return response;
  };
}

test("diagnosis requests keep soft delete as the default and hard delete explicit", async () => {
  // Given: an inactive diagnosis can be hard-deleted only by explicit user choice.
  const calls: CapturedCall[] = [];
  const rule = {
    id: "diag-1",
    deviceType: "Phone",
    brand: "Apple",
    model: "iPhone 14",
    symptomCode: "qa-screen",
    symptomLabel: "QA screen",
    repairType: "SCREEN",
    outcome: "PART",
    priority: 10,
    active: false,
    notes: null,
    createdAt: "2026-07-11T00:00:00.000Z",
    updatedAt: "2026-07-11T00:00:00.000Z",
  };

  // When: the manager performs default delete and then confirmed hard delete.
  const soft = await deleteDiagnosisRule(
    "diag-1",
    "deactivate",
    captureFetch(jsonResponse({ ok: true, data: rule }), calls)
  );
  const hard = await deleteDiagnosisRule(
    "diag-1",
    "hard",
    captureFetch(jsonResponse({ ok: true, data: { deleted: true } }), calls)
  );

  // Then: default delete does not include the hard query, while hard delete does.
  assert.equal(soft.kind, "ok");
  assert.equal(hard.kind, "ok");
  assert.equal(calls[0]?.url, "/api/admin/diagnoses/diag-1");
  assert.equal(calls[0]?.init?.method, "DELETE");
  assert.equal(calls[1]?.url, "/api/admin/diagnoses/diag-1?hard=true");
  assert.equal(calls[1]?.init?.method, "DELETE");
});

test("diagnosis requests surface duplicate 422 and network errors inline", async () => {
  // Given: a completed diagnosis form and two failing transports.
  const form: DiagnosisForm = {
    id: null,
    deviceType: "Phone",
    brand: "Apple",
    model: "iPhone 14",
    symptomCode: "qa-screen",
    symptomLabel: "QA screen",
    repairType: "SCREEN",
    outcome: "PART",
    priority: "10",
    active: true,
    notes: "",
  };
  const duplicateFetch = captureFetch(
    jsonResponse({ ok: false, error: "Duplicate diagnosis rule" }, 422),
    []
  );
  const networkFetch = async () => {
    throw new TypeError("offline");
  };

  // When: create receives a 422 and a later call cannot reach the network.
  const duplicate = await saveDiagnosisRule(toDiagnosisPayload(form), duplicateFetch);
  const network = await saveDiagnosisRule(toDiagnosisPayload(form), networkFetch);

  // Then: both failures carry user-facing messages for inline display.
  assert.deepEqual(duplicate, {
    kind: "error",
    message: "Duplicate diagnosis rule",
    status: 422,
  });
  assert.deepEqual(network, {
    kind: "error",
    message: "Network error - please try again.",
    status: null,
  });
});

test("rule list requests invoke browser fetch with the global receiver", async () => {
  // Given: a browser-like fetch implementation that requires the global receiver.
  const receivers: unknown[] = [];
  async function receiverCheckingFetch(this: unknown): Promise<Response> {
    receivers.push(this);
    return jsonResponse({ ok: true, data: [] });
  }

  // When: diagnosis and policy managers load their read-only rule lists.
  const diagnosis = await listDiagnosisRules(receiverCheckingFetch);
  const policies = await listPolicies(receiverCheckingFetch);

  // Then: both requests preserve the receiver expected by native window.fetch.
  assert.equal(diagnosis.kind, "ok");
  assert.equal(policies.kind, "ok");
  assert.deepEqual(receivers, [globalThis, globalThis]);
});

test("policy requests activate by category, report API errors, and hard delete explicitly", async () => {
  // Given: an active policy create should let the API make it the category current row.
  const calls: CapturedCall[] = [];
  const form: PolicyForm = {
    id: null,
    category: "TERMS",
    version: "2099-01-01.1",
    title: "QA terms",
    body: "QA policy body",
    active: true,
  };
  const policy = {
    ...form,
    id: "policy-1",
    createdAt: "2026-07-11T00:00:00.000Z",
    updatedAt: "2026-07-11T00:00:00.000Z",
  };

  // When: create, duplicate create, and explicit hard delete are requested.
  const created = await savePolicy(
    toPolicyPayload(form),
    captureFetch(jsonResponse({ ok: true, data: policy }, 201), calls)
  );
  const duplicate = await savePolicy(
    toPolicyPayload(form),
    captureFetch(jsonResponse({ ok: false, error: "Duplicate policy version" }, 422), calls)
  );
  await deletePolicy(
    "policy-1",
    "hard",
    captureFetch(jsonResponse({ ok: true, data: { deleted: true } }), calls)
  );

  // Then: active is posted, duplicate error is preserved, and hard delete is opt-in.
  assert.equal(created.kind, "ok");
  assert.equal(duplicate.kind, "error");
  assert.equal(duplicate.message, "Duplicate policy version");
  assert.equal(duplicate.status, 422);
  assert.equal(calls[0]?.url, "/api/admin/policies");
  assert.equal(calls[2]?.url, "/api/admin/policies/policy-1?hard=true");
  assert.match(String(calls[0]?.init?.body), /"active":true/);
});

test("rule manager state ignores stale loads and blocks rapid submit", () => {
  // Given: diagnosis and policy managers both have an older load in flight.
  const diagnosisLoading = beginDiagnosisLoad({
    status: "empty",
    records: [],
    error: null,
    loadToken: 0,
    submitting: false,
  });
  const policyLoading = beginPolicyLoad({
    status: "empty",
    records: [],
    error: null,
    loadToken: 0,
    submitting: false,
  });

  // When: a newer request starts and the older response settles afterwards.
  const diagnosisNewer = beginDiagnosisLoad(diagnosisLoading);
  const diagnosisStale = settleDiagnosisLoad(diagnosisNewer, diagnosisLoading.loadToken, {
    kind: "error",
    message: "stale failure",
    status: 500,
  });
  const policyNewer = beginPolicyLoad(policyLoading);
  const policyStale = settlePolicyLoad(policyNewer, policyLoading.loadToken, {
    kind: "error",
    message: "stale failure",
    status: 500,
  });

  // Then: stale failures are ignored and submit locks prevent double posting.
  assert.equal(diagnosisStale.status, "loading");
  assert.equal(diagnosisStale.error, null);
  assert.equal(beginDiagnosisSubmit({ ...diagnosisStale, submitting: true }).accepted, false);
  assert.equal(policyStale.status, "loading");
  assert.equal(policyStale.error, null);
  assert.equal(beginPolicySubmit({ ...policyStale, submitting: true }).accepted, false);
});
