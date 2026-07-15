import type { Metadata } from "next";
import { PriceAccessManager } from "@/components/admin/price-access-manager";

export const metadata: Metadata = { title: "Price Access" };
export const dynamic = "force-dynamic";

export default function AdminPriceAccessPage() {
  return (
    <div className="space-y-8">
      <header>
        <h1 className="text-2xl font-bold text-carbon-950">Price Access</h1>
        <p className="mt-1 text-sm text-carbon-500">
          Review recent staff price-matching access by user, device context,
          outcome and redacted request context.
        </p>
      </header>

      <PriceAccessManager />
    </div>
  );
}
