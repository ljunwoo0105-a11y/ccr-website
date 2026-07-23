import { cn } from "@/lib/utils";

/**
 * Dimension strip between sheets: a slow parts-ticker over a row of
 * measured spec plates. Pure CSS motion (the legacy marquee keyframes),
 * so it degrades to a static strip without JS.
 */
const TICKER = [
  "SCREENS",
  "BATTERIES",
  "CHARGE PORTS",
  "BACK GLASS",
  "WATER DAMAGE",
  "MICRO-SOLDERING",
  "DATA RECOVERY",
  "CAMERAS",
  "DRONE GIMBALS",
  "WATCH CRYSTALS",
  "CAR KEYS",
  "SSD UPGRADES",
];

export default function SpecStrip({
  rating,
  reviewCount,
}: {
  rating: number;
  reviewCount: number;
}) {
  const run = TICKER.map((t) => `${t} · `).join("");
  return (
    <div className="border-b border-carbon-950">
      {/* Ticker */}
      <div className="mnl-ticker overflow-hidden py-2.5" aria-hidden="true">
        <div className="flex w-max animate-marquee whitespace-nowrap font-mono text-[0.6875rem] font-semibold uppercase tracking-[0.22em] text-carbon-500 motion-reduce:animate-none">
          <span>
            {run}
            <span className="text-signal-600">PRICE BEAT GUARANTEE · </span>
            {run}
            <span className="text-signal-600">PRICE BEAT GUARANTEE · </span>
          </span>
        </div>
      </div>

      {/* Spec plates */}
      <dl className="mnl-container grid grid-cols-2 divide-carbon-150 border-t border-carbon-150 sm:grid-cols-4 sm:divide-x">
        {[
          {
            k: "GOOGLE RATING",
            v: rating.toFixed(1),
            unit: "/ 5.0",
          },
          {
            k: "VERIFIED REVIEWS",
            v: `${reviewCount.toLocaleString("en-AU")}`,
            unit: "+",
          },
          { k: "TYPICAL SCREEN JOB", v: "≤ 60", unit: "MIN" },
          { k: "PARTS WARRANTY", v: "≤ 12", unit: "MO" },
        ].map((s, i) => (
          <div
            key={s.k}
            // Pad only between columns: the row's outer edges stay flush with
            // the container so the strip aligns with the rest of the page grid
            // (2-col below sm, 4-col with dividers from sm up).
            className={cn(
              "py-5",
              i % 2 === 0 ? "pl-0 pr-4" : "pl-4 pr-0",
              i === 0 && "sm:pl-0 sm:pr-6",
              (i === 1 || i === 2) && "sm:pl-6 sm:pr-6",
              i === 3 && "sm:pl-6 sm:pr-0"
            )}
          >
            <dt className="mnl-dim text-carbon-500">{s.k}</dt>
            <dd className="mt-1.5 flex items-baseline gap-1.5">
              <span className="mnl-title mnl-num text-3xl text-carbon-950 sm:text-4xl">
                {s.v}
              </span>
              <span className="mnl-dim text-signal-600">{s.unit}</span>
            </dd>
          </div>
        ))}
      </dl>
    </div>
  );
}
