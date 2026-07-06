import { getSetting, setSetting } from "@/lib/db";
import { guard, ok, parseBody } from "@/lib/api";
import { aiSettingsSchema } from "@/lib/validation";

/** Current AI defaults + budget settings. */
export async function GET() {
  const { error } = await guard("ADMIN");
  if (error) return error;

  const [
    monthlyBudgetUsd,
    blockAtCap,
    defaultPricingModel,
    defaultResearchModel,
    targetMarginPct,
  ] = await Promise.all([
    getSetting<number>("ai.monthlyBudgetUsd", 50),
    getSetting<boolean>("ai.blockAtCap", true),
    getSetting<string>("ai.defaultPricingModel", "claude-opus-4-8"),
    getSetting<string>("ai.defaultResearchModel", "claude-opus-4-8"),
    getSetting<number>("pricing.targetMarginPct", 55),
  ]);

  return ok({
    monthlyBudgetUsd,
    blockAtCap,
    defaultPricingModel,
    defaultResearchModel,
    targetMarginPct,
  });
}

/** Save AI defaults + budget settings. */
export async function PUT(req: Request) {
  const { error } = await guard("ADMIN");
  if (error) return error;

  const body = await parseBody(req, aiSettingsSchema);
  if (body.error) return body.error;
  const data = body.data;

  await setSetting("ai.monthlyBudgetUsd", data.monthlyBudgetUsd);
  await setSetting("ai.blockAtCap", data.blockAtCap);
  await setSetting("ai.defaultPricingModel", data.defaultPricingModel);
  await setSetting("ai.defaultResearchModel", data.defaultResearchModel);
  await setSetting("pricing.targetMarginPct", data.targetMarginPct);

  return ok(data);
}
