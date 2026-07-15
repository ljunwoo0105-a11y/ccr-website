import { prefillSummaryRows, type IntakePrefill } from "./prefill";

type PrefillNoticeProps = {
  readonly prefill: IntakePrefill;
};

export function PrefillNotice(props: PrefillNoticeProps) {
  const rows = prefillSummaryRows(props.prefill);
  if (rows.length === 0) return null;

  return (
    <section className="card">
      <h2 className="mb-2 text-base font-semibold text-carbon-950">
        Matched diagnosis
      </h2>
      <dl className="grid grid-cols-1 gap-2 text-sm sm:grid-cols-2">
        {rows.map(([label, value]) => (
          <div key={label}>
            <dt className="label">{label}</dt>
            <dd className="text-carbon-700">{value}</dd>
          </div>
        ))}
      </dl>
    </section>
  );
}
