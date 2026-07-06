import IntakeForm from "@/components/staff/IntakeForm";

export const dynamic = "force-dynamic";

export const metadata = { title: "New Intake", robots: { index: false } };

export default function NewIntakePage() {
  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-bold text-slate-900">New intake</h1>
        <p className="text-sm text-slate-500">
          Record the device&apos;s condition with the customer before any work
          starts.
        </p>
      </header>
      <IntakeForm />
    </div>
  );
}
