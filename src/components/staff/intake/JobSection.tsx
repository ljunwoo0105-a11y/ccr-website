import {
  PART_QUALITIES,
  QUALITY_LABELS,
} from "../../../lib/config";
import type { IntakeInput } from "../../../lib/validation";

type PartQualitySelection = IntakeInput["partQuality"] | "";

type JobSectionProps = {
  readonly partQuality: PartQualitySelection;
  readonly warrantyDays: string;
  readonly quotedPrice: string;
  readonly depositPaid: boolean;
  readonly onPartQualityChange: (value: PartQualitySelection) => void;
  readonly onWarrantyDaysChange: (value: string) => void;
  readonly onQuotedPriceChange: (value: string) => void;
  readonly onDepositPaidChange: (value: boolean) => void;
};

export function JobSection(props: JobSectionProps) {
  return (
    <section className="card">
      <h2 className="mb-4 text-base font-semibold text-carbon-950">Job</h2>
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <div>
          <label htmlFor="in-quality" className="label">
            Part quality
          </label>
          <select
            id="in-quality"
            className="input"
            value={props.partQuality}
            onChange={(event) => {
              if (event.target.value === "") {
                props.onPartQualityChange("");
                return;
              }
              const selected = PART_QUALITIES.find(
                (quality) => quality === event.target.value
              );
              if (selected) props.onPartQualityChange(selected);
            }}
          >
            <option value="">Not decided</option>
            {PART_QUALITIES.map((quality) => (
              <option key={quality} value={quality}>
                {QUALITY_LABELS[quality]}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="in-warranty" className="label">
            Warranty (days)
          </label>
          <input
            id="in-warranty"
            className="input"
            type="number"
            min={0}
            step={1}
            value={props.warrantyDays}
            onChange={(event) => props.onWarrantyDaysChange(event.target.value)}
          />
        </div>
        <div>
          <label htmlFor="in-quoted" className="label">
            Quoted price (AUD)
          </label>
          <input
            id="in-quoted"
            className="input"
            type="number"
            min={0}
            step="0.01"
            value={props.quotedPrice}
            onChange={(event) => props.onQuotedPriceChange(event.target.value)}
          />
        </div>
        <div>
          <span className="label">Deposit</span>
          <label
            htmlFor="in-deposit"
            className="mt-1 flex cursor-pointer items-center gap-2 border border-carbon-150 px-3 py-2.5"
          >
            <input
              id="in-deposit"
              type="checkbox"
              className="h-4 w-4"
              checked={props.depositPaid}
              onChange={(event) => props.onDepositPaidChange(event.target.checked)}
            />
            <span className="text-sm text-carbon-700">Deposit paid</span>
          </label>
        </div>
      </div>
    </section>
  );
}
