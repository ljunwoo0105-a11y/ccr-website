import { Reveal } from "@/components/motion/Reveal";

/**
 * Spec-sheet masthead — the shared dark band that opens every inner page.
 * Server component; the once-only entrance is delegated to <Reveal>.
 * Body content below is expected to sit on bg-paper (the two-act rhythm).
 */
export default function PageMasthead({
  breadcrumb,
  title,
  lead,
  meta,
  children,
}: {
  /** Mono breadcrumb, e.g. "CCR / SERVICES". */
  breadcrumb: string;
  title: React.ReactNode;
  /** Optional lead paragraph under the H1. */
  lead?: React.ReactNode;
  /** Optional mono meta row, e.g. "PRICE BEAT GUARANTEE · SAME-DAY AVAILABLE". */
  meta?: React.ReactNode;
  /** Extra masthead content (CTAs, stats, anchor nav) — rendered inside the reveal. */
  children?: React.ReactNode;
}) {
  return (
    <section className="border-b border-ink-700 bg-ink-950 py-14 md:py-20">
      <div className="site-container">
        <Reveal y={16}>
          <p className="mono-label text-ink-500">{breadcrumb}</p>
          <h1 className="type-display mt-3 text-[clamp(2.25rem,5vw,3.75rem)] text-ink-50">
            {title}
          </h1>
          {lead && (
            <p className="mt-4 max-w-2xl text-base leading-relaxed text-ink-300">
              {lead}
            </p>
          )}
          {meta && <p className="mono-label mt-6 text-ink-500">{meta}</p>}
          {children}
        </Reveal>
      </div>
    </section>
  );
}
