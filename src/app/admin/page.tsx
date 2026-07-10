import type { Metadata } from "next";
import {
  Bot,
  MessageSquareQuote,
  Star,
  Users,
} from "lucide-react";
import { getAdminOverviewData } from "@/lib/admin/overview";
import { cn, formatDateTime } from "@/lib/utils";
import { formatUsd } from "@/components/admin/shared";

export const metadata: Metadata = { title: "Overview" };
export const dynamic = "force-dynamic";

function StatusBadge({ status }: { status: string }) {
  const bad = status === "failed" || status === "blocked_budget";
  return (
    <span
      className={cn(
        "inline-flex rounded-full px-2 py-0.5 text-xs font-medium",
        bad ? "bg-rose-100 text-rose-700" : "border border-emerald-500/50 bg-emerald-50 text-emerald-700"
      )}
    >
      {status}
    </span>
  );
}

export default async function AdminOverviewPage() {
  const {
    spend,
    budget,
    leadCount,
    reviewCount,
    staffCount,
    monthStartLabel,
    recentLogs,
  } = await getAdminOverviewData();

  const pct = budget > 0 ? Math.min(100, (spend / budget) * 100) : 0;
  const overBudget = budget > 0 && spend >= budget;

  return (
    <div className="space-y-8">
      <header>
        <h1 className="text-2xl font-bold text-carbon-950">Overview</h1>
        <p className="mt-1 text-sm text-carbon-500">
          What the site and AI tools have been doing this month.
        </p>
      </header>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <div className="card">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-carbon-500">
              AI spend this month
            </p>
            <Bot className="h-5 w-5 text-signal-600" aria-hidden />
          </div>
          <p
            className={cn(
              "mt-2 text-2xl font-bold",
              overBudget ? "text-rose-600" : "text-carbon-950"
            )}
          >
            {formatUsd(spend, 2)}{" "}
            <span className="text-sm font-normal text-carbon-400">
              / {formatUsd(budget, 2)} USD
            </span>
          </p>
          <div
            className="mt-3 h-2 w-full overflow-hidden rounded-full bg-bone-200"
            role="progressbar"
            aria-valuenow={Math.round(pct)}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-label="Monthly AI budget used"
          >
            <div
              className={cn(
                "h-full rounded-full transition-all",
                overBudget
                  ? "bg-rose-500"
                  : pct >= 80
                    ? "bg-amber-500"
                    : "bg-signal-500"
              )}
              style={{ width: `${pct}%` }}
            />
          </div>
          {overBudget ? (
            <p className="mt-2 text-xs font-medium text-rose-600">
              Budget reached — AI calls may be blocked.
            </p>
          ) : (
            <p className="mt-2 text-xs text-carbon-400">
              {pct.toFixed(0)}% of monthly budget used
            </p>
          )}
        </div>

        <div className="card">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-carbon-500">
              Quote leads this month
            </p>
            <MessageSquareQuote
              className="h-5 w-5 text-signal-600"
              aria-hidden
            />
          </div>
          <p className="mt-2 text-2xl font-bold text-carbon-950">{leadCount}</p>
          <p className="mt-2 text-xs text-carbon-400">
            Quote requests since {monthStartLabel}
          </p>
        </div>

        <div className="card">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-carbon-500">
              Visible 5★ reviews
            </p>
            <Star className="h-5 w-5 text-star" aria-hidden />
          </div>
          <p className="mt-2 text-2xl font-bold text-carbon-950">
            {reviewCount}
          </p>
          <p className="mt-2 text-xs text-carbon-400">
            Shown on the public site
          </p>
        </div>

        <div className="card">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-carbon-500">
              Active staff accounts
            </p>
            <Users className="h-5 w-5 text-signal-600" aria-hidden />
          </div>
          <p className="mt-2 text-2xl font-bold text-carbon-950">
            {staffCount}
          </p>
          <p className="mt-2 text-xs text-carbon-400">
            Staff and admin logins enabled
          </p>
        </div>
      </div>

      <section className="card p-0">
        <div className="border-b border-carbon-150 px-6 py-4">
          <h2 className="text-base font-semibold text-carbon-950">
            Recent AI activity
          </h2>
        </div>
        {recentLogs.length === 0 ? (
          <p className="px-6 py-8 text-sm text-carbon-500">
            No AI calls logged yet. Usage from the staff price-check tools will
            appear here automatically.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-carbon-150 text-xs uppercase tracking-wide text-carbon-400">
                  <th className="px-6 py-3 font-medium">Time</th>
                  <th className="px-4 py-3 font-medium">Feature</th>
                  <th className="px-4 py-3 font-medium">Model</th>
                  <th className="px-4 py-3 font-medium">Tokens in / out</th>
                  <th className="px-4 py-3 font-medium">Cost</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                </tr>
              </thead>
              <tbody>
                {recentLogs.map((log) => (
                  <tr
                    key={log.id}
                    className="border-b border-carbon-150 last:border-0"
                  >
                    <td className="whitespace-nowrap px-6 py-3 text-carbon-500">
                      {formatDateTime(log.createdAt)}
                    </td>
                    <td className="px-4 py-3 text-carbon-700">{log.feature}</td>
                    <td className="px-4 py-3 font-mono text-xs text-carbon-700">
                      {log.modelId}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-carbon-700">
                      {log.inputTokens.toLocaleString("en-AU")} /{" "}
                      {log.outputTokens.toLocaleString("en-AU")}
                    </td>
                    <td className="px-4 py-3 text-carbon-700">
                      {formatUsd(log.costUsd)}
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge status={log.status} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
