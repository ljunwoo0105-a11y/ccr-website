import { db } from "@/lib/db";
import { ok, fail, parseBody, guard } from "@/lib/api";
import { pricingRecommendationRequestSchema } from "@/lib/validation";
import { recommendPricing, type RepairContext } from "@/lib/ai/pricing";
import { AiBudgetError, AiConfigError } from "@/lib/ai/client";

export const dynamic = "force-dynamic";
// Two sequential agent calls (one with live web search) — allow a long run.
export const maxDuration = 120;

/**
 * AI price check: market research agent + margin agent. Staff-only; the
 * result includes cost-derived figures and must never reach a public surface.
 */
export async function POST(req: Request) {
  const { error } = await guard();
  if (error) return error;

  const parsed = await parseBody(req, pricingRecommendationRequestSchema);
  if (parsed.error) return parsed.error;
  const body = parsed.data;

  let ctx: RepairContext;
  if (body.partId) {
    const part = await db.part.findUnique({ where: { id: body.partId } });
    if (!part) return fail("Part not found", 404);
    ctx = {
      deviceType: part.deviceType,
      brand: part.brand,
      model: part.model,
      repairType: part.repairType,
      quality: part.quality,
      costPrice: part.costPrice,
      currentSellPrice: part.sellPrice,
    };
  } else {
    const { deviceType, brand, model, repairType, quality, costPrice } = body;
    if (
      !deviceType ||
      !brand ||
      !model ||
      !repairType ||
      !quality ||
      costPrice === undefined
    ) {
      return fail(
        "Provide a partId, or all of: deviceType, brand, model, repairType, quality, costPrice",
        422
      );
    }
    ctx = { deviceType, brand, model, repairType, quality, costPrice };
  }

  try {
    const result = await recommendPricing(ctx);
    return ok(result);
  } catch (e) {
    if (e instanceof AiConfigError) return fail(e.message, 503);
    if (e instanceof AiBudgetError) return fail(e.message, 402);
    return fail("AI pricing failed — try again", 500);
  }
}
