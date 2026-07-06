import QuoteBuilder from "@/components/staff/QuoteBuilder";

export const dynamic = "force-dynamic";

export const metadata = { title: "New Quote", robots: { index: false } };

export default function NewQuotePage() {
  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-bold text-slate-900">New repair quote</h1>
        <p className="text-sm text-slate-500">
          Walk the customer through their options in store, then email them the
          repair form. Prices here are staff-only.
        </p>
      </header>
      <QuoteBuilder />
    </div>
  );
}
