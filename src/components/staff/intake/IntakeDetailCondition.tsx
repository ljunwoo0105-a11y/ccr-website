import { Check, X } from "lucide-react";
import {
  PRE_CONDITION_GROUPS,
  cosmeticGradeLabel,
} from "@/components/staff/precondition";
import type { PreCondition } from "@/lib/validation";
import { IntakeDetailRow } from "./IntakeDetailRow";

type IntakeDetailConditionProps = {
  readonly preCondition: PreCondition | null;
  readonly conditionNotes: string | null;
};

export function IntakeDetailCondition(props: IntakeDetailConditionProps) {
  return (
    <div className="space-y-6 print:space-y-4">
      <PreRepairConditionSection preCondition={props.preCondition} />
      {props.conditionNotes && <ConditionNotes notes={props.conditionNotes} />}
    </div>
  );
}

function PreRepairConditionSection({
  preCondition,
}: {
  readonly preCondition: PreCondition | null;
}) {
  return (
    <section className="card print:rounded-none print:border-slate-300 print:p-4 print:shadow-none">
      <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-carbon-500">
        Pre-repair condition
      </h2>
      {!preCondition && (
        <p className="text-sm text-carbon-500">
          Condition record could not be read.
        </p>
      )}
      {preCondition && (
        <div className="space-y-4">
          {PRE_CONDITION_GROUPS.map((group) => (
            <div key={group.title}>
              <h3 className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-carbon-400">
                {group.title}
              </h3>
              <ul className="divide-y divide-carbon-150 border border-carbon-150 print:border-slate-300">
                {group.fields.map((field) => {
                  const value = Boolean(preCondition[field.key]);
                  return (
                    <li
                      key={field.key}
                      className="flex items-center justify-between gap-3 px-3 py-1.5 text-sm"
                    >
                      <span className="text-carbon-700">{field.label}</span>
                      {value ? (
                        <span className="inline-flex items-center gap-1 font-semibold text-emerald-700">
                          <Check className="h-4 w-4" aria-hidden /> Yes
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 font-semibold text-carbon-500">
                          <X className="h-4 w-4" aria-hidden /> No
                        </span>
                      )}
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
          <dl className="space-y-1.5 text-sm">
            <IntakeDetailRow
              label="Cosmetic grade"
              value={cosmeticGradeLabel(preCondition.cosmeticGrade)}
            />
            <IntakeDetailRow
              label="Battery health"
              value={
                preCondition.batteryHealthPct !== null &&
                preCondition.batteryHealthPct !== undefined
                  ? `${preCondition.batteryHealthPct}%`
                  : "Not recorded"
              }
            />
          </dl>
        </div>
      )}
    </section>
  );
}

function ConditionNotes({ notes }: { readonly notes: string }) {
  return (
    <section className="card print:rounded-none print:border-slate-300 print:p-4 print:shadow-none">
      <h2 className="mb-2 text-sm font-semibold uppercase tracking-wide text-carbon-500">
        Condition notes
      </h2>
      <p className="whitespace-pre-wrap text-sm text-carbon-700">{notes}</p>
    </section>
  );
}
