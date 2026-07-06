import type { Metadata } from "next";
import { db, getSetting } from "@/lib/db";
import { ModelRegistry } from "@/components/admin/model-registry";
import {
  AiSettingsForm,
  type AiSettings,
  type ModelOption,
} from "@/components/admin/ai-settings-form";
import {
  CostEstimator,
  type EstimatorModel,
} from "@/components/admin/cost-estimator";
import { UsageDashboard } from "@/components/admin/usage-dashboard";

export const metadata: Metadata = { title: "AI Console" };
export const dynamic = "force-dynamic";

export default async function AdminAiPage() {
  const models = await db.aiModel.findMany({ orderBy: { label: "asc" } });

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

  const settings: AiSettings = {
    monthlyBudgetUsd,
    blockAtCap,
    defaultPricingModel,
    defaultResearchModel,
    targetMarginPct,
  };

  const enabledModels = models.filter((m) => m.enabled);
  const options: ModelOption[] = enabledModels.map((m) => ({
    modelId: m.modelId,
    label: `${m.label} (${m.modelId})`,
  }));
  const estimatorModels: EstimatorModel[] = enabledModels.map((m) => ({
    modelId: m.modelId,
    label: m.label,
    inputPerMTok: m.inputPerMTok,
    outputPerMTok: m.outputPerMTok,
  }));

  return (
    <div className="space-y-8">
      <header>
        <h1 className="text-2xl font-bold text-slate-900">AI Console</h1>
        <p className="mt-1 text-sm text-slate-500">
          Model registry, default model + budget settings, cost estimation and
          real usage.
        </p>
      </header>

      <ModelRegistry
        models={models}
        defaultModelIds={[defaultPricingModel, defaultResearchModel]}
      />

      <AiSettingsForm options={options} initial={settings} />

      <CostEstimator models={estimatorModels} />

      <UsageDashboard />
    </div>
  );
}
