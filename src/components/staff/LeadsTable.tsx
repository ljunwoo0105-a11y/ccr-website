"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  ChevronDown,
  ChevronUp,
  Loader2,
  Mail,
  Search,
  Send,
} from "lucide-react";
import { REFERRAL_SOURCES } from "@/lib/config";
import { formatAud, formatDateTime, cn } from "@/lib/utils";
import type { ApiEnvelope, LeadRow } from "@/components/staff/types";

const TABS = [
  { value: "", label: "All" },
  { value: "NEW", label: "New" },
  { value: "EMAILED", label: "Emailed" },
  { value: "CONTACTED", label: "Contacted" },
  { value: "BOOKED", label: "Booked" },
  { value: "CLOSED", label: "Closed" },
] as const;

const STATUS_OPTIONS = ["NEW", "EMAILED", "CONTACTED", "BOOKED", "CLOSED"];

function referralLabel(lead: LeadRow): string {
  if (lead.referralSource === "OTHER" && lead.referralOther) {
    return lead.referralOther;
  }
  return (
    REFERRAL_SOURCES.find((r) => r.value === lead.referralSource)?.label ??
    lead.referralSource
  );
}

export default function LeadsTable() {
  const [leads, setLeads] = useState<LeadRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [rowMessage, setRowMessage] = useState<{
    id: string;
    text: string;
    ok: boolean;
  } | null>(null);
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
      const res = await fetch(`/api/staff/leads?${qs.toString()}`);
      const json = (await res.json()) as ApiEnvelope<LeadRow[]>;
      if (requestId !== requestIdRef.current) return;
      if (!res.ok || !json.ok || !json.data) {
        setError(json.error ?? "Could not load leads");
        setLeads([]);
      } else {
        setLeads(json.data);
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

  async function updateStatus(lead: LeadRow, next: string) {
    setBusyId(lead.id);
    setRowMessage(null);
    try {
      const res = await fetch(`/api/staff/leads/${lead.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: next }),
      });
      const json = (await res.json()) as ApiEnvelope<LeadRow>;
      if (!res.ok || !json.ok || !json.data) {
        setRowMessage({
          id: lead.id,
          text: json.error ?? "Could not update status",
          ok: false,
        });
        return;
      }
      const updated = json.data;
      setLeads((prev) =>
        prev.map((l) => (l.id === updated.id ? updated : l))
      );
    } catch {
      setRowMessage({ id: lead.id, text: "Network error", ok: false });
    } finally {
      setBusyId(null);
    }
  }

  async function resend(lead: LeadRow) {
    setBusyId(lead.id);
    setRowMessage(null);
    try {
      const res = await fetch(`/api/staff/leads/${lead.id}/resend`, {
        method: "POST",
      });
      const json = (await res.json()) as ApiEnvelope<unknown>;
      if (!res.ok || !json.ok) {
        setRowMessage({
          id: lead.id,
          text: json.error ?? "Resend failed",
          ok: false,
        });
      } else {
        setRowMessage({
          id: lead.id,
          text: "Estimate email sent.",
          ok: true,
        });
        await load();
      }
    } catch {
      setRowMessage({ id: lead.id, text: "Network error", ok: false });
    } finally {
      setBusyId(null);
    }
  }

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
            placeholder="Search name, email, phone or model…"
            aria-label="Search leads"
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
          <table className="w-full min-w-[1000px] text-left text-sm">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                <th className="px-4 py-3 font-semibold">Created</th>
                <th className="px-4 py-3 font-semibold">Name</th>
                <th className="px-4 py-3 font-semibold">Contact</th>
                <th className="px-4 py-3 font-semibold">Suburb</th>
                <th className="px-4 py-3 font-semibold">Device &amp; repair</th>
                <th className="px-4 py-3 text-right font-semibold">From</th>
                <th className="px-4 py-3 font-semibold">Heard via</th>
                <th className="px-4 py-3 font-semibold">Status</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading && (
                <tr>
                  <td colSpan={9} className="px-4 py-10 text-center">
                    <Loader2
                      className="mx-auto h-6 w-6 animate-spin text-ccr-primary"
                      aria-hidden
                    />
                  </td>
                </tr>
              )}
              {!loading && leads.length === 0 && (
                <tr>
                  <td
                    colSpan={9}
                    className="px-4 py-10 text-center text-sm text-slate-500"
                  >
                    No leads found.
                  </td>
                </tr>
              )}
              {!loading &&
                leads.map((lead) => {
                  const expanded = expandedId === lead.id;
                  const isNew = lead.status === "NEW";
                  return (
                    <LeadRows
                      key={lead.id}
                      lead={lead}
                      expanded={expanded}
                      isNew={isNew}
                      busy={busyId === lead.id}
                      message={
                        rowMessage && rowMessage.id === lead.id
                          ? rowMessage
                          : null
                      }
                      onToggle={() =>
                        setExpandedId(expanded ? null : lead.id)
                      }
                      onStatusChange={(next) => void updateStatus(lead, next)}
                      onResend={() => void resend(lead)}
                    />
                  );
                })}
            </tbody>
          </table>
        </div>
        <div className="border-t border-slate-200 bg-slate-50 px-4 py-3">
          <p className="text-xs text-slate-500">
            The &quot;from&quot; price is the cheapest-tier estimate emailed to
            the customer — it is never shown on the public site.
          </p>
        </div>
      </div>
    </div>
  );
}

function LeadRows({
  lead,
  expanded,
  isNew,
  busy,
  message,
  onToggle,
  onStatusChange,
  onResend,
}: {
  lead: LeadRow;
  expanded: boolean;
  isNew: boolean;
  busy: boolean;
  message: { text: string; ok: boolean } | null;
  onToggle: () => void;
  onStatusChange: (next: string) => void;
  onResend: () => void;
}) {
  return (
    <>
      <tr className={cn(isNew && "bg-orange-50/70")}>
        <td className="whitespace-nowrap px-4 py-2.5 text-slate-600">
          {formatDateTime(lead.createdAt)}
        </td>
        <td className="px-4 py-2.5 font-medium text-slate-900">
          {isNew && (
            <span
              className="mr-1.5 inline-block h-2 w-2 rounded-full bg-orange-500 align-middle"
              title="New lead"
            />
          )}
          {lead.name}
        </td>
        <td className="px-4 py-2.5 text-slate-600">
          <span className="block">{lead.phone}</span>
          <span className="block max-w-[180px] truncate text-xs text-slate-500">
            {lead.email}
          </span>
        </td>
        <td className="px-4 py-2.5 text-slate-600">{lead.suburb}</td>
        <td className="px-4 py-2.5 text-slate-700">
          <span className="block">
            {lead.brand} {lead.model}
          </span>
          <span className="block text-xs text-slate-500">
            {lead.repairType}
          </span>
        </td>
        <td className="px-4 py-2.5 text-right tabular-nums">
          {lead.fromPriceAud !== null ? (
            <span className="font-semibold text-slate-900">
              {formatAud(lead.fromPriceAud)}
            </span>
          ) : (
            <span className="text-xs text-slate-500">Inspection</span>
          )}
        </td>
        <td className="px-4 py-2.5 text-xs text-slate-600">
          {referralLabel(lead)}
        </td>
        <td className="px-4 py-2.5">
          <select
            className="input w-32 px-2 py-1.5 text-xs"
            aria-label={`Status for ${lead.name}`}
            value={lead.status}
            disabled={busy}
            onChange={(e) => onStatusChange(e.target.value)}
          >
            {STATUS_OPTIONS.map((s) => (
              <option key={s} value={s}>
                {s.charAt(0) + s.slice(1).toLowerCase()}
              </option>
            ))}
          </select>
        </td>
        <td className="px-4 py-2.5 text-right">
          <button
            type="button"
            onClick={onToggle}
            aria-expanded={expanded}
            aria-label={expanded ? "Collapse details" : "Expand details"}
            className="rounded-lg p-1.5 text-slate-500 transition hover:bg-slate-100 hover:text-slate-900"
          >
            {expanded ? (
              <ChevronUp className="h-4 w-4" aria-hidden />
            ) : (
              <ChevronDown className="h-4 w-4" aria-hidden />
            )}
          </button>
        </td>
      </tr>
      {expanded && (
        <tr className="bg-slate-50">
          <td colSpan={9} className="px-6 py-4">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
              <div className="md:col-span-2">
                <h3 className="mb-1 text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Issue notes
                </h3>
                <p className="whitespace-pre-wrap text-sm text-slate-700">
                  {lead.issueNotes || "No notes provided."}
                </p>
              </div>
              <div className="space-y-2 text-sm">
                <p className="flex items-center gap-2 text-slate-600">
                  <Mail className="h-4 w-4 text-slate-400" aria-hidden />
                  {lead.emailedAt
                    ? `Emailed ${formatDateTime(lead.emailedAt)}`
                    : "Estimate not emailed yet"}
                </p>
                {lead.emailError && (
                  <p className="rounded-lg border border-rose-200 bg-rose-50 px-2 py-1.5 text-xs text-rose-700">
                    Last email error: {lead.emailError}
                  </p>
                )}
                {message && (
                  <p
                    className={
                      message.ok
                        ? "rounded-lg border border-emerald-200 bg-emerald-50 px-2 py-1.5 text-xs text-emerald-700"
                        : "rounded-lg border border-rose-200 bg-rose-50 px-2 py-1.5 text-xs text-rose-700"
                    }
                  >
                    {message.text}
                  </p>
                )}
                <button
                  type="button"
                  className="btn-ghost px-3 py-2 text-xs"
                  disabled={busy}
                  onClick={onResend}
                >
                  {busy ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden />
                  ) : (
                    <Send className="h-3.5 w-3.5" aria-hidden />
                  )}
                  Resend estimate
                </button>
              </div>
            </div>
          </td>
        </tr>
      )}
    </>
  );
}
