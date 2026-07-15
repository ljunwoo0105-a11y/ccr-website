import type { Metadata } from "next";
import { RecordsManager } from "@/components/admin/records-manager";

export const metadata: Metadata = { title: "Records" };
export const dynamic = "force-dynamic";

export default function AdminRecordsPage() {
  return (
    <div className="space-y-8">
      <header>
        <h1 className="text-2xl font-bold text-carbon-950">Records</h1>
        <p className="mt-1 text-sm text-carbon-500">
          Review intake and repair-form records, update statuses, and remove
          invalid records with an explicit confirmation.
        </p>
      </header>

      <RecordsManager />
    </div>
  );
}
