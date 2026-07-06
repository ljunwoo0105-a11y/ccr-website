"use client";

import { AnimatePresence, motion } from "framer-motion";
import { EASE_PRECISION } from "./Reveal";

/**
 * Height-auto expand/collapse for accordions (FAQ, wizard summaries).
 * 350ms precision ease; reduced-motion users get a crossfade via the root
 * MotionConfig. Content is unmounted when closed (keeps DOM lean).
 */
export default function Collapse({
  open,
  children,
  className,
}: {
  open: boolean;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <AnimatePresence initial={false}>
      {open && (
        <motion.div
          data-motion
          className={className}
          style={{ overflow: "hidden" }}
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: "auto", opacity: 1 }}
          exit={{ height: 0, opacity: 0 }}
          transition={{ duration: 0.35, ease: EASE_PRECISION }}
        >
          {children}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
