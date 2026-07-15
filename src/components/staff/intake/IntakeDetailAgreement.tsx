import { BUSINESS } from "@/lib/config";
import { formatDateTime } from "@/lib/utils";
import type { IntakeDetailAgreementProjection } from "@/lib/intakes/detail";
import { warrantyLabel } from "@/components/staff/ui";
import { IntakeDetailRow } from "./IntakeDetailRow";

type IntakeDetailAgreementProps = {
  readonly agreement: IntakeDetailAgreementProjection;
  readonly customerSignature: string | null;
  readonly createdAt: Date;
};

export function IntakeDetailAgreement(props: IntakeDetailAgreementProps) {
  return (
    <>
      <CustomerAcknowledgement
        agreement={props.agreement}
        customerSignature={props.customerSignature}
        createdAt={props.createdAt}
      />
      {props.agreement.policies.length > 0 && (
        <AcceptedPolicies agreement={props.agreement} />
      )}
    </>
  );
}

function CustomerAcknowledgement(props: IntakeDetailAgreementProps) {
  return (
    <section className="card print:rounded-none print:border-slate-300 print:p-4 print:shadow-none">
      <h2 className="mb-2 text-sm font-semibold uppercase tracking-wide text-carbon-500">
        Customer acknowledgement
      </h2>
      <p className="mb-3 text-xs leading-relaxed text-carbon-500">
        The customer confirmed the condition record is accurate, and
        acknowledged that repairs may reveal further faults, that the quoted
        price may change after teardown (with approval before proceeding), that
        data should be backed up beforehand, and that {BUSINESS.name} is not
        responsible for data loss.
      </p>
      <p className="text-sm text-carbon-700">
        Signed (typed):{" "}
        <span className="font-semibold text-carbon-950">
          {props.customerSignature ?? "\u2014"}
        </span>
      </p>
      <p className="mt-1 text-xs text-carbon-500">
        {formatDateTime(props.agreement.acceptedAt ?? props.createdAt)}
      </p>
    </section>
  );
}

function AcceptedPolicies({
  agreement,
}: {
  readonly agreement: IntakeDetailAgreementProjection;
}) {
  return (
    <section className="card print:rounded-none print:border-slate-300 print:p-4 print:shadow-none">
      <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-carbon-500">
        Accepted policies
      </h2>
      <dl className="mb-4 space-y-1.5 text-sm">
        <IntakeDetailRow
          label="Accepted"
          value={formatDateTime(agreement.acceptedAt)}
        />
        <IntakeDetailRow
          label="Warranty"
          value={
            agreement.warrantyDays !== null
              ? warrantyLabel(agreement.warrantyDays)
              : "Not specified"
          }
        />
        <IntakeDetailRow
          label="Condition accuracy"
          value={
            agreement.preConditionAccuracyAccepted ? "Accepted" : "Not recorded"
          }
        />
      </dl>
      <div className="space-y-3">
        {agreement.policies.map((policy) => (
          <article
            key={`${policy.category}-${policy.id}`}
            className="border-t border-carbon-150 pt-3 print:border-slate-300"
          >
            <p className="text-xs font-semibold uppercase tracking-wide text-carbon-500">
              {policy.category} v{policy.version}
            </p>
            <h3 className="mt-1 text-sm font-semibold text-carbon-950">
              {policy.title}
            </h3>
            <p className="mt-1 whitespace-pre-wrap text-xs leading-relaxed text-carbon-600">
              {policy.body}
            </p>
          </article>
        ))}
      </div>
    </section>
  );
}
