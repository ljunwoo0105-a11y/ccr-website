import type { PreCondition } from "../../../lib/validation";
import {
  COSMETIC_GRADES,
  PRE_CONDITION_GROUPS,
  type PreConditionBooleanKey,
} from "../precondition";

type PreConditionSectionProps = {
  readonly preCondition: PreCondition;
  readonly batteryHealth: string;
  readonly onBooleanChange: (key: PreConditionBooleanKey, value: boolean) => void;
  readonly onCosmeticGradeChange: (value: PreCondition["cosmeticGrade"]) => void;
  readonly onBatteryHealthChange: (value: string) => void;
};

export function PreConditionSection(props: PreConditionSectionProps) {
  return (
    <section className="card">
      <h2 className="mb-1 text-base font-semibold text-carbon-950">
        Pre-repair condition
      </h2>
      <p className="mb-4 text-sm text-carbon-500">
        Check each item with the customer before the device leaves the counter.
      </p>
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        {PRE_CONDITION_GROUPS.map((group) => (
          <fieldset key={group.title}>
            <legend className="mb-2 text-xs font-semibold uppercase tracking-wide text-carbon-500">
              {group.title}
            </legend>
            <div className="divide-y divide-carbon-150  border border-carbon-150">
              {group.fields.map((field) => {
                const checked = props.preCondition[field.key];
                return (
                  <label
                    key={field.key}
                    className="flex cursor-pointer items-center justify-between gap-3 px-3 py-2.5"
                  >
                    <span className="text-sm text-carbon-700">
                      {field.label}
                    </span>
                    <input
                      type="checkbox"
                      className="peer sr-only"
                      checked={checked}
                      onChange={(event) =>
                        props.onBooleanChange(field.key, event.target.checked)
                      }
                    />
                    <span
                      aria-hidden
                      className="relative h-6 w-11 shrink-0 rounded-full bg-carbon-200 transition peer-checked:bg-signal-500 peer-focus-visible:ring-2 peer-focus-visible:ring-signal-500/50 after:absolute after:left-0.5 after:top-0.5 after:h-5 after:w-5 after:rounded-full after:bg-bone-50 after:shadow after:transition peer-checked:after:translate-x-5"
                    />
                  </label>
                );
              })}
            </div>
          </fieldset>
        ))}
      </div>
      <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
        <fieldset>
          <legend className="label">Cosmetic grade</legend>
          <div className="flex flex-wrap gap-2">
            {COSMETIC_GRADES.map((grade) => (
              <label
                key={grade.value}
                className={
                  props.preCondition.cosmeticGrade === grade.value
                    ? "cursor-pointer  border border-signal-500 bg-signal-500/10 px-3 py-2 text-sm font-semibold text-signal-600"
                    : "cursor-pointer  border border-carbon-200 bg-bone-50 px-3 py-2 text-sm font-medium text-carbon-700 hover:border-carbon-200"
                }
              >
                <input
                  type="radio"
                  name="cosmeticGrade"
                  value={grade.value}
                  className="sr-only"
                  checked={props.preCondition.cosmeticGrade === grade.value}
                  onChange={() => props.onCosmeticGradeChange(grade.value)}
                />
                {grade.label}
              </label>
            ))}
          </div>
        </fieldset>
        <div>
          <label htmlFor="in-battery" className="label">
            Battery health % <span className="text-carbon-400">(optional)</span>
          </label>
          <input
            id="in-battery"
            className="input max-w-[140px]"
            type="number"
            min={0}
            max={100}
            step={1}
            value={props.batteryHealth}
            onChange={(event) =>
              props.onBatteryHealthChange(event.target.value)
            }
          />
        </div>
      </div>
    </section>
  );
}
