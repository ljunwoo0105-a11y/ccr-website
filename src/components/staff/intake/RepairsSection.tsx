import { Plus, X } from "lucide-react";
import type { JSX } from "react";

import { COMMON_REPAIRS } from "./constants";

type RepairsSectionProps = {
  readonly repairs: readonly string[];
  readonly customRepair: string;
  readonly onCustomRepairChange: (value: string) => void;
  readonly onToggleRepair: (repair: string) => void;
  readonly onAddCustomRepair: () => void;
};

export function RepairsSection(props: RepairsSectionProps) {
  const customRepairChips: JSX.Element[] = [];
  for (const repair of props.repairs) {
    if (COMMON_REPAIRS.includes(repair)) continue;
    customRepairChips.push(
      <span
        key={repair}
        className="inline-flex items-center gap-1.5 rounded-full border border-signal-500 bg-signal-500 px-3 py-1.5 text-sm font-medium text-carbon-950"
      >
        {repair}
        <button
          type="button"
          aria-label={`Remove ${repair}`}
          onClick={() => props.onToggleRepair(repair)}
          className="rounded-full hover:bg-bone-50/20"
        >
          <X className="h-3.5 w-3.5" aria-hidden />
        </button>
      </span>
    );
  }

  return (
    <section className="card">
      <h2 className="mb-1 text-base font-semibold text-carbon-950">Repairs</h2>
      <p className="mb-4 text-sm text-carbon-500">
        Select everything being done on this job.
      </p>
      <div className="flex flex-wrap gap-2">
        {COMMON_REPAIRS.map((repair) => {
          const selected = props.repairs.includes(repair);
          return (
            <button
              key={repair}
              type="button"
              aria-pressed={selected}
              onClick={() => props.onToggleRepair(repair)}
              className={
                selected
                  ? "rounded-full border border-signal-500 bg-signal-500 px-3 py-1.5 text-sm font-medium text-carbon-950"
                  : "rounded-full border border-carbon-200 bg-bone-50 px-3 py-1.5 text-sm font-medium text-carbon-700 transition hover:border-signal-500 hover:text-signal-600"
              }
            >
              {repair}
            </button>
          );
        })}
        {customRepairChips}
      </div>
      <div className="mt-4 flex max-w-sm gap-2">
        <input
          className="input"
          placeholder="Add a custom repair…"
          aria-label="Custom repair type"
          value={props.customRepair}
          onChange={(event) => props.onCustomRepairChange(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter") {
              event.preventDefault();
              props.onAddCustomRepair();
            }
          }}
        />
        <button
          type="button"
          className="btn-ghost px-3 py-2"
          onClick={props.onAddCustomRepair}
        >
          <Plus className="h-4 w-4" aria-hidden />
          Add
        </button>
      </div>
    </section>
  );
}
