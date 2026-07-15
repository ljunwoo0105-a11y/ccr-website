export type PricingRuleOutcome = "PART" | "MAINBOARD" | "DATA_RECOVERY" | "INSPECTION";

export type PricingRuleScope = "EXACT_MODEL" | "BRAND" | "DEVICE";

export interface DiagnosedPricingRequest {
  readonly deviceType: string;
  readonly brand: string;
  readonly model: string;
  readonly symptomCode: string;
}

export interface PricingDiagnosisRule {
  readonly id: string;
  readonly deviceType: string;
  readonly brand: string | null;
  readonly model: string | null;
  readonly symptomCode: string;
  readonly symptomLabel: string;
  readonly repairType: string;
  readonly outcome: PricingRuleOutcome;
  readonly priority: number;
  readonly active: boolean;
  readonly updatedAt: string | Date;
}

export interface PricingCatalogPart {
  readonly id: string;
  readonly deviceType: string;
  readonly brand: string;
  readonly model: string;
  readonly repairType: string;
  readonly quality: string;
  readonly colour: string | null;
  readonly sellPrice: number;
  readonly warrantyDays: number;
  readonly stockQty?: number;
  readonly active: boolean;
}

export interface PricingMatchInput {
  readonly request: DiagnosedPricingRequest;
  readonly rules: readonly PricingDiagnosisRule[];
  readonly catalog: readonly PricingCatalogPart[];
}

export interface PricingMatchRepository {
  readonly listDiagnosisRules: (request: DiagnosedPricingRequest) => Promise<readonly PricingDiagnosisRule[]>;
  readonly listCatalogParts: (request: DiagnosedPricingRequest) => Promise<readonly PricingCatalogPart[]>;
}

export type PricingMatchResult =
  | {
      readonly kind: "priced";
      readonly diagnosisRuleId: string;
      readonly scope: PricingRuleScope;
      readonly repairType: string;
      readonly parts: readonly PricingCatalogPart[];
    }
  | {
      readonly kind: "inspection_required";
      readonly diagnosisRuleId: string | null;
      readonly scope: PricingRuleScope | null;
      readonly repairType: string | null;
      readonly parts: readonly [];
      readonly reason: "NO_RULE" | "CATALOG_GAP" | "INSPECTION_RULE";
    }
  | {
      readonly kind: "mainboard_required";
      readonly diagnosisRuleId: string;
      readonly scope: PricingRuleScope;
      readonly repairType: string;
      readonly parts: readonly PricingCatalogPart[];
      readonly reason?: "CATALOG_GAP";
    }
  | {
      readonly kind: "data_recovery_required";
      readonly diagnosisRuleId: string;
      readonly scope: PricingRuleScope;
      readonly repairType: string;
      readonly parts: readonly PricingCatalogPart[];
      readonly reason?: "CATALOG_GAP";
    };

interface ScopedPricingRule {
  readonly rule: PricingDiagnosisRule;
  readonly scope: PricingRuleScope;
}

type RelatedOutcomeKind = "mainboard_required" | "data_recovery_required";

export async function matchDiagnosedPricingFromRepository(
  repository: PricingMatchRepository,
  request: DiagnosedPricingRequest
): Promise<PricingMatchResult> {
  const [rules, catalog] = await Promise.all([
    repository.listDiagnosisRules(request),
    repository.listCatalogParts(request),
  ]);

  return matchDiagnosedPricing({ request, rules, catalog });
}

export function matchDiagnosedPricing(input: PricingMatchInput): PricingMatchResult {
  const selected = selectRule(input.request, input.rules);

  if (!selected) {
    return {
      kind: "inspection_required",
      diagnosisRuleId: null,
      scope: null,
      repairType: null,
      parts: [],
      reason: "NO_RULE",
    };
  }

  switch (selected.rule.outcome) {
    case "PART":
      return matchCatalogParts(input, selected);
    case "MAINBOARD":
      return matchRelatedCatalogParts(input, selected, "mainboard_required");
    case "DATA_RECOVERY":
      return matchRelatedCatalogParts(input, selected, "data_recovery_required");
    case "INSPECTION":
      return {
        kind: "inspection_required",
        diagnosisRuleId: selected.rule.id,
        scope: selected.scope,
        repairType: selected.rule.repairType,
        parts: [],
        reason: "INSPECTION_RULE",
      };
    default:
      return assertNever(selected.rule.outcome);
  }
}

