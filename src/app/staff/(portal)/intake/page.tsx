import Link from "next/link";
import { Plus } from "lucide-react";
import IntakeTable from "@/components/staff/IntakeTable";

export const dynamic = "force-dynamic";

export const metadata = { title: "Customer Intake", robots: { index: false } };

export default function IntakeListPage() {
  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Customer intake</h1>
          <p className="text-sm text-slate-500">
            Pre-repair condition records for every device checked in.
          </p>
        </div>
        <Link href="/staff/intake/new" className="btn-secondary px-4 py-2.5">
          <Plus className="h-4 w-4" aria-hidden />
          New intake
        </Link>
      </header>
      <IntakeTable />
    </div>
  );
}
