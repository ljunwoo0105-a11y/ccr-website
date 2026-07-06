"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { EASE_INOUT } from "@/components/motion/Reveal";
import { cn } from "@/lib/utils";

/**
 * Client leaf for the sticky header chrome. At the top of the page the
 * header sits transparent over the dark hero; after ~24px of scroll it
 * condenses — gaining an ink-900/85 blurred backdrop and collapsing the
 * utility strip (height + opacity, 300ms, EASE_INOUT). Server-rendered
 * strip/bar content is passed in as children, keeping this leaf small.
 */
export default function HeaderShell({
  utility,
  children,
}: {
  utility: React.ReactNode;
  children: React.ReactNode;
}) {
  const [condensed, setCondensed] = useState(false);

  useEffect(() => {
    const onScroll = () => setCondensed(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className={cn(
        "sticky top-0 z-50 border-b transition-colors duration-300",
        condensed
          ? "border-ink-700 bg-ink-900/85 backdrop-blur-md"
          : "border-transparent bg-transparent",
      )}
    >
      <motion.div
        initial={false}
        animate={
          condensed
            ? {
                height: 0,
                opacity: 0,
                transitionEnd: { visibility: "hidden" },
              }
            : { height: "auto", opacity: 1, visibility: "visible" }
        }
        transition={{ duration: 0.3, ease: EASE_INOUT }}
        className="overflow-hidden"
        aria-hidden={condensed ? true : undefined}
      >
        {utility}
      </motion.div>
      {children}
    </header>
  );
}
