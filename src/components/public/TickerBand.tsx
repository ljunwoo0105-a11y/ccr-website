const PROMISES = [
  "Same-day repairs",
  "Price Beat Guarantee",
  "12-month warranty",
  "Certified technicians",
  "Walk-ins welcome",
];

/**
 * The volt ticker — the site's chromatic heartbeat and its third (and last)
 * sanctioned continuous animation. An electric strip: cyan promises with
 * violet markers streaming over glass between hairlines. Pure CSS marquee:
 * pauses on hover and keyboard focus, collapses to a static line under
 * prefers-reduced-motion, costs zero JavaScript. Server component.
 */
export default function TickerBand() {
  return (
    <div className="group relative overflow-hidden border-y border-gold-500/30 bg-ink-900/80">
      <span className="sr-only">
        Same-day repairs. Price Beat Guarantee. 12-month warranty. Certified
        technicians. Walk-ins welcome.
      </span>

      {/* Moving track (two identical halves = seamless -50% loop) */}
      <div
        aria-hidden="true"
        tabIndex={-1}
        className="flex h-12 w-max items-center animate-marquee group-hover:[animation-play-state:paused] focus-within:[animation-play-state:paused] motion-reduce:hidden md:h-14"
      >
        {[0, 1].map((half) => (
          <div key={half} className="flex shrink-0 items-center">
            {PROMISES.map((promise) => (
              <span key={promise} className="flex items-center">
                <span className="whitespace-nowrap px-6 font-display text-sm font-bold uppercase tracking-wider text-gold-500 md:px-8 md:text-base">
                  {promise}
                </span>
                <span className="text-xs leading-none text-pulse-500">◆</span>
              </span>
            ))}
          </div>
        ))}
      </div>

      {/* Static fallback under prefers-reduced-motion */}
      <p
        aria-hidden="true"
        className="hidden px-5 py-3 text-center font-display text-sm font-bold uppercase tracking-wider text-gold-500 motion-reduce:block"
      >
        {PROMISES.join(" · ")}
      </p>
    </div>
  );
}
