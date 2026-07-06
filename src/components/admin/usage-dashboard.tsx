"use client";

import { Fragment, useCallback, useEffect, useState } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";
import { cn, formatDateTime } from "@/lib/utils";
import { apiFetch, formatUsd } from "@/components/admin/shared";

interface FeatureRow {
  feature: string;
  costUsd: number;
  calls: number;
}
interface ModelRow {
  modelId: string;
  costUsd: number;
  calls: number;
}
interface DayRow {
  date: string;
  costUsd: number;
}
interface RecentLog {
  id: string;
  createdAt: string;
  feature: string;
  modelId: string;
  inputTokens: number;
  outputTokens: number;
  costUsd: number;
  durationMs: number;
  status: string;
  error: string | null;
}
interface UsageData {
  totalUsd: number;
  byFeature: FeatureRow[];
  byModel: ModelRow[];
  byDay: DayRow[];
  recent: RecentLog[];
}

function BarList({
  rows,
}: {
  rows: { key: string; costUsd: number; calls: number; mono?: boolean }[];
}) {
  const max = Math.max(...rows.map((r) => r.costUsd), 0.000001);
  return (
    <ul className="space-y-2">
      {rows.map((r) => (
        <li key={r.key}>
          <div className="mb-1 flex items-baseline justify-between gap-4 text-sm">
            <span
              className={cn(
                "truncate text-slate-700",
                r.mono && "font-mono text-xs"
              )}
            >
              {r.key}
            </span>
            <span className="shrink-0 text-slate-500">
              {formatUsd(r.costUsd)}{" "}
              <span className="text-xs text-slate-400">
                · {r.calls} call{r.calls === 1 ? "" : "s"}
              </span>
            </span>
          </div>
          <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100">
            <div
              className="h-full rounded-full bg-ccr-primary"
              style={{ width: `${(r.costUsd / max) * 100}%` }}
            />
          </div>
        </li>
      ))}
    </ul>
  );
}

