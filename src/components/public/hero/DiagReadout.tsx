"use client";

import { motion, useReducedMotion } from "framer-motion";
import { EASE_PRECISION } from "@/components/motion/Reveal";

const LINES = [
  { text: "SCREEN ........ OK", ok: true },
  { text: "BATTERY ....... OK", ok: true },
  { text: "CHARGE PORT ... OK", ok: true },
  { text: "DIAG COMPLETE — SAME-DAY READY", final: true },
];

/**
 * The bench test output — four mono lines that "run" once on mount,
 * sequenced to follow the hero scanline. Event-fired, never loops.
 */
export default function DiagReadout({ className }: { className?: string }) {
  const reduced = useReducedMotion();

  return (
    <div className={className}>
      <div
        aria-hidden="true"
        className="tnum space-y-1.5 font-mono text-[0.6875rem] uppercase tracking-[0.14em] text-ink-500"
      >
        {LINES.map((line, i) => (
          <motion.p
            key={line.text}
            data-motion
            initial={reduced ? false : { opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{
              duration: 0.2,
              delay: reduced ? 0 : 1.1 + i * 0.45,
              ease: EASE_PRECISION,
            }}
            className={line.final ? "text-gold-500" : undefined}
          >
            {line.ok ? (
              <>
                {line.text.slice(0, -2)}
                <span className="text-status-green">OK</span>
              </>
            ) : (
              line.text
            )}
          </motion.p>
        ))}
      </div>
      <p className="sr-only">
        Diagnostics complete — same-day repairs available.
      </p>
    </div>
  );
}
