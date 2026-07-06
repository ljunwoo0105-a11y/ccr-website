import assert from "node:assert/strict";
import test from "node:test";
import { formatAud } from "../src/lib/utils";

test("formats whole AUD prices with an explicit currency code", () => {
  const amount = formatAud(99);

  assert.equal(amount, "AUD 99");
});

test("formats cent AUD prices with an explicit currency code", () => {
  const amount = formatAud(99.5);

  assert.equal(amount, "AUD 99.50");
});
