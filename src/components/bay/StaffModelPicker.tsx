"use client";

// ---------------------------------------------------------------------------
// Staff-only brand/model selector for the bay. Picking the handset actually on
// the counter switches every price tag from a spread to the exact catalog rows
// for that model. Renders nothing for public visitors.
// ---------------------------------------------------------------------------

export default function StaffModelPicker({
  brands,
  models,
  brand,
  model,
  onBrand,
  onModel,
}: {
  readonly brands: readonly string[];
  readonly models: readonly string[];
  readonly brand: string;
  readonly model: string;
  readonly onBrand: (value: string) => void;
  readonly onModel: (value: string) => void;
}) {
  if (brands.length === 0) return null;

  return (
    <div className="flex flex-wrap items-center gap-2 border-b border-carbon-950 bg-signal-100 px-4 py-2">
      <span className="mnl-dim shrink-0 text-signal-600">STAFF · PRICE FOR</span>

      <label className="sr-only" htmlFor="bay-staff-brand">
        Brand
      </label>
      <select
        id="bay-staff-brand"
        className="min-w-0 border border-carbon-950 bg-bone-100 px-2 py-1 font-mono text-[0.6875rem] text-carbon-950 focus:outline-none focus:ring-2 focus:ring-signal-500"
        value={brand}
        onChange={(e) => onBrand(e.target.value)}
      >
        <option value="">Any brand</option>
        {brands.map((b) => (
          <option key={b} value={b}>
            {b}
          </option>
        ))}
      </select>

      <label className="sr-only" htmlFor="bay-staff-model">
        Model
      </label>
      <select
        id="bay-staff-model"
        className="min-w-0 border border-carbon-950 bg-bone-100 px-2 py-1 font-mono text-[0.6875rem] text-carbon-950 disabled:opacity-40 focus:outline-none focus:ring-2 focus:ring-signal-500"
        value={model}
        disabled={!brand}
        onChange={(e) => onModel(e.target.value)}
      >
        <option value="">{brand ? "Any model" : "Pick a brand"}</option>
        {models.map((m) => (
          <option key={m} value={m}>
            {m}
          </option>
        ))}
      </select>

      {model ? (
        <button
          type="button"
          className="mnl-dim shrink-0 text-carbon-500 underline-offset-2 hover:text-signal-600 hover:underline"
          onClick={() => {
            onBrand("");
            onModel("");
          }}
        >
          CLEAR
        </button>
      ) : null}
    </div>
  );
}
