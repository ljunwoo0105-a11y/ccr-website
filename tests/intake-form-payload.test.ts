import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

import { defaultPreCondition } from "../src/components/staff/precondition";
import {
  buildIntakePayload,
  type IntakeFormState,
} from "../src/components/staff/intake/payload";
import { intakeSubmissionSchema } from "../src/lib/intakes/submission";
import type { PreCondition } from "../src/lib/validation";

const fixturePath = new URL("./fixtures/intake-form-payload.json", import.meta.url);

test("builds the staff intake payload JSON from representative form state", () => {
  // Given: a fully populated form state using the current staff intake labels.
  const preCondition: PreCondition = {
    ...defaultPreCondition(),
    screenCracked: true,
    previousRepairs: true,
    cosmeticGrade: "WORN",
  };
  const state: IntakeFormState = {
    phone: " 0452 385 321 ",
    name: " Ada Lovelace ",
    email: " ada@example.com ",
    suburb: " Springfield Central ",
    deviceType: "Phone",
    brand: " Apple ",
    model: " iPhone 14 Pro ",
    imei: " 359881234567890 ",
    serialNo: " C39YW0ABCDEF ",
    repairs: [
      "Screen Replacement",
      "Back Glass Replacement",
      "Custom Microsoldering",
    ],
    preCondition,
    batteryHealth: "87.6",
    accessories: " Case, SIM tray pin ",
    conditionNotes: " Hairline crack near top speaker ",
    partQuality: "PREMIUM",
    warrantyDays: "180",
    quotedPrice: "329.95",
    depositPaid: "50",
    signature: " Ada Lovelace ",
    partId: "clxstaffpart000001",
    diagnosisRuleId: "rule-screen-glass",
    diagnosis: "Screen glass damage",
    display: "PART_MATCH",
    acceptedPolicyIds: ["policy-terms", "policy-warranty", "policy-data"],
    preConditionAccuracyAccepted: true,
  };

  // When: the submit payload is normalized for JSON transport.
  const payload = buildIntakePayload(state);
  const actualJson = JSON.stringify(payload, null, 2);

  // Then: optional fields, repairTypes, preCondition, and numeric coercions match.
  assert.equal(actualJson, readFileSync(fixturePath, "utf8").trimEnd());
});

test("builds a matched prefill payload accepted by the strict intake submission schema", () => {
  // Given: the workbench opened intake with a matched part and diagnosis rule.
  const state: IntakeFormState = {
    phone: "0452 385 321",
    name: "Ada Lovelace",
    email: "ada@example.com",
    suburb: "Springfield Central",
    deviceType: "Phone",
    brand: "Apple",
    model: "iPhone 14 Pro",
    imei: "",
    serialNo: "",
    repairs: ["Screen Replacement"],
    preCondition: defaultPreCondition(),
    batteryHealth: "",
    accessories: "",
    conditionNotes: "",
    partQuality: "PREMIUM",
    warrantyDays: "180",
    quotedPrice: "329.95",
    depositPaid: "",
    signature: "Ada Lovelace",
    partId: "clxstaffpart000001",
    diagnosisRuleId: "rule-screen-glass",
    diagnosis: "Screen glass damage",
    display: "PART_MATCH",
    acceptedPolicyIds: ["policy-terms", "policy-warranty", "policy-data"],
    preConditionAccuracyAccepted: true,
  };

  // When: the client helper builds the body that fetch will submit.
  const parsed = intakeSubmissionSchema.safeParse(buildIntakePayload(state));

  // Then: the strict server route accepts it and keeps the authoritative ids.
  assert.equal(parsed.success, true);
  if (!parsed.success) return;
  assert.equal(parsed.data.partId, "clxstaffpart000001");
  assert.equal(parsed.data.diagnosisRuleId, "rule-screen-glass");
});

test("omits optional payload fields while preserving required blank-derived values", () => {
  // Given: a partial form state with blank optional fields and malformed numbers.
  const state: IntakeFormState = {
    phone: " 0452 385 321 ",
    name: " Ada Lovelace ",
    email: " ",
    suburb: "",
    deviceType: "Phone",
    brand: " Apple ",
    model: " iPhone 14 Pro ",
    imei: " ",
    serialNo: "",
    repairs: ["Screen Replacement"],
    preCondition: defaultPreCondition(),
    batteryHealth: "not-a-number",
    accessories: "",
    conditionNotes: " ",
    partQuality: "",
    warrantyDays: "",
    quotedPrice: "",
    depositPaid: "not-a-number",
    signature: " Ada Lovelace ",
  };

  // When: the submit payload is stringified exactly as fetch receives it.
  const json = JSON.stringify(buildIntakePayload(state));

  // Then: blanks are omitted and legacy malformed numeric JSON coercion is retained.
  assert.equal(
    json,
    '{"customer":{"name":"Ada Lovelace","phone":"0452 385 321"},"deviceType":"Phone","brand":"Apple","model":"iPhone 14 Pro","repairTypes":["Screen Replacement"],"preCondition":{"powersOn":true,"screenCracked":false,"touchWorks":true,"frontCameraWorks":true,"rearCameraWorks":true,"speakerWorks":true,"microphoneWorks":true,"chargingPortWorks":true,"buttonsWork":true,"faceOrTouchIdWorks":true,"waterDamageSuspected":false,"previousRepairs":false,"findMyDisabled":false,"dataBackedUp":false,"simRemoved":false,"cosmeticGrade":"GOOD","batteryHealthPct":null},"depositPaid":null,"customerSignature":"Ada Lovelace"}'
  );
});
