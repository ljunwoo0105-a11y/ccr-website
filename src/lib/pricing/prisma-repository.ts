import "server-only";
import { z } from "zod";
import { db } from "@/lib/db";
import type { DiagnosedPricingRequest, PricingRuleOutcome, PricingRuleScope } from "@/lib/pricing-match";
import type {
  ApplicableDiagnosisRule,
  PriceAccessAudit,
  PricingRepository,
} from "@/lib/pricing/service";

const policyCategories = ["TERMS", "WARRANTY", "DATA"] as const;
const pricingOutcomeSchema = z.enum(["PART", "MAINBOARD", "DATA_RECOVERY", "INSPECTION"]);

function outcome(value: string): PricingRuleOutcome {
  const parsed = pricingOutcomeSchema.safeParse(value);
  return parsed.success ? parsed.data : "INSPECTION";
}

function scopeFor(rule: { readonly brand: string | null; readonly model: string | null }): PricingRuleScope {
  if (rule.brand === null && rule.model === null) return "DEVICE";
  if (rule.model === null) return "BRAND";
  return "EXACT_MODEL";
}

export const pricingRepository: PricingRepository = {
  async listDiagnosisRules(request) {
    const rows = await db.diagnosisRule.findMany({
      where: {
        active: true,
        deviceType: request.deviceType,
        symptomCode: request.symptomCode,
        OR: [
          { brand: request.brand, model: request.model },
          { brand: request.brand, model: null },
          { brand: null, model: null },
        ],
      },
      select: {
        id: true,
        deviceType: true,
        brand: true,
        model: true,
        symptomCode: true,
        symptomLabel: true,
        repairType: true,
        outcome: true,
        priority: true,
        active: true,
        updatedAt: true,
      },
    });
    return rows.map((row) => ({ ...row, outcome: outcome(row.outcome) }));
  },

  async listCatalogParts(request) {
    return db.part.findMany({
      where: {
        active: true,
        deviceType: request.deviceType,
        brand: request.brand,
        model: request.model,
      },
      select: {
        id: true,
        deviceType: true,
        brand: true,
        model: true,
        repairType: true,
        quality: true,
        colour: true,
        sellPrice: true,
        warrantyDays: true,
        stockQty: true,
        active: true,
      },
    });
  },

  async writePriceAccessLog(audit: PriceAccessAudit) {
    await db.priceAccessLog.create({
      data: {
        userId: audit.userId,
        deviceType: audit.criteria.deviceType,
        brand: audit.criteria.brand,
        model: audit.criteria.model,
        symptomCode: audit.criteria.symptomCode,
        outcome: audit.outcome,
        matchedPartIds: audit.matchedPartIds,
        ipHash: audit.ipHash,
      },
    });
  },

  async listApplicableDiagnosisRules(criteria: Omit<DiagnosedPricingRequest, "symptomCode">) {
    const rows = await db.diagnosisRule.findMany({
      where: {
        active: true,
        deviceType: criteria.deviceType,
        OR: [
          { brand: criteria.brand, model: criteria.model },
          { brand: criteria.brand, model: null },
          { brand: null, model: null },
        ],
      },
      select: {
        id: true,
        deviceType: true,
        brand: true,
        model: true,
        symptomCode: true,
        symptomLabel: true,
        repairType: true,
        outcome: true,
        priority: true,
      },
      orderBy: [{ priority: "desc" }, { updatedAt: "desc" }, { id: "asc" }],
    });
    return rows.map<ApplicableDiagnosisRule>((row) => ({
      ...row,
      outcome: outcome(row.outcome),
      scope: scopeFor(row),
    }));
  },

  async listActivePolicies() {
    const rows = await Promise.all(
      policyCategories.map((category) =>
        db.policyDocument.findFirst({
          where: { category, active: true },
          select: {
            id: true,
            category: true,
            version: true,
            title: true,
            body: true,
            updatedAt: true,
          },
          orderBy: [{ updatedAt: "desc" }, { id: "asc" }],
        })
      )
    );
    return rows.filter((row) => row !== null);
  },
};
