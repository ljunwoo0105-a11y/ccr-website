import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { BUSINESS } from "@/lib/config";
import { CcrMark } from "@/components/brand/CcrMark";
import { RevealGroup, RevealItem } from "@/components/motion/Reveal";
import Parallax from "@/components/motion/Parallax";
import Scanline from "@/components/motion/Scanline";
import StarRow from "@/components/motion/StarRow";

/** Annotated-blueprint callouts around the mark: label, leader width, position. */
const ANNOTATIONS = [
  {
    label: "SAME-DAY",
    leader: "w-10",
    className: "left-[86%] top-[14%]",
    side: "right" as const,
  },
  {
    label: "12-MO WARRANTY",
    leader: "w-14",
    className: "right-[88%] top-[46%]",
    side: "left" as const,
  },
  {
    label: "CERTIFIED TECHS",
    leader: "w-12",
    className: "left-[82%] top-[76%]",
    side: "right" as const,
  },
];

export default function Hero({
  rating,
  reviewCount,
}: {
  rating: number;
  reviewCount: number;
}) {
  return (
    <section className="relative isolate flex min-h-[88vh] items-center overflow-hidden bg-ink-950 text-ink-50">
      {/* Technical grid, drifting almost imperceptibly */}
      <div
        aria-hidden="true"
        className="tech-grid animate-grid-drift absolute inset-0 opacity-50"
      />
      {/* The bench lamp: soft gold wash, top right */}
      <div
        aria-hidden="true"
        className="absolute -right-48 -top-48 h-[38rem] w-[38rem] rounded-full bg-gold-500/10 blur-3xl"
      />
      {/* Diagnostic scanline sweeps the section once on load */}
      <Scanline play delay={0.15} />

      <div className="site-container-wide relative py-24 md:py-28">
        <div className="grid gap-8 lg:grid-cols-12 lg:items-center">
          {/* Left: the pitch */}
          <Parallax to={-40} className="lg:col-span-7">
            <RevealGroup stagger={0.08}>
              <RevealItem index={0}>
                <div className="flex items-center gap-3">
                  <span
                    aria-hidden="true"
                    className="animate-status-pulse h-2 w-2 shrink-0 rounded-full bg-status-green"
                  />
                  <span className="sr-only">Open today</span>
                  <span className="mono-label text-ink-400">
                    OPEN TODAY · ORION SPRINGFIELD CENTRAL — KIOSK K1
                  </span>
                </div>
              </RevealItem>

              <RevealItem index={1}>
                <h1 className="type-display mt-6 text-[clamp(2.75rem,6vw,5.25rem)] text-ink-50">
                  Broken today.
                  <br />
                  <span className="text-gold-500">Fixed today.</span>
                </h1>
              </RevealItem>

              <RevealItem index={2}>
                <p className="mt-5 max-w-xl text-lg text-ink-300">
                  Springfield Central&apos;s top-rated phone, tablet, computer,
                  watch and drone repair — Price Beat Guarantee, parts warranty
                  up to 12 months, most repairs same-day.
                </p>
              </RevealItem>

              <RevealItem index={3}>
                <div className="mt-6">
                  <div className="inline-flex items-center gap-3 rounded-full border border-ink-700 bg-ink-900/60 px-4 py-2">
                    <StarRow rating={rating} size={14} />
                    <span className="font-mono text-sm text-ink-200">
                      {rating.toFixed(1)} ·{" "}
                      {reviewCount.toLocaleString("en-AU")}+ Google reviews
                    </span>
                  </div>
                </div>
              </RevealItem>

              <RevealItem index={4}>
                <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                  <Link href="/quote" className="btn-gold">
                    Get a free quote
                    <ArrowRight className="h-4 w-4" aria-hidden="true" />
                  </Link>
                  <a href={BUSINESS.phoneHref} className="btn-ghost-dark">
                    Call <span className="font-mono">{BUSINESS.phone}</span>
                  </a>
                </div>
              </RevealItem>
            </RevealGroup>
          </Parallax>

          {/* Right: the annotated blueprint mark */}
          <div className="lg:col-span-5">
            <p className="sr-only">
              Same-day repairs. Parts warranty up to 12 months. Certified
              technicians.
            </p>
            <div
              aria-hidden="true"
              className="hidden items-center justify-center lg:flex"
            >
              <div className="relative">
                <CcrMark
                  variant="blueprint"
                  className="w-[26rem] text-ink-700"
                />
                {ANNOTATIONS.map((a) => (
                  <div
                    key={a.label}
                    className={`absolute flex items-center gap-2 whitespace-nowrap ${a.className}`}
                  >
                    {a.side === "right" ? (
                      <>
                        <span className="font-mono text-sm leading-none text-gold-500/70">
                          +
                        </span>
                        <div className={`h-px bg-ink-700 ${a.leader}`} />
                        <span className="mono-label text-ink-500">
                          {a.label}
                        </span>
                      </>
                    ) : (
                      <>
                        <span className="mono-label text-ink-500">
                          {a.label}
                        </span>
                        <div className={`h-px bg-ink-700 ${a.leader}`} />
                        <span className="font-mono text-sm leading-none text-gold-500/70">
                          +
                        </span>
                      </>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
