import type { AcknowledgementState, PolicyLoadState } from "./policies";

type AcknowledgementSectionProps = {
  readonly policyState: PolicyLoadState;
  readonly agreedAll: boolean;
  readonly onAgreeAllChange: (accepted: boolean) => void;
};

export function AcknowledgementSection(props: AcknowledgementSectionProps) {
  return (
    <section className="card">
      <h2 className="mb-2 text-base font-semibold text-carbon-950">
        Customer acknowledgement
      </h2>
      <p className="mb-4  bg-bone-100 p-3 text-xs leading-relaxed text-carbon-700">
        I confirm the condition record above is accurate. I understand that
        repairs may reveal further faults not visible before teardown, and that
        the quoted price may change after inspection — any change will be
        discussed with me for approval before proceeding. I understand I should
        back up my data before the repair and that CCR Cool Case Repair is not
        responsible for any loss of data.
      </p>
      <div className="mb-4 space-y-3">
        {props.policyState.kind === "loading" && (
          <p className="text-sm text-carbon-500">Loading active policies...</p>
        )}
        {props.policyState.kind === "failed" && (
          <p role="alert" className="text-sm text-rose-700">
            {props.policyState.message}
          </p>
        )}
        {/* The policies stay on screen in full — acceptance is a single tick,
            but the customer must still be able to read what they accept. */}
        {props.policyState.kind === "ready" &&
          props.policyState.policies.map((policy) => (
            <div
              key={policy.id}
              className="block border border-carbon-150 bg-bone-50 p-3"
            >
              <span className="block text-sm font-semibold text-carbon-950">
                {policy.title} v{policy.version}
              </span>
              <span className="block text-xs text-carbon-600">
                {policy.category}
              </span>
              <details className="mt-2 text-xs leading-relaxed text-carbon-700">
                <summary className="cursor-pointer font-medium">
                  View policy text
                </summary>
                <p className="mt-2 whitespace-pre-wrap">{policy.body}</p>
              </details>
            </div>
          ))}
      </div>
      <label
        htmlFor="in-agree-all"
        className="flex cursor-pointer items-start gap-2 border border-carbon-950 bg-bone-100 p-3 text-sm font-medium text-carbon-950"
      >
        <input
          id="in-agree-all"
          type="checkbox"
          className="mt-0.5 h-4 w-4"
          required
          checked={props.agreedAll}
          onChange={(event) => props.onAgreeAllChange(event.target.checked)}
        />
        <span>
          The customer agrees to all of the above — every policy listed here and
          that the pre-repair condition record is accurate.
        </span>
      </label>
    </section>
  );
}
