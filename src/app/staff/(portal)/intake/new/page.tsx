import IntakeForm from "@/components/staff/IntakeForm";
import { parseIntakePrefill } from "@/components/staff/intake/prefill";

export const dynamic = "force-dynamic";

export const metadata = { title: "New Intake", robots: { index: false } };

type NewIntakePageProps = {
  readonly searchParams?: Promise<
    Readonly<Record<string, string | readonly string[] | undefined>>
  >;
};

export default async function NewIntakePage(props: NewIntakePageProps) {
  const searchParams = await props.searchParams;
  const prefill = parseIntakePrefill(searchParams ?? {});

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-bold text-carbon-950">New intake</h1>
        <p className="text-sm text-carbon-500">
          Record the device&apos;s condition with the customer before any work
          starts.
        </p>
      </header>
      <IntakeForm prefill={prefill} />
    </div>
  );
}
