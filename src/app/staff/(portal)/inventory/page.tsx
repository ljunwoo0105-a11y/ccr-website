import InventoryManager from "@/components/staff/InventoryManager";

export const dynamic = "force-dynamic";

export const metadata = { title: "Inventory", robots: { index: false } };

export default function InventoryPage() {
  // Read server-side only — the env var itself never reaches the client,
  // just the provider name for display.
  const provider = process.env.POS_PROVIDER ?? "mock";

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-bold text-slate-900">Inventory</h1>
        <p className="text-sm text-slate-500">
          Stock levels for active parts, synced from the POS or adjusted by
          hand.
        </p>
      </header>
      <InventoryManager provider={provider} />
    </div>
  );
}
