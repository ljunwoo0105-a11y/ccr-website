"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { cn } from "@/lib/utils";
import { EASE_INOUT } from "./Reveal";

/**
 * THE diagnostic scanline — a 1px gold line with a soft glow that sweeps a
 * surface once at meaningful moments (hero load, wizard submit). Decorative:
 * aria-hidden, never loops. For simple card-hover sweeps use the CSS class
 * `scan-on-hover` instead.
 */
export default function Scanline({
  play = true,
  delay = 0,
  duration = 0.9,
  onComplete,
  className,
}: {
  /** Set true to fire the sweep; resets when toggled false → true. */
  play?: boolean;
  delay?: number;
  duration?: number;
  onComplete?: () => void;
  className?: string;
}) {
  const reduced = useReducedMotion();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!play) {
      setVisible(false);
      return;
    }
    if (reduced) {
      onComplete?.();
      return;
    }
    setVisible(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [play, reduced]);

  return (
    <span
      aria-hidden="true"
      className={cn(
        "pointer-events-none absolute inset-0 overflow-hidden rounded-[inherit]",
        className
      )}
    >
      <AnimatePresence>
        {visible && (
          <motion.span
            data-motion
            className="absolute left-0 right-0 h-px shadow-gold-glow"
            style={{
              background:
                "linear-gradient(90deg, transparent, #FFB224 30%, #FFB224 70%, transparent)",
            }}
            initial={{ top: "0%", opacity: 0 }}
            animate={{
              top: ["0%", "100%"],
              opacity: [0, 1, 1, 0],
              transition: { duration, delay, ease: EASE_INOUT, times: [0, 0.08, 0.92, 1] },
            }}
            exit={{ opacity: 0 }}
            onAnimationComplete={() => {
              setVisible(false);
              onComplete?.();
            }}
          />
        )}
      </AnimatePresence>
    </span>
  );
}
