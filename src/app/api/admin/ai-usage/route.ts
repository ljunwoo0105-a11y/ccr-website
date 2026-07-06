import type { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { guard, ok } from "@/lib/api";

/** Local YYYY-MM-DD key so daily buckets match the shop's day. */
function dayKey(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

/**
 * AI usage dashboard data: GET /api/admin/ai-usage?days=30
 * → { totalUsd, byFeature, byModel, byDay, recent }
 */
export async function GET(req: NextRequest) {
  const { error } = await guard("ADMIN");
  if (error) return error;

  const daysRaw = Number(req.nextUrl.searchParams.get("days") ?? "30");
  const days = Number.isFinite(daysRaw)
    ? Math.min(365, Math.max(1, Math.floor(daysRaw)))
    : 30;

  const since = new Date();
  since.setHours(0, 0, 0, 0);
  since.setDate(since.getDate() - (days - 1));

  const logs = await db.aiUsageLog.findMany({
    where: { createdAt: { gte: since } },
    orderBy: { createdAt: "desc" },
  });

  let totalUsd = 0;
  const featureMap = new Map<string, { costUsd: number; calls: number }>();
  const modelMap = new Map<string, { costUsd: number; calls: number }>();
  const dayMap = new Map<string, number>();

  for (const log of logs) {
    totalUsd += log.costUsd;

    const f = featureMap.get(log.feature) ?? { costUsd: 0, calls: 0 };
    f.costUsd += log.costUsd;
    f.calls += 1;
    featureMap.set(log.feature, f);

    const m = modelMap.get(log.modelId) ?? { costUsd: 0, calls: 0 };
    m.costUsd += log.costUsd;
    m.calls += 1;
    modelMap.set(log.modelId, m);

    const key = dayKey(log.createdAt);
    dayMap.set(key, (dayMap.get(key) ?? 0) + log.costUsd);
  }

  const byDay: { date: string; costUsd: number }[] = [];
  for (let i = 0; i < days; i++) {
    const d = new Date(since.getTime() + i * 86_400_000);
    const key = dayKey(d);
    byDay.push({ date: key, costUsd: dayMap.get(key) ?? 0 });
  }

  return ok({
    totalUsd,
    byFeature: Array.from(featureMap, ([feature, v]) => ({
      feature,
      costUsd: v.costUsd,
      calls: v.calls,
    })).sort((a, b) => b.costUsd - a.costUsd),
    byModel: Array.from(modelMap, ([modelId, v]) => ({
      modelId,
      costUsd: v.costUsd,
      calls: v.calls,
    })).sort((a, b) => b.costUsd - a.costUsd),
    byDay,
    recent: logs.slice(0, 25).map((log) => ({
      id: log.id,
      createdAt: log.createdAt.toISOString(),
      feature: log.feature,
      modelId: log.modelId,
      inputTokens: log.inputTokens,
      outputTokens: log.outputTokens,
      costUsd: log.costUsd,
      durationMs: log.durationMs,
      status: log.status,
      error: log.error,
    })),
  });
}
