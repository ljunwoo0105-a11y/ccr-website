"use client";

// Client-side dynamic loaders for the WebGL scenes. Both canvases are ssr:false
// (three.js touches window at import time) with drafting-style placeholders so
// the sheet never collapses while the bundle streams in. The below-the-fold
// board additionally defers its mount (and its chunk download) until it scrolls
// near the viewport, so the landing load never pays for a second WebGL context
// the visitor may never reach.

import dynamic from "next/dynamic";
import { useEffect, useRef, useState, type ReactNode } from "react";

function Booting({ label, height }: { label: string; height: string }) {
  return (
    <div
      className={`relative flex ${height} items-center justify-center overflow-hidden`}
      role="status"
      aria-label={label}
    >
      <div className="mnl-hatch absolute inset-0 opacity-40" aria-hidden="true" />
      <div className="relative flex items-center gap-3 border border-carbon-950 bg-bone-50 px-4 py-2.5">
        <span className="mnl-reg animate-spin text-signal-600" aria-hidden="true" />
        <span className="mnl-dim text-carbon-700">{label}</span>
      </div>
    </div>
  );
}

/**
 * Renders `placeholder` until it scrolls within `rootMargin` of the viewport,
 * then swaps in `children` for good. Keeps an off-screen WebGL scene from
 * importing its chunk and creating a GL context on the initial page load.
 */
function MountWhenNear({
  children,
  placeholder,
  rootMargin = "300px",
}: {
  children: ReactNode;
  placeholder: ReactNode;
  rootMargin?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [show, setShow] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (typeof IntersectionObserver === "undefined") {
      setShow(true);
      return;
    }
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setShow(true);
          io.disconnect();
        }
      },
      { rootMargin },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [rootMargin]);

  return <div ref={ref}>{show ? children : placeholder}</div>;
}

// SHEET 00 — above the fold, load eagerly.
export const DeviceBayLoader = dynamic(() => import("./DeviceBay"), {
  ssr: false,
  loading: () => (
    <Booting label="INITIALISING TEARDOWN RIG…" height="min-h-[560px]" />
  ),
});

// SHEET 02 — below the fold. Defer the chunk + mount until it approaches.
const SchematicBoardDynamic = dynamic(() => import("./SchematicBoard"), {
  ssr: false,
  loading: () => (
    <Booting label="ROUTING BOARD…" height="h-[440px] sm:h-[520px]" />
  ),
});

export function SchematicBoardLoader() {
  return (
    <MountWhenNear
      placeholder={
        <Booting label="ROUTING BOARD…" height="h-[440px] sm:h-[520px]" />
      }
    >
      <SchematicBoardDynamic />
    </MountWhenNear>
  );
}
