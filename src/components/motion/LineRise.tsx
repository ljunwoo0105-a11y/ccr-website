"use client";

import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { EASE_PRECISION } from "./Reveal";

type Line = string | { text: string; className?: string };

/**
 * Masked line rise — display headlines arrive like print coming off the
 * press: each line rises from behind an overflow mask, staggered. Fires once
 * in view. Text stays real DOM text (SEO/a11y safe).
 */
export default function LineRise({
  as: Tag = "div",
  lines,
  className,
  id,
  stagger = 0.09,
  duration = 0.7,
  delay = 0,
}: {
  as?: "h1" | "h2" | "h3" | "p" | "div";
  lines: Line[];
  className?: string;
  id?: string;
  stagger?: number;
  duration?: number;
  delay?: number;
}) {
  return (
    <Tag id={id} className={className}>
      {lines.map((line, i) => {
        const item = typeof line === "string" ? { text: line } : line;
        return (
          <span key={i} className="block overflow-hidden pb-[0.08em] -mb-[0.08em]">
            <motion.span
              data-motion
              className={cn("block", item.className)}
              initial={{ y: "110%" }}
              whileInView={{ y: "0%" }}
              viewport={{ once: true, margin: "-80px" }}
              transition={{
                duration,
                delay: delay + i * stagger,
                ease: EASE_PRECISION,
              }}
            >
              {item.text}
            </motion.span>
          </span>
        );
      })}
    </Tag>
  );
}
