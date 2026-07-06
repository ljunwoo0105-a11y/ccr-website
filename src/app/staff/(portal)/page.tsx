import Link from "next/link";
import {
  Inbox,
  Wrench,
  PackageOpen,
  Sparkles,
  ArrowRight,
} from "lucide-react";
import { db } from "@/lib/db";
import { monthSpendUsd } from "@/lib/ai/usage";
import { formatAud, formatDateTime } from "@/lib/utils";
import {
  intakeStatusBadge,
  leadStatusBadge,
  statusLabel,
} from "@/components/staff/ui";
import { parseJsonStringArray } from "@/components/staff/types";

export const dynamic = "force-dynamic";

export const metadata = { title: "Staff Dashboard", robots: { index: false } };

export default async function StaffDashboardPage() {
  const [newLeads, activeRepairs, lowStock, aiSpend, recentLeads, recentIntakes] =
    await Promise.all([
      db.quoteRequest.count({ where: { status: "NEW" } }),
      db.repairIntake.count({
        where: { status: { in: ["CHECKED_IN", "IN_REPAIR"] } },
      }),
      db.part.count({ where: { active: true, stockQty: { lte: 1 } } }),
      monthSpendUsd(),
      db.quoteRequest.findMany({ orderBy: { createdAt: "desc" }, take: 5 }),
      db.repairIntake.findMany({
        orderBy: { createdAt: "desc" },
        take: 5,
        include: { customer: { select: { name: true } } },
      }),
    ]);

  const stats = [
    {
      label: "New leads",
      value: String(newLeads),
      href: "/staff/leads",
      icon: Inbox,
      tone: "text-orange-600 bg-orange-100",
    },
    {
      label: "Active repairs",
      value: String(activeRepairs),
      href: "/staff/intake",
      icon: Wrench,
      tone: "text-sky-600 bg-sky-100",
    },
    {
      label: "Low stock parts",
      value: String(lowStock),
      href: "/staff/inventory",
      icon: PackageOpen,
      tone: "text-amber-600 bg-amber-100",
    },
    {
      label: "AI spend this month",
      value: `US$${aiSpend.toFixed(2)}`,
      href: "/staff/price-list",
      icon: Sparkles,
      tone: "text-violet-600 bg-violet-100",
    },
  ];

  return (
    <div className="space-y-8">
      <header>
        <h1 className="text-2xl font-bold text-slate-900">Dashboard</h1>
        <p className="text-sm text-slate-500">
          What&apos;s happening at the kiosk today.
        </p>
      </header>

      <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <Link key={stat.label} href={stat.href} className="card flex items-center gap-4 transition hover:shadow-md">
              <span
                className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-lg ${stat.tone}`}
              >
                <Icon className="h-5 w-5" aria-hidden />
              </span>
              <span>
                <span className="block text-2xl font-bold text-slate-900">
                  {stat.value}
                </span>
                <span className="block text-xs font-medium text-slate-500">
                  {stat.label}
                </span>
              </span>
            </Link>
          );
        })}
      </section>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <section className="card p-0">
          <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
            <h2 className="text-sm font-semibold text-slate-900">
              Recent quote leads
            </h2>
            <Link
              href="/staff/leads"
              className="inline-flex items-center gap-1 text-xs font-semibold text-ccr-primary hover:underline"
            >
              All leads <ArrowRight className="h-3 w-3" aria-hidden />
            </Link>
          </div>
          {recentLeads.length === 0 ? (
            <p className="px-5 py-6 text-sm text-slate-500">No leads yet.</p>
          ) : (
            <ul className="divide-y divide-slate-100">
              {recentLeads.map((lead) => (
                <li key={lead.id} className="flex items-center gap-3 px-5 py-3">
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-slate-900">
                      {lead.name}
                    </p>
                    <p className="truncate text-xs text-slate-500">
                      {lead.brand} {lead.model} — {lead.repairType} ·{" "}
                      {formatDateTime(lead.createdAt)}
                    </p>
                  </div>
                  <span className={leadStatusBadge(lead.status)}>
                    {statusLabel(lead.status)}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="card p-0">
          <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
            <h2 className="text-sm font-semibold text-slate-900">
              Recent intakes
            </h2>
            <Link
              href="/staff/intake"
              className="inline-flex items-center gap-1 text-xs font-semibold text-ccr-primary hover:underline"
            >
              All intakes <ArrowRight className="h-3 w-3" aria-hidden />
            </Link>
          </div>
          {recentIntakes.length === 0 ? (
            <p className="px-5 py-6 text-sm text-slate-500">No intakes yet.</p>
          ) : (
            <ul className="divide-y divide-slate-100">
              {recentIntakes.map((intake) => (
                <li key={intake.id} className="flex items-center gap-3 px-5 py-3">
                  <div className="min-w-0 flex-1">
                    <Link
                      href={`/staff/intake/${intake.id}`}
                      className="block truncate text-sm font-medium text-slate-900 hover:text-ccr-primary"
                    >
                      {intake.customer.name} — {intake.brand} {intake.model}
                    </Link>
                    <p className="truncate text-xs text-slate-500">
                      {parseJsonStringArray(intake.repairTypes).join(", ") ||
                        "Repair"}{" "}
                      ·{" "}
                      {intake.quotedPrice !== null
                        ? formatAud(intake.quotedPrice)
                        : "No quote"}{" "}
                      · {formatDateTime(intake.createdAt)}
                    </p>
                  </div>
                  <span className={intakeStatusBadge(intake.status)}>
                    {statusLabel(intake.status)}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </div>
  );
}