function selectRule(
  request: DiagnosedPricingRequest,
  rules: readonly PricingDiagnosisRule[]
): ScopedPricingRule | null {
  const activeRules = rules.filter(
    (rule) =>
      rule.active &&
      rule.deviceType === request.deviceType &&
      rule.symptomCode === request.symptomCode
  );

  const exactRules = activeRules.filter(
    (rule) => rule.brand === request.brand && rule.model === request.model
  );
  const brandRules = activeRules.filter(
    (rule) => rule.brand === request.brand && rule.model === null
  );
  const deviceRules = activeRules.filter(
    (rule) => rule.brand === null && rule.model === null
  );

  if (exactRules.length > 0) {
    return { rule: chooseRule(exactRules), scope: "EXACT_MODEL" };
  }
  if (brandRules.length > 0) {
    return { rule: chooseRule(brandRules), scope: "BRAND" };
  }
  if (deviceRules.length > 0) {
    return { rule: chooseRule(deviceRules), scope: "DEVICE" };
  }

  return null;
}

function chooseRule(rules: readonly PricingDiagnosisRule[]): PricingDiagnosisRule {
  return [...rules].sort(compareRules)[0] ?? unreachableRule();
}

function compareRules(left: PricingDiagnosisRule, right: PricingDiagnosisRule): number {
  const priorityOrder = right.priority - left.priority;
  if (priorityOrder !== 0) return priorityOrder;

  const updatedOrder = updatedAtMs(right) - updatedAtMs(left);
  if (updatedOrder !== 0) return updatedOrder;

  return left.id.localeCompare(right.id);
}

function matchCatalogParts(
  input: PricingMatchInput,
  selected: ScopedPricingRule
): PricingMatchResult {
  const parts = exactCatalogParts(input, selected);

  if (parts.length === 0) {
    return {
      kind: "inspection_required",
      diagnosisRuleId: selected.rule.id,
      scope: selected.scope,
      repairType: selected.rule.repairType,
      parts: [],
      reason: "CATALOG_GAP",
    };
  }

  return {
    kind: "priced",
    diagnosisRuleId: selected.rule.id,
    scope: selected.scope,
    repairType: selected.rule.repairType,
    parts,
  };
}

function matchRelatedCatalogParts(
  input: PricingMatchInput,
  selected: ScopedPricingRule,
  kind: RelatedOutcomeKind
): PricingMatchResult {
  const parts = exactCatalogParts(input, selected);
  const matched = {
    kind,
    diagnosisRuleId: selected.rule.id,
    scope: selected.scope,
    repairType: selected.rule.repairType,
  };
  return parts.length === 0
    ? { ...matched, parts: [], reason: "CATALOG_GAP" }
    : { ...matched, parts };
}

function exactCatalogParts(input: PricingMatchInput, selected: ScopedPricingRule): readonly PricingCatalogPart[] {
  return input.catalog.filter(
    (part) =>
      part.active &&
      part.deviceType === input.request.deviceType &&
      part.brand === input.request.brand &&
      part.model === input.request.model &&
      part.repairType === selected.rule.repairType
  ).sort(compareParts);
}

function compareParts(left: PricingCatalogPart, right: PricingCatalogPart): number {
  const priceOrder = left.sellPrice - right.sellPrice;
  if (priceOrder !== 0) return priceOrder;

  const qualityOrder = left.quality.localeCompare(right.quality);
  if (qualityOrder !== 0) return qualityOrder;

  return left.id.localeCompare(right.id);
}

function updatedAtMs(rule: PricingDiagnosisRule): number {
  const value =
    rule.updatedAt instanceof Date
      ? rule.updatedAt.getTime()
      : Date.parse(rule.updatedAt);

  return Number.isNaN(value) ? Number.NEGATIVE_INFINITY : value;
}

function unreachableRule(): PricingDiagnosisRule {
  throw new PricingMatchInvariantError("selecting from an empty rule set");
}

function assertNever(value: never): never {
  throw new PricingMatchInvariantError(`unhandled pricing outcome: ${value}`);
}

export class PricingMatchInvariantError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "PricingMatchInvariantError";
  }
}
