import Link from "next/link";
import { Phone } from "lucide-react";
import { BUSINESS } from "@/lib/config";
import { Reveal } from "@/components/motion/Reveal";
import Parallax from "@/components/motion/Parallax";

/** The gold inversion — the one section where the accent becomes the surface. */
export default function CtaBanner({
  heading = "Get it fixed today.",
  body = "Free quotes. Price Beat Guarantee. Most repairs same-day.",
}: {
  heading?: string;
  body?: string;
}) {
  return (
    <section
      className="relative overflow-hidden bg-gold-500 py-24"
      aria-labelledby="cta-heading"
    >
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 overflow-hidden"
      >
        <Parallax to={-20} className="absolute inset-x-0 -inset-y-6">
          <div className="tech-grid-gold h-full w-full" />
        </Parallax>
      </div>

      <div className="site-container relative text-center">
        <Reveal>
          <h2
            id="cta-heading"
            className="type-display text-[clamp(2.5rem,5vw,4rem)] text-ink-950"
          >
            {heading}
          </h2>
          <p className="mt-4 text-lg text-ink-950/70">{body}</p>
          <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row sm:gap-4">
            <Link href="/quote" className="btn-ink w-full sm:w-auto">
              Get a free quote
            </Link>
            <a
              href={BUSINESS.phoneHref}
              className="inline-flex w-full items-center justify-center gap-2 rounded-full border-2 border-ink-950 px-6 py-3.5 text-sm font-semibold text-ink-950 transition-colors hover:bg-ink-950 hover:text-gold-500 sm:w-auto"
            >
              <Phone size={16} aria-hidden="true" />
              <span className="sr-only">Call </span>
              <span className="tnum font-mono">{BUSINESS.phone}</span>
            </a>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
