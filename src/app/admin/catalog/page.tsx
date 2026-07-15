import type { Metadata } from "next";
import PriceListTable from "@/components/staff/PriceListTable";

export const metadata: Metadata = { title: "Catalog" };
export const dynamic = "force-dynamic";

export default function AdminCatalogPage() {
  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-bold text-carbon-950">Catalog</h1>
        <p className="mt-1 text-sm text-carbon-500">
          Manage part rows, sell prices, stock, warranty tiers and catalog
          availability.
        </p>
      </header>
      <PriceListTable mode="admin" />
    </div>
  );
}
