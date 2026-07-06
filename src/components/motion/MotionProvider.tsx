"use client";

import { MotionConfig } from "framer-motion";

/**
 * Root motion gate for the public site. `reducedMotion="user"` disables
 * transform/layout animations for prefers-reduced-motion users while keeping
 * opacity fades — the Benchlight reduced-motion contract.
 */
export default function MotionProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  return <MotionConfig reducedMotion="user">{children}</MotionConfig>;
}