export function UsageDashboard() {
  const [days, setDays] = useState(30);
  const [data, setData] = useState<UsageData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    const result = await apiFetch<UsageData>(
      `/api/admin/ai-usage?days=${days}`
    );
    if (result.ok) setData(result.data);
    else setError(result.error);
    setLoading(false);
  }, [days]);

  useEffect(() => {
    void load();
  }, [load]);

  const maxDay = data
    ? Math.max(...data.byDay.map((d) => d.costUsd), 0.000001)
    : 1;

  return (
    <section className="card p-0">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 px-6 py-4">
        <div>
          <h2 className="text-base font-semibold text-slate-900">
            Usage dashboard
          </h2>
          <p className="mt-0.5 text-sm text-slate-500">
            Real logged spend — every Anthropic API call the site makes.
          </p>
        </div>
        <label className="flex items-center gap-2 text-sm text-slate-600">
          Period
          <select
            className="input w-auto py-1.5"
            value={days}
            onChange={(e) => setDays(Number(e.target.value))}
            aria-label="Usage period in days"
          >
            <option value={7}>Last 7 days</option>
            <option value={30}>Last 30 days</option>
            <option value={90}>Last 90 days</option>
          </select>
        </label>
      </div>

      {error && (
        <p className="border-b border-red-100 bg-red-50 px-6 py-3 text-sm text-red-700">
          {error}
        </p>
      )}

      {loading && !data ? (
        <p className="px-6 py-8 text-sm text-slate-500">Loading usage…</p>
      ) : data ? (
        <div className="space-y-8 px-6 py-6">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="text-sm font-medium text-slate-500">
                Total spend (last {days} days)
              </p>
              <p className="mt-1 text-3xl font-bold text-slate-900">
                {formatUsd(data.totalUsd, 2)}{" "}
                <span className="text-sm font-normal text-slate-400">USD</span>
              </p>
            </div>
            <div
              className="flex h-20 flex-1 items-end gap-px"
              role="img"
              aria-label="Daily AI spend chart"
            >
              {data.byDay.map((d) => (
                <div
                  key={d.date}
                  className="group relative flex-1"
                  title={`${d.date}: ${formatUsd(d.costUsd)}`}
                >
                  <div
                    className={cn(
                      "w-full rounded-t-sm",
                      d.costUsd > 0 ? "bg-ccr-primary" : "bg-slate-100"
                    )}
                    style={{
                      height: `${Math.max(
                        d.costUsd > 0 ? 6 : 2,
                        (d.costUsd / maxDay) * 80
                      )}px`,
                    }}
                  />
                </div>
              ))}
            </div>
          </div>

          {data.byFeature.length === 0 ? (
            <p className="text-sm text-slate-500">
              No AI usage logged in this period.
            </p>
          ) : (
            <div className="grid gap-8 lg:grid-cols-2">
              <div>
                <h3 className="mb-3 text-sm font-semibold text-slate-700">
                  By feature
                </h3>
                <BarList
                  rows={data.byFeature.map((f) => ({
                    key: f.feature,
                    costUsd: f.costUsd,
                    calls: f.calls,
                  }))}
                />
              </div>
              <div>
                <h3 className="mb-3 text-sm font-semibold text-slate-700">
                  By model
                </h3>
                <BarList
                  rows={data.byModel.map((m) => ({
                    key: m.modelId,
                    costUsd: m.costUsd,
                    calls: m.calls,
                    mono: true,
                  }))}
                />
              </div>
            </div>
          )}

          {data.recent.length > 0 && (
            <div>
              <h3 className="mb-3 text-sm font-semibold text-slate-700">
                Recent calls
              </h3>
              <div className="overflow-x-auto rounded-lg border border-slate-200">
                <table className="w-full text-left text-sm">
                  <thead>
                    <tr className="border-b border-slate-200 bg-slate-50 text-xs uppercase tracking-wide text-slate-400">
                      <th className="px-4 py-2.5 font-medium">Time</th>
                      <th className="px-4 py-2.5 font-medium">Feature</th>
                      <th className="px-4 py-2.5 font-medium">Model</th>
                      <th className="px-4 py-2.5 font-medium">
                        Tokens in / out
                      </th>
                      <th className="px-4 py-2.5 font-medium">Cost</th>
                      <th className="px-4 py-2.5 font-medium">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.recent.map((log) => {
                      const bad =
                        log.status === "failed" ||
                        log.status === "blocked_budget";
                      const expanded = expandedId === log.id;
                      return (
                        <Fragment key={log.id}>
                          <tr className="border-b border-slate-100 last:border-0">
                            <td className="whitespace-nowrap px-4 py-2.5 text-slate-500">
                              {formatDateTime(log.createdAt)}
                            </td>
                            <td className="px-4 py-2.5 text-slate-700">
                              {log.feature}
                            </td>
                            <td className="px-4 py-2.5 font-mono text-xs text-slate-600">
                              {log.modelId}
                            </td>
                            <td className="whitespace-nowrap px-4 py-2.5 text-slate-600">
                              {log.inputTokens.toLocaleString("en-AU")} /{" "}
                              {log.outputTokens.toLocaleString("en-AU")}
                            </td>
                            <td className="px-4 py-2.5 text-slate-700">
                              {formatUsd(log.costUsd)}
                            </td>
                            <td className="px-4 py-2.5">
                              {bad && log.error ? (
                                <button
                                  type="button"
                                  onClick={() =>
                                    setExpandedId(expanded ? null : log.id)
                                  }
                                  className="inline-flex items-center gap-1 rounded-full bg-red-100 px-2 py-0.5 text-xs font-medium text-red-700 hover:bg-red-200"
                                  aria-expanded={expanded}
                                >
                                  {log.status}
                                  {expanded ? (
                                    <ChevronUp className="h-3 w-3" aria-hidden />
                                  ) : (
                                    <ChevronDown
                                      className="h-3 w-3"
                                      aria-hidden
                                    />
                                  )}
                                </button>
                              ) : (
                                <span
                                  className={cn(
                                    "inline-flex rounded-full px-2 py-0.5 text-xs font-medium",
                                    bad
                                      ? "bg-red-100 text-red-700"
                                      : "bg-emerald-100 text-emerald-700"
                                  )}
                                >
                                  {log.status}
                                </span>
                              )}
                            </td>
                          </tr>
                          {expanded && log.error && (
                            <tr className="border-b border-slate-100 last:border-0">
                              <td
                                colSpan={6}
                                className="bg-red-50 px-4 py-3 text-xs text-red-800"
                              >
                                {log.error}
                              </td>
                            </tr>
                          )}
                        </Fragment>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      ) : null}
    </section>
  );
}
