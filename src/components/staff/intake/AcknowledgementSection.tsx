import type { AcknowledgementState, PolicyLoadState } from "./policies";

type AcknowledgementSectionProps = {
  readonly signature: string;
  readonly policyState: PolicyLoadState;
  readonly acknowledgementState: AcknowledgementState;
  readonly onTogglePolicy: (policyId: string) => void;
  readonly onPreConditionAccuracyAcceptedChange: (accepted: boolean) => void;
  readonly onSignatureChange: (value: string) => void;
};

export function AcknowledgementSection(props: AcknowledgementSectionProps) {
  const acceptedPolicyIds = new Set(
    props.acknowledgementState.acceptedPolicyIds
  );

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
        {props.policyState.kind === "ready" &&
          props.policyState.policies.map((policy) => (
            <label
              key={policy.id}
              className="block border border-carbon-150 bg-bone-50 p-3"
            >
              <span className="flex items-start gap-2">
                <input
                  type="checkbox"
                  className="mt-1"
                  required
                  checked={acceptedPolicyIds.has(policy.id)}
                  onChange={() => props.onTogglePolicy(policy.id)}
                />
                <span>
                  <span className="block text-sm font-semibold text-carbon-950">
                    {policy.title} v{policy.version}
                  </span>
                  <span className="block text-xs text-carbon-600">
                    {policy.category}
                  </span>
                </span>
              </span>
              <details className="mt-2 text-xs leading-relaxed text-carbon-700">
                <summary className="cursor-pointer font-medium">
                  View policy text
                </summary>
                <p className="mt-2 whitespace-pre-wrap">{policy.body}</p>
              </details>
            </label>
          ))}
        <label className="flex items-start gap-2 border border-carbon-150 bg-bone-50 p-3 text-sm text-carbon-700">
          <input
            type="checkbox"
            className="mt-1"
            required
            checked={props.acknowledgementState.preConditionAccuracyAccepted}
            onChange={(event) =>
              props.onPreConditionAccuracyAcceptedChange(event.target.checked)
            }
          />
          <span>I confirm the pre-repair condition record is accurate.</span>
        </label>
      </div>
      <div className="max-w-sm">
        <label htmlFor="in-signature" className="label">
          Customer types full name to confirm the condition record is accurate
        </label>
        <input
          id="in-signature"
          className="input"
          required
          placeholder="Full name"
          value={props.signature}
          onChange={(event) => props.onSignatureChange(event.target.value)}
        />
      </div>
    </section>
  );
}
