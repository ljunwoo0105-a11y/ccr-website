"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { ChevronLeft, ChevronRight, Search } from "lucide-react";
import { formatDateTime } from "@/lib/utils";
import { apiFetch } from "@/components/admin/shared";
import {
  buildPriceAccessQuery,
  filterPriceAccessRows,
  priceAccessCells,
  totalPages,
  type PriceAccessPage,
} from "@/components/admin/price-access-state";

const PAGE_SIZE = 25;

export function PriceAccessManager() {
  const [page, setPage] = useState(1);
  const [data, setData] = useState<PriceAccessPage | null>(null);
  const [filter, setFilter] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async (nextPage: number) => {
    setLoading(true);
    setError(null);
    const query = buildPriceAccessQuery({ page: nextPage, pageSize: PAGE_SIZE });
    const result = await apiFetch<PriceAccessPage>(`/api/admin/price-access?${query}`);
    setLoading(false);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    setData(result.data);
    setPage(result.data.page);
  }, []);

  useEffect(() => {
    void load(page);
  }, [load, page]);

  const rows = useMemo(
    () => filterPriceAccessRows(data?.rows ?? [], filter),
    [data?.rows, filter]
  );
  const pages = data ? totalPages(data) : 1;

  return (
    <section className="card p-0" data-access-mode="readOnly">
      <div className="flex flex-col gap-3 border-b border-carbon-150 px-6 py-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h2 className="text-base font-semibold text-carbon-950">
            Recent access
          </h2>
          <p className="mt-0.5 text-sm text-carbon-500">
            Redacted audit rows only. Raw address and catalogue values are not
            shown here.
          </p>
        </div>
        <label className="flex min-w-0 items-center gap-2 border border-carbon-150 bg-bone-50 px-3 py-2 text-sm text-carbon-500">
          <Search className="h-4 w-4 shrink-0" aria-hidden />
          <span className="sr-only">Filter visible audit rows</span>
          <input
            className="min-w-0 bg-transparent text-carbon-950 outline-none placeholder:text-carbon-400"
            value={filter}
            onChange={(event) => setFilter(event.target.value)}
            placeholder="Filter user, device, outcome or hash"
          />
        </label>
      </div>
      {error && (
        <p className="border-b border-rose-200/60 bg-rose-50 px-6 py-3 text-sm text-rose-700">
          {error}
        </p>
      )}
      {loading ? (
        <p className="px-6 py-8 text-sm text-carbon-500">
          Loading price access logs...
        </p>
      ) : data && data.rows.length === 0 ? (
        <p className="px-6 py-8 text-sm text-carbon-500">
          No price access logs.
        </p>
      ) : rows.length === 0 ? (
        <p className="px-6 py-8 text-sm text-carbon-500">
          No price access logs match the current filter.
        </p>
      ) : (
        <div className="divide-y divide-carbon-150">
          {rows.map((row) => {
            const cells = priceAccessCells(row);
            return (
              <article
                key={row.id}
                className="grid gap-3 px-6 py-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.4fr)_minmax(0,1fr)]"
              >
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-carbon-950">
                    {row.user.name}
                  </p>
                  <p className="truncate text-xs text-carbon-500">
                    {row.user.email}
                  </p>
                  <p className="mt-1 font-mono text-xs text-carbon-400">
                    {formatDateTime(row.createdAt)}
                  </p>
                </div>
                <dl className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs text-carbon-500 sm:grid-cols-4">
                  <AuditCell label="Device" value={cells.device} />
                  <AuditCell label="Symptom" value={cells.symptom} />
                  <AuditCell label="Outcome" value={cells.outcome} />
                  <AuditCell label="Matched" value={cells.matched} />
                </dl>
                <dl className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs text-carbon-500">
                  <AuditCell label="Log" value={cells.log} mono />
                  <AuditCell label="Hash" value={cells.hash} mono />
                  <AuditCell label="Agent" value={cells.agent} />
                </dl>
              </article>
            );
          })}
        </div>
      )}
      <div className="flex flex-col gap-3 border-t border-carbon-150 px-6 py-3 text-sm text-carbon-500 sm:flex-row sm:items-center sm:justify-between">
        <span>
          Page {data?.page ?? page} of {pages} - {data?.total ?? 0} total rows
        </span>
        <div className="flex items-center gap-2">
          <button
            type="button"
            className="btn-ghost px-3 py-2"
            disabled={loading || page <= 1}
            onClick={() => setPage((current) => Math.max(1, current - 1))}
          >
            <ChevronLeft className="h-4 w-4" aria-hidden />
            Previous
          </button>
          <button
            type="button"
            className="btn-ghost px-3 py-2"
            disabled={loading || page >= pages}
            onClick={() => setPage((current) => current + 1)}
          >
            Next
            <ChevronRight className="h-4 w-4" aria-hidden />
          </button>
        </div>
      </div>
    </section>
  );
}

function AuditCell({
  label,
  value,
  mono,
}: {
  readonly label: string;
  readonly value: string;
  readonly mono?: boolean;
}) {
  return (
    <div className="min-w-0">
      <dt className="font-medium text-carbon-400">{label}</dt>
      <dd className={mono ? "truncate font-mono" : "truncate"}>{value}</dd>
    </div>
  );
}
