"use client";

import { ZoomIn, ZoomOut } from "lucide-react";

interface BoardZoomControlsProps {
  readonly zoomPct: number;
  readonly canZoomIn: boolean;
  readonly canZoomOut: boolean;
  readonly onZoomIn: () => void;
  readonly onZoomOut: () => void;
  readonly onResetZoom: () => void;
}

export function BoardZoomControls({
  zoomPct,
  canZoomIn,
  canZoomOut,
  onZoomIn,
  onZoomOut,
  onResetZoom,
}: BoardZoomControlsProps) {
  return (
    <div
      className="absolute right-3 top-3 z-20 flex items-center gap-1.5 sm:right-4 sm:top-4"
      aria-label="Board zoom controls"
    >
      <button
        type="button"
        className="mnl-chip px-2.5 disabled:cursor-not-allowed disabled:opacity-40"
        onClick={onZoomOut}
        disabled={!canZoomOut}
        aria-label="Zoom out board-level diagram"
        title="Zoom out"
      >
        <ZoomOut className="h-3.5 w-3.5" aria-hidden="true" />
      </button>
      <button
        type="button"
        className="mnl-chip min-w-[4.5rem] justify-center px-2.5"
        onClick={onResetZoom}
        aria-label="Reset board diagram zoom"
        title="Reset zoom"
      >
        <span className="mnl-num text-signal-600">{zoomPct}%</span>
      </button>
      <button
        type="button"
        className="mnl-chip px-2.5 disabled:cursor-not-allowed disabled:opacity-40"
        onClick={onZoomIn}
        disabled={!canZoomIn}
        aria-label="Zoom in board-level diagram"
        title="Zoom in"
      >
        <ZoomIn className="h-3.5 w-3.5" aria-hidden="true" />
      </button>
    </div>
  );
}
