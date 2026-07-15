import PriceListTable from "@/components/staff/PriceListTable";

export const dynamic = "force-dynamic";

export const metadata = { title: "Price List", robots: { index: false } };

export default function PriceListPage() {
  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-bold text-carbon-950">Price list</h1>
        <p className="text-sm text-carbon-500">
          Current sell prices for active catalog parts. Management actions are
          available in the admin catalog.
        </p>
      </header>
      <PriceListTable mode="staff" />
    </div>
  );
}
