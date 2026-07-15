import { z } from "zod";
import {
  matchDiagnosedPricingFromRepository,
  type DiagnosedPricingRequest,
  type PricingCatalogPart,
  type PricingDiagnosisRule,
  type PricingMatchRepository,
  type PricingRuleScope,
} from "@/lib/pricing-match";

const pricingMatchSchema = z.object({
  deviceType: z.string().trim().min(1).max(80),
  brand: z.string().trim().min(1).max(120),
  model: z.string().trim().min(1).max(160),
  symptomCode: z.string().trim().min(1).max(120),
});

export interface PriceAccessAudit {
  readonly userId: string;
  readonly criteria: DiagnosedPricingRequest;
  readonly outcome: string;
  readonly matchedPartIds: readonly string[];
  readonly ipHash: string;
}

export interface PolicySummary {
  readonly id: string;
  readonly category: string;
  readonly version: string;
  readonly title: string;
  readonly body: string;
  readonly updatedAt: string | Date;
}

export interface ApplicableDiagnosisRule {
  readonly id: string;
  readonly deviceType: string;
  readonly brand: string | null;
  readonly model: string | null;
  readonly symptomCode: string;
  readonly symptomLabel: string;
  readonly repairType: string;
  readonly outcome: string;
  readonly priority: number;
  readonly scope: PricingRuleScope;
}

export interface PricingRepository extends PricingMatchRepository {
  readonly writePriceAccessLog: (audit: PriceAccessAudit) => Promise<void>;
  readonly listApplicableDiagnosisRules: (
    criteria: Omit<DiagnosedPricingRequest, "symptomCode">
  ) => Promise<readonly ApplicableDiagnosisRule[]>;
  readonly listActivePolicies: () => Promise<readonly PolicySummary[]>;
}

export interface RateLimitResult {
  readonly ok: boolean;
  readonly retryAfterSeconds: number;
}

export interface PricingServiceResponse {
  readonly status: number;
  readonly body:
    | { readonly ok: true; readonly data: PricingMatchResponse }
    | { readonly ok: false; readonly error: string };
}

interface ResolvePricingMatchInput {
  readonly repository: PricingRepository;
  readonly rateLimit: (key: string) => RateLimitResult;
  readonly userId: string;
  readonly ipHash: string;
  readonly body: unknown;
}

interface PublicPart {
  readonly id: string;
  readonly quality: string;
  readonly colour: string | null;
  readonly sellPrice: number;
  readonly warrantyDays: number;
  readonly stockQty: number;
}

interface PricingMatchResponse {
  readonly outcome: string;
  readonly diagnosisRuleId: string | null;
  readonly scope: PricingRuleScope | null;
  readonly repairType: string | null;
  readonly parts: readonly PublicPart[];
  readonly reason?: string;
}

export async function resolvePricingMatch(
  input: ResolvePricingMatchInput
): Promise<PricingServiceResponse> {
  const parsed = pricingMatchSchema.safeParse(input.body);
  if (!parsed.success) {
    return { status: 422, body: { ok: false, error: "Invalid pricing match request" } };
  }

  const userLimit = input.rateLimit(`pricing:match:user:${input.userId}`);
  if (!userLimit.ok) {
    return { status: 429, body: { ok: false, error: "Too many pricing match requests" } };
  }

  const ipLimit = input.rateLimit(`pricing:match:ip:${input.ipHash}`);
  if (!ipLimit.ok) {
    return { status: 429, body: { ok: false, error: "Too many pricing match requests" } };
  }

  const result = await matchDiagnosedPricingFromRepository(input.repository, parsed.data);
  const response = serializeMatch(result);
  await input.repository.writePriceAccessLog({
    userId: input.userId,
    criteria: parsed.data,
    outcome: response.outcome,
    matchedPartIds: response.parts.map((part) => part.id),
    ipHash: input.ipHash,
  });
  return { status: 200, body: { ok: true, data: response } };
}

function serializeMatch(
  result: Awaited<ReturnType<typeof matchDiagnosedPricingFromRepository>>
): PricingMatchResponse {
  switch (result.kind) {
    case "priced":
      return {
        outcome: result.kind,
        diagnosisRuleId: result.diagnosisRuleId,
        scope: result.scope,
        repairType: result.repairType,
        parts: result.parts.map(publicPart),
      };
    case "inspection_required":
      return {
        outcome: result.kind,
        diagnosisRuleId: result.diagnosisRuleId,
        scope: result.scope,
        repairType: result.repairType,
        parts: [],
        reason: result.reason,
      };
    case "mainboard_required":
    case "data_recovery_required":
      return {
        outcome: result.kind,
        diagnosisRuleId: result.diagnosisRuleId,
        scope: result.scope,
        repairType: result.repairType,
        parts: result.parts.map(publicPart),
        reason: result.reason,
      };
    default:
      return assertNever(result);
  }
}

function publicPart(part: PricingCatalogPart): PublicPart {
  return {
    id: part.id,
    quality: part.quality,
    colour: part.colour,
    sellPrice: part.sellPrice,
    warrantyDays: part.warrantyDays,
    stockQty: part.stockQty ?? 0,
  };
}

function assertNever(value: never): never {
  throw new Error(`Unhandled pricing match result: ${JSON.stringify(value)}`);
}
