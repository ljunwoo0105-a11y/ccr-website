import assert from "node:assert/strict";
import test from "node:test";

async function getShouldSyncGoogleReviews() {
  const policyModule = await import(
    "../src/lib/google-review-sync-policy"
  ).catch(() => ({
    shouldSyncGoogleReviews: () => false,
  }));
  return policyModule.shouldSyncGoogleReviews;
}

test("syncs when Google credentials exist and there is no previous sync", async () => {
  const shouldSyncGoogleReviews = await getShouldSyncGoogleReviews();
  assert.equal(
    shouldSyncGoogleReviews({
      hasApiKey: true,
      lastSyncAt: null,
      now: new Date("2026-06-12T00:00:00.000Z"),
      maxAgeMs: 6 * 60 * 60 * 1000,
    }),
    true
  );
});

test("syncs when the previous sync is stale", async () => {
  const shouldSyncGoogleReviews = await getShouldSyncGoogleReviews();
  assert.equal(
    shouldSyncGoogleReviews({
      hasApiKey: true,
      lastSyncAt: "2026-06-11T16:00:00.000Z",
      now: new Date("2026-06-12T00:00:00.000Z"),
      maxAgeMs: 6 * 60 * 60 * 1000,
    }),
    true
  );
});

test("does not sync when the API key is missing", async () => {
  const shouldSyncGoogleReviews = await getShouldSyncGoogleReviews();
  assert.equal(
    shouldSyncGoogleReviews({
      hasApiKey: false,
      lastSyncAt: null,
      now: new Date("2026-06-12T00:00:00.000Z"),
      maxAgeMs: 6 * 60 * 60 * 1000,
    }),
    false
  );
});

test("does not sync when the previous sync is still fresh", async () => {
  const shouldSyncGoogleReviews = await getShouldSyncGoogleReviews();
  assert.equal(
    shouldSyncGoogleReviews({
      hasApiKey: true,
      lastSyncAt: "2026-06-11T23:00:00.000Z",
      now: new Date("2026-06-12T00:00:00.000Z"),
      maxAgeMs: 6 * 60 * 60 * 1000,
    }),
    false
  );
});
