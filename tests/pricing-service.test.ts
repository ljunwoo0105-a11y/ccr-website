import assert from "node:assert/strict";
import test from "node:test";

import {
  resolvePricingMatch,
  type PriceAccessAudit,
  type PricingRepository,
} from "../src/lib/pricing/service";
import type { PricingCatalogPart, PricingRuleOutcome } from "../src/lib/pricing-match";

const criteria = {
  deviceType: "Phone",
  brand: "Apple",
  model: "iPhone 15",
  symptomCode: "no-power",
};

interface RepositoryProbe {
  readonly audits: PriceAccessAudit[];
  matchReads: number;
}

interface RepositoryScenario {
  readonly outcome?: PricingRuleOutcome;
  readonly repairType?: string;
  readonly catalogParts?: readonly PricingCatalogPart[];
}

function repository(probe: RepositoryProbe, scenario: RepositoryScenario = {}): PricingRepository {
  const repairType = scenario.repairType ?? "Charging Port Replacement";
  return {
    async listDiagnosisRules() {
      probe.matchReads += 1;
      return [
        {
          id: "rule-power",
          ...criteria,
          symptomLabel: "No power",
          repairType,
          outcome: scenario.outcome ?? "PART",
          priority: 1,
          active: true,
          updatedAt: "2026-07-01T00:00:00.000Z",
        },
      ];
    },
    async listCatalogParts() {
      probe.matchReads += 1;
      return scenario.catalogParts ?? [
        {
          id: "part-port",
          deviceType: "Phone",
          brand: "Apple",
          model: "iPhone 15",
          repairType,
          quality: "PREMIUM",
          colour: "Black",
          sellPrice: 189,
          warrantyDays: 180,
          stockQty: 3,
          active: true,
        },
      ];
    },
    async writePriceAccessLog(audit) {
      probe.audits.push(audit);
    },
    async listApplicableDiagnosisRules() {
      return [];
    },
    async listActivePolicies() {
      return [];
    },
  };
}

const boardService: PricingCatalogPart = {
  id: "part-board-service",
  deviceType: "Phone",
  brand: "Apple",
  model: "iPhone 15",
  repairType: "Board assessment",
  quality: "SERVICE",
  colour: null,
  sellPrice: 249,
  warrantyDays: 90,
  stockQty: 1,
  active: true,
};

interface QuotaProbe {
  readonly decisions: string[];
  readonly rateLimit: (key: string) => { readonly ok: boolean; readonly retryAfterSeconds: number };
}

function quotaProbe(limits: ReadonlyMap<string, number>): QuotaProbe {
  const remaining = new Map(limits);
  const decisions: string[] = [];
  return {
    decisions,
    rateLimit(key) {
      decisions.push(key);
      const available = remaining.get(key) ?? 100;
      if (available <= 0) {
        return { ok: false, retryAfterSeconds: 30 };
      }
      remaining.set(key, available - 1);
      return { ok: true, retryAfterSeconds: 0 };
    },
  };
}

test("pricing match returns sell-side data only and writes exactly one final audit", async () => {
  // Given: a matching diagnosis rule and one active catalog part.
  const probe: RepositoryProbe = { audits: [], matchReads: 0 };

  // When: staff pricing is resolved through the service seam.
  const response = await resolvePricingMatch({
    repository: repository(probe),
    rateLimit: () => ({ ok: true, retryAfterSeconds: 0 }),
    userId: "user-staff",
    ipHash: "hashed-ip",
    body: criteria,
  });

  // Then: the response omits cost data and exactly one minimal audit is saved.
  assert.equal(response.status, 200);
  assert.equal(response.body.ok, true);
  assert.deepEqual(response.body.data.parts, [
    {
      id: "part-port",
      quality: "PREMIUM",
      colour: "Black",
      sellPrice: 189,
      warrantyDays: 180,
      stockQty: 3,
    },
  ]);
  assert.deepEqual(probe.audits, [
    {
      userId: "user-staff",
      criteria,
      outcome: "priced",
      matchedPartIds: ["part-port"],
      ipHash: "hashed-ip",
    },
  ]);
});

