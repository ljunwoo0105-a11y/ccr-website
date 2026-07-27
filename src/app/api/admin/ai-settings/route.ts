import { setSetting } from "@/lib/db";
import { guard, ok, parseBody } from "@/lib/api";
import { aiSettingsSchema } from "@/lib/validation";

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
