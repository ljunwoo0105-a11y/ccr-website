"use client";

import { RotateCcw, ZoomIn, ZoomOut } from "lucide-react";

interface BayControlDeckProps {
  readonly explodePct: number;
  readonly zoomPct: number;
  readonly xray: boolean;
  readonly canZoomIn: boolean;
  readonly canZoomOut: boolean;
  readonly onExplodeChange: (pct: number) => void;
  readonly onToggleXray: () => void;
  readonly onAssemble: () => void;
  readonly onZoomIn: () => void;
  readonly onZoomOut: () => void;
  readonly onResetZoom: () => void;
}

export default function BayControlDeck({
  explodePct,
  zoomPct,
  xray,
  canZoomIn,
  canZoomOut,
  onExplodeChange,
  onToggleXray,
  onAssemble,
  onZoomIn,
  onZoomOut,
  onResetZoom,
}: BayControlDeckProps) {
  return (
    <div className="absolute inset-x-0 bottom-0 flex flex-wrap items-center gap-2 border-t border-carbon-950 bg-bone-50/90 px-3 py-2.5 backdrop-blur-sm lg:gap-3 lg:px-4">
      <label className="flex min-w-[10rem] flex-1 items-center gap-3">
        <span className="mnl-dim shrink-0 text-carbon-700">Teardown</span>
        <input
          type="range"
          min={0}
          max={100}
          value={explodePct}
          onChange={(event) => onExplodeChange(Number(event.currentTarget.value))}
          className="mnl-range w-full"
          aria-label="Explode the device into parts"
        />
        <span className="mnl-dim mnl-num w-10 shrink-0 text-right text-signal-600">
          {explodePct}%
        </span>
      </label>

      <div className="flex items-center gap-1.5" aria-label="Zoom controls">
        <button
          type="button"
          className="mnl-chip px-2.5 disabled:cursor-not-allowed disabled:opacity-40"
          onClick={onZoomOut}
          disabled={!canZoomOut}
          aria-label="Zoom out"
          title="Zoom out"
        >
          <ZoomOut className="h-3.5 w-3.5" aria-hidden="true" />
        </button>
        <button
          type="button"
          className="mnl-chip min-w-[4.5rem] justify-center px-2.5"
          onClick={onResetZoom}
          aria-label="Reset zoom"
          title="Reset zoom"
        >
          <span className="mnl-num text-signal-600">{zoomPct}%</span>
        </button>
        <button
          type="button"
          className="mnl-chip px-2.5 disabled:cursor-not-allowed disabled:opacity-40"
          onClick={onZoomIn}
          disabled={!canZoomIn}
          aria-label="Zoom in"
          title="Zoom in"
        >
          <ZoomIn className="h-3.5 w-3.5" aria-hidden="true" />
        </button>
      </div>

      <button
        type="button"
        className="mnl-chip"
        data-active={xray}
        onClick={onToggleXray}
        aria-pressed={xray}
      >
        X-Ray
      </button>
      <button type="button" className="mnl-chip" onClick={onAssemble}>
        <RotateCcw className="h-3.5 w-3.5" aria-hidden="true" />
        Assemble
      </button>
    </div>
  );
}
