import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { BUSINESS } from "@/lib/config";
import { CcrMark } from "@/components/brand/CcrMark";
import { RevealGroup, RevealItem } from "@/components/motion/Reveal";
import LineRise from "@/components/motion/LineRise";
import Parallax from "@/components/motion/Parallax";
import Scanline from "@/components/motion/Scanline";
import StarRow from "@/components/motion/StarRow";
import DiagReadout from "@/components/public/hero/DiagReadout";

/**
 * Pulse hero — centered electric composition. Drifting technical grid, two
 * static gradient orbs (volt top-left, violet bottom-right), a giant mark
 * watermark, the load scanline, and a floating glass HUD panel running the
 * bench diagnostics. No photos, no filters — gradients only, cheap to paint.
 */
export default function Hero({
  rating,
  reviewCount,
}: {
  rating: number;
  reviewCount: number;
}) {
  return (
    <section className="relative isolate flex min-h-[92vh] items-center overflow-hidden bg-ink-950 text-ink-50">
      {/* Technical grid, drifting almost imperceptibly */}
      <div
        aria-hidden="true"
        className="tech-grid animate-grid-drift absolute inset-0 opacity-60"
      />
      {/* Electric orbs — pure radial gradients, no blur filters */}
      <div
        aria-hidden="true"
        className="absolute -left-64 -top-64 h-[44rem] w-[44rem]"
        style={{
          background:
            "radial-gradient(circle, rgba(0,217,255,0.14) 0%, transparent 62%)",
        }}
      />
      <div
        aria-hidden="true"
        className="absolute -bottom-72 -right-56 h-[46rem] w-[46rem]"
        style={{
          background:
            "radial-gradient(circle, rgba(124,92,255,0.16) 0%, transparent 62%)",
        }}
      />
      {/* Giant mark watermark */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -right-44 top-1/2 hidden -translate-y-1/2 md:block"
      >
        <CcrMark variant="blueprint" className="w-[42rem] text-gold-500 opacity-[0.06]" />
      </div>
      {/* Diagnostic scanline sweeps the section once on load */}
      <Scanline play delay={0.15} />

      <div className="site-container-wide relative w-full py-24 md:py-28">
        <Parallax to={-40}>
          <RevealGroup
            stagger={0.08}
            className="mx-auto flex max-w-4xl flex-col items-center text-center"
          >
            <RevealItem index={0}>
              <div className="inline-flex items-center gap-3 rounded-md border border-ink-700 bg-ink-900/70 px-4 py-2 backdrop-blur-sm">
                <span
                  aria-hidden="true"
                  className="animate-status-pulse h-2 w-2 shrink-0 rounded-full bg-status-green"
                />
                <span className="sr-only">Open today</span>
                <span className="mono-label text-[0.6875rem] text-ink-300">
                  OPEN TODAY · ORION SPRINGFIELD CENTRAL — KIOSK K1
                </span>
              </div>
            </RevealItem>

            <RevealItem index={1} y={0}>
              <LineRise
                as="h1"
                className="type-display mt-8 text-[clamp(3rem,7.5vw,6.25rem)]"
                lines={[
                  { text: "Fixed while", className: "text-ink-50" },
                  { text: "you shop.", className: "text-gradient-pulse pb-1" },
                ]}
                stagger={0.12}
                delay={0.15}
              />
            </RevealItem>

            <RevealItem index={2}>
              <p className="mt-6 max-w-2xl text-lg text-ink-300">
                Springfield Central&apos;s top-rated phone, tablet, computer,
                watch and drone repair — Price Beat Guarantee, parts warranty
                up to 12 months, most repairs same-day.
              </p>
            </RevealItem>

            <RevealItem index={3}>
              <div className="mt-7 inline-flex items-center gap-3 rounded-md border border-ink-700 bg-ink-900/70 px-4 py-2 backdrop-blur-sm">
                <StarRow rating={rating} size={14} />
                <span className="tnum font-mono text-sm text-ink-200">
                  {rating.toFixed(1)} · {reviewCount.toLocaleString("en-AU")}+
                  Google reviews
                </span>
              </div>
            </RevealItem>

            <RevealItem index={4}>
              <div className="mt-9 flex flex-col gap-3 sm:flex-row">
                <Link href="/quote" className="btn-gold group">
                  Get a free quote
                  <ArrowRight
                    className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-1"
                    aria-hidden="true"
                  />
                </Link>
                <a href={BUSINESS.phoneHref} className="btn-ghost-dark">
                  Call <span className="tnum font-mono">{BUSINESS.phone}</span>
                </a>
              </div>
            </RevealItem>
          </RevealGroup>
        </Parallax>
      </div>

      {/* Floating HUD bench panel */}
      <div className="absolute bottom-8 right-8 hidden lg:block" aria-hidden="true">
        <div className="card-dark hud-corners w-72 p-5 text-gold-500">
          <div className="flex items-center justify-between">
            <span className="mono-label text-[0.625rem] text-ink-400">
              LIVE BENCH · K1
            </span>
            <span className="animate-status-pulse h-1.5 w-1.5 rounded-full bg-status-green" />
          </div>
          <DiagReadout className="mt-4" />
        </div>
      </div>
      <p className="sr-only">
        Same-day repairs. Parts warranty up to 12 months. Certified
        technicians. Diagnostics complete — same-day repairs available.
      </p>
    </section>
  );
}
