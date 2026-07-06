"use client";

import { useId, useState } from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import Collapse from "@/components/motion/Collapse";
import type { FaqItem } from "@/components/public/schema";

/**
 * One-open-at-a-time accordion in the "test log" register: mono Q-indices
 * that turn gold when open, a 2px gold rule down the open item, and a
 * Collapse-animated answer. First question open by default.
 */
export default function FaqAccordion({ items }: { items: FaqItem[] }) {
  const [openIndex, setOpenIndex] = useState<number | null>(0);
  const baseId = useId();

  return (
    <div className="border-b border-line">
      {items.map((item, index) => {
        const open = openIndex === index;
        const buttonId = `${baseId}-faq-button-${index}`;
        const panelId = `${baseId}-faq-panel-${index}`;

        return (
          <div
            key={item.question}
            className={cn(
              "-ml-4 border-l-2 border-t border-t-line pl-4 transition-colors duration-200",
              open
                ? "border-l-gold-600 bg-stone/50"
                : "border-l-transparent"
            )}
          >
            <h3>
              <button
                id={buttonId}
                type="button"
                aria-expanded={open}
                aria-controls={panelId}
                onClick={() => setOpenIndex(open ? null : index)}
                className="flex min-h-[44px] w-full items-center gap-4 rounded-sm py-5 text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-gold-600"
              >
                <span
                  aria-hidden="true"
                  className={cn(
                    "mono-label tnum shrink-0 transition-colors duration-200",
                    open ? "text-gold-700" : "text-ink-500"
                  )}
                >
                  Q{index + 1}
                </span>
                <span className="flex-1 text-sm font-medium text-ink-950 sm:text-base">
                  {item.question}
                </span>
                <ChevronDown
                  size={18}
                  aria-hidden="true"
                  className={cn(
                    "shrink-0 text-ink-500 transition-transform duration-[250ms]",
                    open && "rotate-180"
                  )}
                />
              </button>
            </h3>
            <div id={panelId} role="region" aria-labelledby={buttonId}>
              <Collapse open={open}>
                <p className="max-w-[65ch] pb-6 text-sm leading-relaxed text-ink-600">
                  {item.answer}
                </p>
              </Collapse>
            </div>
          </div>
        );
      })}
    </div>
  );
}
