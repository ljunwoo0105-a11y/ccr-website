import "server-only";
import Anthropic from "@anthropic-ai/sdk";
import { db, getSetting } from "@/lib/db";
import { monthSpendUsd } from "@/lib/ai/usage";

/**
 * Central wrapper for every Anthropic API call the site makes.
 *
 * Responsibilities:
 *  - one shared SDK client (API key is server-only, never sent to browsers)
 *  - per-call usage logging into AiUsageLog with real token counts
 *  - cost calculation from the AiModel registry (USD per million tokens)
 *  - monthly budget enforcement (Admin AI console settings)
 */

/**
 * Safe defaults for the monthly budget gate. These MUST match the fallbacks
 * the admin UI shows (admin/ai-settings GET and the AI console page) so the
 * runtime never silently diverges from what the operator sees. Fail-CLOSED:
 * if the Setting rows are absent, the cap is still enforced rather than
 * leaving AI spend uncapped.
 */
export const DEFAULT_MONTHLY_BUDGET_USD = 50;
export const DEFAULT_BLOCK_AT_CAP = true;

// Floors for the unknown/disabled-model pricing fallback (USD per 1M tokens).
const FALLBACK_MIN_INPUT_PER_MTOK = 10;
const FALLBACK_MIN_OUTPUT_PER_MTOK = 50;

/** Anthropic server-side web_search fee (USD per request); ~$10 / 1,000. */
export const WEB_SEARCH_COST_PER_REQUEST_USD = 0.01;

let _client: Anthropic | null = null;

export function anthropicClient(): Anthropic {
  if (!process.env.ANTHROPIC_API_KEY) {
    throw new AiConfigError(
      "ANTHROPIC_API_KEY is not configured. Add it to .env to enable AI features."
    );
  }
  if (!_client) _client = new Anthropic();
  return _client;
}

export class AiConfigError extends Error {}
export class AiBudgetError extends Error {}

export interface ModelPricing {
  modelId: string;
  inputPerMTok: number;
  outputPerMTok: number;
}

export async function getModelPricing(modelId: string): Promise<ModelPricing> {
  const row = await db.aiModel.findUnique({ where: { modelId } });
  if (row && row.enabled) {
    return {
      modelId,
      inputPerMTok: row.inputPerMTok,
      outputPerMTok: row.outputPerMTok,
    };
  }
  // Unknown/disabled model — cost it at the most expensive ENABLED tier in the
  // registry (floored at a safe minimum) so budget enforcement never
  // under-counts as the registry evolves.
  const enabled = await db.aiModel.findMany({
    where: { enabled: true },
    select: { inputPerMTok: true, outputPerMTok: true },
  });
  return {
    modelId,
    inputPerMTok: Math.max(
      FALLBACK_MIN_INPUT_PER_MTOK,
      ...enabled.map((m) => m.inputPerMTok)
    ),
    outputPerMTok: Math.max(
      FALLBACK_MIN_OUTPUT_PER_MTOK,
      ...enabled.map((m) => m.outputPerMTok)
    ),
  };
}

export function computeCostUsd(
  pricing: ModelPricing,
  inputTokens: number,
  outputTokens: number
): number {
  return (
    (inputTokens / 1_000_000) * pricing.inputPerMTok +
    (outputTokens / 1_000_000) * pricing.outputPerMTok
  );
}

/**
 * Note: this is a check-then-act gate, so two calls racing past it at the
 * same instant can overshoot the cap by at most one call's cost (cents).
 * Acceptable for a single-instance deployment; if this ever needs to be
 * airtight, serialize the check through a DB transaction or shared lock.
 */
async function enforceBudget(feature: string, modelId: string): Promise<void> {
  const budget = await getSetting<number>(
    "ai.monthlyBudgetUsd",
    DEFAULT_MONTHLY_BUDGET_USD
  );
  const blockAtCap = await getSetting<boolean>(
    "ai.blockAtCap",
    DEFAULT_BLOCK_AT_CAP
  );
  if (!budget || !blockAtCap) return;
  const spent = await monthSpendUsd();
  if (spent >= budget) {
    await db.aiUsageLog.create({
      data: {
        feature,
        modelId,
        inputTokens: 0,
        outputTokens: 0,
        costUsd: 0,
        durationMs: 0,
        status: "blocked_budget",
        error: `Monthly AI budget of $${budget} reached ($${spent.toFixed(2)} spent)`,
      },
    });
    throw new AiBudgetError(
      `Monthly AI budget of $${budget} USD has been reached. Raise it in Admin → AI.`
    );
  }
}

export interface TrackedCallArgs {
  feature: string;
  modelId: string;
  params: Omit<Anthropic.MessageCreateParamsNonStreaming, "model">;
  meta?: Record<string, unknown>;
}

/**
 * Run a Messages API call with budget check + usage logging.
 * Throws AiBudgetError when the monthly cap is reached and blocking is on.
 */
export async function trackedMessage({
  feature,
  modelId,
  params,
  meta,
}: TrackedCallArgs): Promise<Anthropic.Message> {
  await enforceBudget(feature, modelId);
  const client = anthropicClient();
  const pricing = await getModelPricing(modelId);
  const startedAt = Date.now();
  try {
    const response = await client.messages.create({
      ...params,
      model: modelId,
    });
    const inputTokens =
      response.usage.input_tokens +
      (response.usage.cache_creation_input_tokens ?? 0) +
      (response.usage.cache_read_input_tokens ?? 0);
    const outputTokens = response.usage.output_tokens;
    // Server-side web_search is billed per request on top of tokens; fold that
    // fee into costUsd so the budget gate and dashboard reflect real spend.
    const webSearches =
      response.usage.server_tool_use?.web_search_requests ?? 0;
    const costUsd =
      computeCostUsd(pricing, inputTokens, outputTokens) +
      webSearches * WEB_SEARCH_COST_PER_REQUEST_USD;
    await db.aiUsageLog.create({
      data: {
        feature,
        modelId,
        inputTokens,
        outputTokens,
        costUsd,
        durationMs: Date.now() - startedAt,
        status: "success",
        meta: JSON.stringify({ ...(meta ?? {}), webSearches }),
      },
    });
    return response;
  } catch (e) {
    if (e instanceof AiBudgetError) throw e;
    const message = e instanceof Error ? e.message : "Unknown AI error";
    await db.aiUsageLog.create({
      data: {
        feature,
        modelId,
        inputTokens: 0,
        outputTokens: 0,
        costUsd: 0,
        durationMs: Date.now() - startedAt,
        status: "failed",
        error: message.slice(0, 500),
        meta: meta ? JSON.stringify(meta) : null,
      },
    });
    throw e;
  }
}

/** Extract the concatenated text blocks from a message. */
export function messageText(message: Anthropic.Message): string {
  return message.content
    .filter((b): b is Anthropic.TextBlock => b.type === "text")
    .map((b) => b.text)
    .join("\n");
}

/**
 * Extract the first JSON object found in model output. The pricing agents
 * are instructed to answer with a single JSON object; this tolerates code
 * fences and prose around it.
 */
export function extractJson<T>(text: string): T | null {
  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/);
  const candidate = fenced ? fenced[1] : text;
  const start = candidate.indexOf("{");
  const end = candidate.lastIndexOf("}");
  if (start === -1 || end <= start) return null;
  try {
    return JSON.parse(candidate.slice(start, end + 1)) as T;
  } catch {
    return null;
  }
}
