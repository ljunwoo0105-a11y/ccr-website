import "server-only";
import { unstable_cache } from "next/cache";
import { currentMonthStart, monthSpendUsd } from "@/lib/ai/usage";
import { db, getSetting } from "@/lib/db";

export const ADMIN_OVERVIEW_REVALIDATE_SECONDS = 15;

export interface AdminOverviewLog {
  readonly id: string;
  readonly createdAt: string;
  readonly feature: string;
  readonly modelId: string;
  readonly inputTokens: number;
  readonly outputTokens: number;
  readonly costUsd: number;
  readonly status: string;
}

export interface AdminOverviewData {
  readonly spend: number;
  readonly budget: number;
  readonly leadCount: number;
  readonly reviewCount: number;
  readonly staffCount: number;
  readonly monthStartLabel: string;
  readonly recentLogs: readonly AdminOverviewLog[];
}

async function loadAdminOverviewData(): Promise<AdminOverviewData> {
  const monthStart = currentMonthStart();

  const [spend, budget, leadCount, reviewCount, staffCount, recentLogs] =
    await Promise.all([
      monthSpendUsd(monthStart),
      getSetting<number>("ai.monthlyBudgetUsd", 50),
      db.quoteRequest.count({ where: { createdAt: { gte: monthStart } } }),
      db.review.count({ where: { visible: true, rating: 5 } }),
      db.user.count({ where: { active: true } }),
      db.aiUsageLog.findMany({
        orderBy: { createdAt: "desc" },
        take: 10,
        select: {
          id: true,
          createdAt: true,
          feature: true,
          modelId: true,
          inputTokens: true,
          outputTokens: true,
          costUsd: true,
          status: true,
        },
      }),
    ]);

  return {
    spend,
    budget,
    leadCount,
    reviewCount,
    staffCount,
    monthStartLabel: monthStart.toLocaleDateString("en-AU"),
    recentLogs: recentLogs.map((log) => ({
      ...log,
      createdAt: log.createdAt.toISOString(),
    })),
  };
}

export const getAdminOverviewData = unstable_cache(
  loadAdminOverviewData,
  ["admin-overview"],
  { revalidate: ADMIN_OVERVIEW_REVALIDATE_SECONDS }
);
