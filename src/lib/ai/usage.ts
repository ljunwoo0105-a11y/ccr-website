import "server-only";
import { db } from "@/lib/db";

export function currentMonthStart(now: Date = new Date()): Date {
  const start = new Date(now);
  start.setDate(1);
  start.setHours(0, 0, 0, 0);
  return start;
}

export async function monthSpendUsd(
  start: Date = currentMonthStart()
): Promise<number> {
  const agg = await db.aiUsageLog.aggregate({
    _sum: { costUsd: true },
    where: { createdAt: { gte: start } },
  });
  return agg._sum.costUsd ?? 0;
}
