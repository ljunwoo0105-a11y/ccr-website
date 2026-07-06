import LeadsTable from "@/components/staff/LeadsTable";

export const dynamic = "force-dynamic";

export const metadata = { title: "Quote Leads", robots: { index: false } };

export default function LeadsPage() {
  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-bold text-slate-900">Quote leads</h1>
        <p className="text-sm text-slate-500">
          Every quote request from the website — follow up, book in, close out.
        </p>
      </header>
      <LeadsTable />
    </div>
  );
}
