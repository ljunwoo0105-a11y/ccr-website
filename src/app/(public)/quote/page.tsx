import type { Metadata } from "next";
import Link from "next/link";
import { BUSINESS } from "@/lib/config";
import QuoteWizard from "@/components/quote/QuoteWizard";
import { Reveal } from "@/components/motion/Reveal";

export const metadata: Metadata = {
  title: "Get a Free Repair Quote",
  description: `Tell us about your device and ${BUSINESS.name} will email you a personalised repair estimate — then drop in to ${BUSINESS.address.line1}, Springfield Central for a free inspection and exact price.`,
};

const STEPS = ["Pick your device", "Leave your details", "Estimate emailed"];

export default function QuotePage() {
  return (
    <div className="relative bg-ink-950">
      <div
        className="pointer-events-none absolute inset-0 tech-grid"
        aria-hidden="true"
      />
      <div className="site-container relative py-16 sm:py-20">
        <Reveal y={16}>
          <header className="mx-auto max-w-[640px] text-center">
            <p className="eyebrow text-gold-500">
              Repair quote — free, no obligation
            </p>
            <h1 className="type-display mt-3 text-[clamp(2.25rem,5vw,3.75rem)] text-ink-50">
              Get your repair estimate.
            </h1>
            <p className="mt-4 text-base leading-relaxed text-ink-300">
              A personalised estimate in your inbox in under a minute.
            </p>

            <ol
              aria-label="How it works"
              className="mt-8 flex flex-wrap items-center justify-center gap-x-6 gap-y-2"
            >
              {STEPS.map((label, i) => (
                <li
                  key={label}
                  className="mono-label flex items-center gap-2 text-ink-400"
                >
                  <span className="tnum text-gold-500" aria-hidden="true">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  {label}
                </li>
              ))}
            </ol>
          </header>
        </Reveal>

        <div className="mx-auto mt-10 max-w-[640px]">
          <QuoteWizard />

          <p className="mt-6 text-center text-xs leading-relaxed text-ink-400">
            We email a starting price using our most affordable part option —
            exact quote after a free in-store inspection. We never share your
            details —{" "}
            <Link href="/privacy" className="link-gold">
              privacy policy
            </Link>
            .
          </p>
        </div>
      </div>
    </div>
  );
}