test("pricing match returns catalog-backed mainboard services and audits their IDs", async () => {
  // Given: a MAINBOARD diagnosis has an exact active catalog-backed service row.
  const probe: RepositoryProbe = { audits: [], matchReads: 0 };

  // When: staff pricing is resolved through the protected service seam.
  const response = await resolvePricingMatch({
    repository: repository(probe, {
      outcome: "MAINBOARD",
      repairType: "Board assessment",
      catalogParts: [boardService],
    }),
    rateLimit: () => ({ ok: true, retryAfterSeconds: 0 }),
    userId: "user-staff",
    ipHash: "hashed-ip",
    body: criteria,
  });

  // Then: the board outcome keeps its routing kind and audits the exact service ID.
  assert.equal(response.status, 200);
  assert.equal(response.body.ok, true);
  assert.equal(response.body.data.outcome, "mainboard_required");
  assert.deepEqual(response.body.data.parts, [
    {
      id: "part-board-service",
      quality: "SERVICE",
      colour: null,
      sellPrice: 249,
      warrantyDays: 90,
      stockQty: 1,
    },
  ]);
  assert.deepEqual(probe.audits.map((audit) => audit.matchedPartIds), [
    ["part-board-service"],
  ]);
});

test("pricing match rate limit returns 429 before matching or audit", async () => {
  // Given: a user+IP key with an exhausted rate bucket.
  const probe: RepositoryProbe = { audits: [], matchReads: 0 };

  // When: the pricing service checks the limiter.
  const response = await resolvePricingMatch({
    repository: repository(probe),
    rateLimit: () => ({ ok: false, retryAfterSeconds: 30 }),
    userId: "user-staff",
    ipHash: "hashed-ip",
    body: criteria,
  });

  // Then: no matching or audit side effect occurs.
  assert.equal(response.status, 429);
  assert.equal(response.body.ok, false);
  assert.equal(probe.matchReads, 0);
  assert.deepEqual(probe.audits, []);
});

test("pricing match user quota cannot be evaded by changing IP", async () => {
  // Given: one user bucket allows a single successful match across IPs.
  const probe: RepositoryProbe = { audits: [], matchReads: 0 };
  const quota = quotaProbe(new Map([["pricing:match:user:user-staff", 1]]));

  // When: the same user changes IP hash after the first successful match.
  const first = await resolvePricingMatch({
    repository: repository(probe),
    rateLimit: quota.rateLimit,
    userId: "user-staff",
    ipHash: "ip-one",
    body: criteria,
  });
  const second = await resolvePricingMatch({
    repository: repository(probe),
    rateLimit: quota.rateLimit,
    userId: "user-staff",
    ipHash: "ip-two",
    body: criteria,
  });

  // Then: the exhausted user bucket returns 429 before a second match or audit.
  assert.equal(first.status, 200);
  assert.equal(second.status, 429);
  assert.equal(probe.matchReads, 2);
  assert.equal(probe.audits.length, 1);
});

test("pricing match IP quota cannot be evaded by changing user", async () => {
  // Given: one IP bucket allows a single successful match across users.
  const probe: RepositoryProbe = { audits: [], matchReads: 0 };
  const quota = quotaProbe(new Map([["pricing:match:ip:hashed-ip", 1]]));

  // When: a different user repeats the request from the same IP hash.
  const first = await resolvePricingMatch({
    repository: repository(probe),
    rateLimit: quota.rateLimit,
    userId: "user-one",
    ipHash: "hashed-ip",
    body: criteria,
  });
  const second = await resolvePricingMatch({
    repository: repository(probe),
    rateLimit: quota.rateLimit,
    userId: "user-two",
    ipHash: "hashed-ip",
    body: criteria,
  });

  // Then: the exhausted IP bucket returns 429 before a second match or audit.
  assert.equal(first.status, 200);
  assert.equal(second.status, 429);
  assert.equal(probe.matchReads, 2);
  assert.equal(probe.audits.length, 1);
});

test("pricing match limiter uses distinct user and IP keys in order", async () => {
  // Given: both independent buckets have capacity.
  const probe: RepositoryProbe = { audits: [], matchReads: 0 };
  const quota = quotaProbe(new Map());

  // When: a valid pricing match request is resolved.
  const response = await resolvePricingMatch({
    repository: repository(probe),
    rateLimit: quota.rateLimit,
    userId: "user-staff",
    ipHash: "hashed-ip",
    body: criteria,
  });

  // Then: the limiter decisions are made against separate user and IP buckets before matching.
  assert.equal(response.status, 200);
  assert.deepEqual(quota.decisions, [
    "pricing:match:user:user-staff",
    "pricing:match:ip:hashed-ip",
  ]);
  assert.equal(new Set(quota.decisions).size, 2);
  assert.equal(probe.matchReads, 2);
});
