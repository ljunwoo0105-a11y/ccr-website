import Link from "next/link";
import { Plus } from "lucide-react";
import { db } from "@/lib/db";
import { formatAud, formatDateTime } from "@/lib/utils";

export const dynamic = "force-dynamic";

export const metadata = { title: "Repair Quotes", robots: { index: false } };

export default async function QuotesPage() {
  const forms = await db.repairForm.findMany({
    include: { items: true },
    orderBy: { createdAt: "desc" },
    take: 100,
  });

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Repair quotes</h1>
          <p className="text-sm text-slate-500">
            In-store quotes generated for customers. Prices shown here are
            staff-only.
          </p>
        </div>
        <Link href="/staff/quote/new" className="btn-primary">
          <Plus className="h-4 w-4" aria-hidden />
          New quote
        </Link>
      </header>

      <div className="card overflow-x-auto p-0">
        {forms.length === 0 ? (
          <p className="p-6 text-sm text-slate-500">
            No repair quotes yet. Create one to show a customer their price and
            email them the form.
          </p>
        ) : (
          <table className="w-full text-sm">
            <thead className="border-b border-slate-200 bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-4 py-3 font-semibold">Date</th>
                <th className="px-4 py-3 font-semibold">Customer</th>
                <th className="px-4 py-3 font-semibold">Device</th>
                <th className="px-4 py-3 font-semibold">Repairs</th>
                <th className="px-4 py-3 text-right font-semibold">Total</th>
                <th className="px-4 py-3 font-semibold">Email</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {forms.map((f) => (
                <tr key={f.id} className="align-top">
                  <td className="px-4 py-3 text-slate-500">
                    {formatDateTime(f.createdAt)}
                  </td>
                  <td className="px-4 py-3">
                    <span className="font-medium text-slate-900">
                      {f.customerName}
                    </span>
                    <span className="block text-xs text-slate-500">
                      {f.customerEmail}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-slate-700">
                    {f.brand} {f.model}
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-slate-900">
                      {f.items.map((i) => i.repairType).join(", ") || "—"}
                    </span>
                    {f.items.length > 1 && (
                      <span className="block text-xs text-slate-500">
                        {f.items.length} repairs
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-right font-semibold text-slate-900">
                    {formatAud(f.total)}
                  </td>
                  <td className="px-4 py-3">
                    {f.emailedAt ? (
                      <span className="text-emerald-700">Sent</span>
                    ) : f.emailError ? (
                      <span className="text-rose-600">Failed</span>
                    ) : (
                      <span className="text-slate-400">—</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
