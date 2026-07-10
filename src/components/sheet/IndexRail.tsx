"use client";

import { useEffect, useState } from "react";
import { SECTIONS } from "./sections";

/**
 * Fixed drafting rail down the left page edge (xl+ screens): sheet numbers
 * with a scrollspy highlight, like thumb tabs on a service binder.
 */
export default function IndexRail() {
  const [active, setActive] = useState("bay");

  useEffect(() => {
    if (typeof IntersectionObserver === "undefined") return;
    const io = new IntersectionObserver(
      (entries) => {
        // A far jump can toggle several sections in one batch; batch order is
        // not guaranteed to be document order, so pick the topmost intersecting
        // section rather than whichever entry happens to be last in the array.
        const visible = entries.filter((e) => e.isIntersecting);
        if (visible.length === 0) return;
        const topmost = visible.reduce((a, b) =>
          a.boundingClientRect.top <= b.boundingClientRect.top ? a : b,
        );
        setActive(topmost.target.id);
      },
      { rootMargin: "-38% 0px -55% 0px" },
    );
    for (const s of SECTIONS) {
      const el = document.getElementById(s.id);
      if (el) io.observe(el);
    }
    return () => io.disconnect();
  }, []);

  return (
    <nav
      aria-label="Sheet index"
      className="fixed left-3 top-1/2 z-40 hidden -translate-y-1/2 xl:block"
    >
      <ul className="flex flex-col gap-1 border-l border-carbon-200 pl-3">
        {SECTIONS.map((s) => {
          const isActive = active === s.id;
          return (
            <li key={s.id}>
              <a
                href={`#${s.id}`}
                className={`group flex items-center gap-2 py-1 transition-colors ${
                  isActive ? "text-signal-600" : "text-carbon-500 hover:text-carbon-950"
                }`}
                aria-current={isActive ? "true" : undefined}
              >
                <span
                  className={`h-px transition-all duration-200 ${
                    isActive ? "w-5 bg-signal-500" : "w-2.5 bg-carbon-200 group-hover:w-4"
                  }`}
                  aria-hidden="true"
                />
                <span className="mnl-dim mnl-num">{s.no}</span>
                <span
                  className={`mnl-dim overflow-hidden whitespace-nowrap bg-bone-100/90 transition-all duration-200 ${
                    isActive ? "max-w-[10rem] px-1 opacity-100" : "max-w-0 opacity-0"
                  }`}
                >
                  {s.title}
                </span>
              </a>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
