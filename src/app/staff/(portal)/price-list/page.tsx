import PriceListTable from "@/components/staff/PriceListTable";

export const dynamic = "force-dynamic";

export const metadata = { title: "Price List", robots: { index: false } };

export default function PriceListPage() {
  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-bold text-slate-900">Price list</h1>
        <p className="text-sm text-slate-500">
          Parts, costs, sell prices and margins. Use the AI price check to
          benchmark against the local market.
        </p>
      </header>
      <PriceListTable />
    </div>
  );
}
