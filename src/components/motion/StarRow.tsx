"use client";

import { motion } from "framer-motion";
import { Star } from "lucide-react";
import { cn } from "@/lib/utils";
import { EASE_PRECISION } from "./Reveal";

/**
 * Five gold stars filling sequentially (80ms stagger) once in view.
 * Decorative stars are aria-hidden; a sr-only sentence carries the rating.
 */
export default function StarRow({
  rating,
  size = 16,
  className,
  label,
}: {
  rating: number;
  size?: number;
  className?: string;
  /** Accessible text, e.g. "Rated 4.9 out of 5". Defaults from rating. */
  label?: string;
}) {
  return (
    <span className={cn("inline-flex items-center gap-1", className)}>
      <span className="sr-only">
        {label ?? `Rated ${rating.toFixed(1)} out of 5`}
      </span>
      {Array.from({ length: 5 }, (_, i) => (
        <motion.span
          key={i}
          aria-hidden="true"
          data-motion
          className="inline-flex"
          initial={{ opacity: 0, scale: 0.5 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true, margin: "-40px" }}
          transition={{
            duration: 0.35,
            delay: i * 0.08,
            ease: EASE_PRECISION,
          }}
        >
          <Star
            width={size}
            height={size}
            className="fill-gold-500 text-gold-500"
          />
        </motion.span>
      ))}
    </span>
  );
}
