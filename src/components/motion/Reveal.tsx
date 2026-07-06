"use client";

import { motion, type Variants } from "framer-motion";
import { cn } from "@/lib/utils";

export const EASE_PRECISION = [0.22, 1, 0.36, 1] as const;
export const EASE_INOUT = [0.65, 0, 0.35, 1] as const;

/** Standard once-only scroll reveal: opacity 0→1, y 24→0 (or x for rows). */
export function Reveal({
  children,
  className,
  delay = 0,
  duration = 0.6,
  y = 24,
  x = 0,
  margin = "-80px",
  as = "div",
}: {
  children: React.ReactNode;
  className?: string;
  delay?: number;
  duration?: number;
  y?: number;
  x?: number;
  margin?: string;
  as?: "div" | "section" | "li" | "span";
}) {
  const Tag = motion[as];
  return (
    <Tag
      data-motion
      className={className}
      initial={{ opacity: 0, y, x }}
      whileInView={{ opacity: 1, y: 0, x: 0 }}
      viewport={{ once: true, margin }}
      transition={{ duration, delay, ease: EASE_PRECISION }}
    >
      {children}
    </Tag>
  );
}

const groupVariants: Variants = {
  hidden: {},
  show: {},
};

/**
 * Staggered reveal group. Wrap direct children in <RevealItem>.
 * Stagger 0.07s, capped at 6 — later items arrive together.
 */
export function RevealGroup({
  children,
  className,
  stagger = 0.07,
  margin = "-80px",
  as = "div",
}: {
  children: React.ReactNode;
  className?: string;
  stagger?: number;
  margin?: string;
  as?: "div" | "ul" | "ol" | "section";
}) {
  const Tag = motion[as];
  return (
    <Tag
      data-motion
      className={className}
      initial="hidden"
      whileInView="show"
      viewport={{ once: true, margin }}
      variants={groupVariants}
      transition={{ staggerChildren: stagger }}
    >
      {children}
    </Tag>
  );
}

export function RevealItem({
  children,
  className,
  y = 24,
  x = 0,
  duration = 0.6,
  index = 0,
  stagger = 0.07,
  as = "div",
}: {
  children: React.ReactNode;
  className?: string;
  y?: number;
  x?: number;
  duration?: number;
  /** Item position — delay is min(index, 6) * stagger so long lists cap. */
  index?: number;
  stagger?: number;
  as?: "div" | "li" | "span" | "article";
}) {
  const Tag = motion[as];
  const delay = Math.min(index, 6) * stagger;
  return (
    <Tag
      data-motion
      className={cn(className)}
      variants={{
        hidden: { opacity: 0, y, x },
        show: {
          opacity: 1,
          y: 0,
          x: 0,
          transition: { duration, delay, ease: EASE_PRECISION },
        },
      }}
    >
      {children}
    </Tag>
  );
}
