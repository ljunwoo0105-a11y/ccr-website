"use client";

import { useRef } from "react";
import {
  motion,
  useReducedMotion,
  useScroll,
  useTransform,
} from "framer-motion";

/**
 * Scroll-linked drift (hero content, CtaBanner grid). Travel is short and
 * precise — default 0 → -40px over the element's scroll-out.
 */
export default function Parallax({
  children,
  className,
  from = 0,
  to = -40,
}: {
  children: React.ReactNode;
  className?: string;
  from?: number;
  to?: number;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const reduced = useReducedMotion();
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start start", "end start"],
  });
  const y = useTransform(scrollYProgress, [0, 1], [from, to]);

  return (
    <motion.div
      ref={ref}
      data-motion
      className={className}
      style={reduced ? undefined : { y }}
    >
      {children}
    </motion.div>
  );
}
