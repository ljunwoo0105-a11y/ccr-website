"use client";

import type { Dispatch } from "react";
import { Loader2, RotateCcw, ShieldCheck } from "lucide-react";
import { isCascadeReady } from "./state";
import type { WorkbenchAction, WorkbenchState } from "./types";

interface WorkbenchControlsProps {
  readonly state: WorkbenchState;
  readonly dispatch: Dispatch<WorkbenchAction>;
}

export default function WorkbenchControls({
  state,
  dispatch,
}: WorkbenchControlsProps) {
  return (
    <>
      <div className="flex flex-wrap items-start justify-between gap-4 border-b border-carbon-950 pb-4">
        <div>
          <p className="mnl-dim text-signal-600">STAFF PRICE BENCH</p>
          <h2 className="mnl-display mt-1 text-3xl text-carbon-950 sm:text-4xl">
            Protected quote match
          </h2>
        </div>
        <button
          type="button"
          className="mnl-chip"
          onClick={() => dispatch({ type: "RESET_SELECTION" })}
        >
          <RotateCcw className="h-4 w-4" aria-hidden="true" />
          Reset
        </button>
      </div>

      <div className="grid gap-4 py-5 md:grid-cols-4">
        <SelectControl
          label="Device"
          value={state.selection.deviceType}
          options={state.options.deviceTypes}
          onChange={(value) => dispatch({ type: "SELECT_DEVICE_TYPE", value })}
        />
        <SelectControl
          label="Brand"
          value={state.selection.brand}
          options={state.options.brands}
          disabled={!state.selection.deviceType}
          onChange={(value) => dispatch({ type: "SELECT_BRAND", value })}
        />
        <SelectControl
          label="Model"
          value={state.selection.model}
          options={state.options.models}
          disabled={!state.selection.brand}
          onChange={(value) => dispatch({ type: "SELECT_MODEL", value })}
        />
        <SelectControl
          label="Diagnosis"
          value={state.selectedDiagnosisId}
          options={state.diagnoses.map((diagnosis) => diagnosis.id)}
          labels={Object.fromEntries(
            state.diagnoses.map((diagnosis) => [
              diagnosis.id,
              diagnosis.symptomLabel,
            ])
          )}
          disabled={!isCascadeReady(state.selection)}
          onChange={(value) => dispatch({ type: "SELECT_DIAGNOSIS", value })}
        />
      </div>

      <StatusLine loadingTarget={state.loadingTarget} error={state.error} />
    </>
  );
}

function SelectControl(props: {
  readonly label: string;
  readonly value: string;
  readonly options: readonly string[];
  readonly labels?: Readonly<Record<string, string>>;
  readonly disabled?: boolean;
  readonly onChange: (value: string) => void;
}) {
  return (
    <label className="block min-w-0">
      <span className="mnl-dim text-carbon-500">{props.label}</span>
      <select
        className="mt-1 w-full border border-carbon-950 bg-bone-100 px-3 py-2 text-sm text-carbon-950 shadow-none focus:outline-none focus:ring-2 focus:ring-signal-500"
        value={props.value}
        disabled={props.disabled}
        onChange={(event) => props.onChange(event.currentTarget.value)}
      >
        <option value="">Select {props.label.toLowerCase()}</option>
        {props.options.map((option) => (
          <option key={option} value={option}>
            {props.labels?.[option] ?? option}
          </option>
        ))}
      </select>
    </label>
  );
}

function StatusLine(props: {
  readonly loadingTarget: string | null;
  readonly error: string | null;
}) {
  if (props.error) {
    return (
      <p
        role="alert"
        className="mb-4 border border-rose-600 bg-rose-50 px-3 py-2 text-sm text-rose-700"
      >
        {props.error}
      </p>
    );
  }
  if (props.loadingTarget) {
    return (
      <p className="mb-4 flex items-center gap-2 text-sm text-carbon-600">
        <Loader2
          className="h-4 w-4 animate-spin text-signal-600"
          aria-hidden="true"
        />
        Loading {props.loadingTarget}
      </p>
    );
  }
  return (
    <p className="mb-4 flex items-center gap-2 text-sm text-carbon-600">
      <ShieldCheck className="h-4 w-4 text-signal-600" aria-hidden="true" />
      Staff-only data loads after authenticated session check.
    </p>
  );
}
