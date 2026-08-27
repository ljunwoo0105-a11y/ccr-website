import assert from "node:assert/strict";
import test from "node:test";

import { authSecretBytes } from "../src/lib/auth-token";
import { emailDeliveryMode } from "../src/lib/email-mode";
import { readJsonBody, readRequestBytes } from "../src/lib/request-body";

test("bounded request reader accepts small JSON", async () => {
  const req = new Request("https://ccr.test/api", {
    method: "POST",
    body: JSON.stringify({ ok: true }),
  });

  const result = await readJsonBody(req, 1024);

  assert.deepEqual(result, { ok: true, data: { ok: true } });
});

test("bounded request reader rejects oversized streamed bodies", async () => {
  const req = new Request("https://ccr.test/api", {
    method: "POST",
    body: "x".repeat(1025),
  });

  const result = await readRequestBytes(req, 1024);

  assert.deepEqual(result, {
    ok: false,
    status: 413,
    message: "Request body is too large",
  });
});

test("bounded request reader rejects an oversized declared length without reading", async () => {
  const req = new Request("https://ccr.test/api", {
    method: "POST",
    headers: { "content-length": "4096" },
    body: "{}",
  });

  const result = await readJsonBody(req, 1024);

  assert.equal(result.ok, false);
  if (!result.ok) assert.equal(result.status, 413);
});

test("production email configuration fails closed", () => {
  assert.throws(
    () => emailDeliveryMode({ NODE_ENV: "production" }),
    /SMTP must be configured in production/
  );
  assert.throws(
    () =>
      emailDeliveryMode({
        NODE_ENV: "development",
        SMTP_HOST: "smtp.example",
      }),
    /SMTP configuration is incomplete/
  );
  assert.equal(
    emailDeliveryMode({
      NODE_ENV: "production",
      SMTP_HOST: "smtp.example",
      SMTP_USER: "user",
      SMTP_PASS: "pass",
    }),
    "smtp"
  );
  assert.equal(emailDeliveryMode({ NODE_ENV: "development" }), "preview");
});

test("known and short authentication secrets fail closed", () => {
  const previousSecret = process.env.AUTH_SECRET;
  try {
    process.env.AUTH_SECRET = "change-me-to-a-long-random-string";
    assert.throws(() => authSecretBytes(), /unique random string/);

    process.env.AUTH_SECRET = "short";
    assert.throws(() => authSecretBytes(), /unique random string/);

    process.env.AUTH_SECRET = "0123456789abcdef0123456789abcdef";
    assert.equal(authSecretBytes().byteLength, 32);
  } finally {
    if (previousSecret === undefined) delete process.env.AUTH_SECRET;
    else process.env.AUTH_SECRET = previousSecret;
  }
});
