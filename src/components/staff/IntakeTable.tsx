"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { ArrowRight, Loader2, Search } from "lucide-react";
import { formatAud, formatDateTime, cn } from "@/lib/utils";
import { intakeStatusBadge, statusLabel } from "@/components/staff/ui";
import {
  parseJsonStringArray,
  type ApiEnvelope,
  type IntakeRow,
} from "@/components/staff/types";

const TABS = [
  { value: "", label: "All" },
  { value: "CHECKED_IN", label: "Checked in" },
  { value: "IN_REPAIR", label: "In repair" },
  { value: "READY", label: "Ready" },
  { value: "COLLECTED", label: "Collected" },
] as const;

export default function IntakeTable() {
  const [intakes, setIntakes] = useState<IntakeRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const requestIdRef = useRef(0);

  useEffect(() => {
    const t = setTimeout(() => setSearch(searchInput.trim()), 300);
    return () => clearTimeout(t);
  }, [searchInput]);

  const load = useCallback(async () => {
    const requestId = ++requestIdRef.current;
    setLoading(true);
    setError(null);
    try {
      const qs = new URLSearchParams();
      if (status) qs.set("status", status);
      if (search) qs.set("search", search);
      const res = await fetch(`/api/staff/intakes?${qs.toString()}`);
      const json = (await res.json()) as ApiEnvelope<IntakeRow[]>;
      if (requestId !== requestIdRef.current) return;
      if (!res.ok || !json.ok || !json.data) {
        setError(json.error ?? "Could not load intakes");
        setIntakes([]);
      } else {
        setIntakes(json.data);
      }
    } catch {
      if (requestId === requestIdRef.current) {
        setError("Network error — try again");
      }
    } finally {
      if (requestId === requestIdRef.current) setLoading(false);
    }
  }, [status, search]);

  useEffect(() => {
    void load();
  }, [load]);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <div
          className="flex flex-wrap gap-1 rounded-lg bg-slate-200 p-1"
          role="tablist"
          aria-label="Filter by status"
        >
          {TABS.map((tab) => (
            <button
              key={tab.value}
              type="button"
              role="tab"
              aria-selected={status === tab.value}
              onClick={() => setStatus(tab.value)}
              className={cn(
                "rounded-md px-3 py-1.5 text-sm font-medium transition",
                status === tab.value
                  ? "bg-white text-slate-900 shadow-sm"
                  : "text-slate-600 hover:text-slate-900"
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>
        <div className="relative min-w-[220px] flex-1">
          <Search
            className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
            aria-hidden
          />
          <input
            className="input pl-9"
            placeholder="Search customer, phone or device…"
            aria-label="Search intakes"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
          />
        </div>
      </div>

      {error && (
        <p
          role="alert"
          className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700"
        >
          {error}
        </p>
      )}

      <div className="card overflow-hidden p-0">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[860px] text-left text-sm">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                <th className="px-4 py-3 font-semibold">Date</th>
                <th className="px-4 py-3 font-semibold">Customer</th>
                <th className="px-4 py-3 font-semibold">Phone</th>
                <th className="px-4 py-3 font-semibold">Device</th>
                <th className="px-4 py-3 font-semibold">Repairs</th>
                <th className="px-4 py-3 text-right font-semibold">Quoted</th>
                <th className="px-4 py-3 font-semibold">Status</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading && (
                <tr>
                  <td colSpan={8} className="px-4 py-10 text-center">
                    <Loader2
                      className="mx-auto h-6 w-6 animate-spin text-ccr-primary"
                      aria-hidden
                    />
                  </td>
                </tr>
              )}
              {!loading && intakes.length === 0 && (
                <tr>
                  <td
                    colSpan={8}
                    className="px-4 py-10 text-center text-sm text-slate-500"
                  >
                    No intakes found.
                  </td>
                </tr>
              )}
              {!loading &&
                intakes.map((intake) => (
                  <tr key={intake.id}>
                    <td className="whitespace-nowrap px-4 py-2.5 text-slate-600">
                      {formatDateTime(intake.createdAt)}
                    </td>
                    <td className="px-4 py-2.5 font-medium text-slate-900">
                      {intake.customer.name}
                    </td>
                    <td className="whitespace-nowrap px-4 py-2.5 text-slate-600">
                      {intake.customer.phone}
                    </td>
                    <td className="px-4 py-2.5 text-slate-700">
                      {intake.brand} {intake.model}
                    </td>
                    <td className="max-w-[220px] truncate px-4 py-2.5 text-slate-600">
                      {parseJsonStringArray(intake.repairTypes).join(", ") || "—"}
                    </td>
                    <td className="px-4 py-2.5 text-right tabular-nums text-slate-900">
                      {intake.quotedPrice !== null
                        ? formatAud(intake.quotedPrice)
                        : "—"}
                    </td>
                    <td className="px-4 py-2.5">
                      <span className={intakeStatusBadge(intake.status)}>
                        {statusLabel(intake.status)}
                      </span>
                    </td>
                    <td className="px-4 py-2.5 text-right">
                      <Link
                        href={`/staff/intake/${intake.id}`}
                        className="inline-flex items-center gap-1 text-sm font-semibold text-ccr-primary hover:underline"
                      >
                        Open <ArrowRight className="h-3.5 w-3.5" aria-hidden />
                      </Link>
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
