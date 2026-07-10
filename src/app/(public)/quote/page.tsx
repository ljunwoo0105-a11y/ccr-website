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

/**
 * Quote request — a Manifold intake form. The wizard itself renders as a
 * carbon "intake terminal" plate sitting on the drafting paper, like the
 * dark stamp plates used across the manual.
 */
export default function QuotePage() {
  return (
    <div className="relative">
      <div className="mnl-container py-4">
        <div className="flex items-center gap-4 border-b border-carbon-950 pb-3">
          <span className="mnl-reg text-carbon-950" aria-hidden="true" />
          <span className="mnl-dim-lg mnl-num text-signal-600">FORM Q-01</span>
          <span className="mnl-dim hidden text-carbon-500 sm:inline">
            Repair estimate request
          </span>
          <span className="mnl-hatch ml-auto hidden h-3 w-24 sm:block" aria-hidden="true" />
          <span className="mnl-dim mnl-num text-carbon-500">FREE · NO OBLIGATION</span>
        </div>
      </div>

      <div className="mnl-container relative pb-16 pt-8 sm:pb-20">
        <Reveal y={16}>
          <header className="mx-auto max-w-[640px] text-center">
            <h1 className="mnl-display text-[clamp(2.25rem,5vw,3.75rem)] text-carbon-950">
              Get your estimate<span className="text-signal-500">.</span>
            </h1>
            <p className="mt-4 text-base leading-relaxed text-carbon-700">
              A personalised repair estimate in your inbox in under a minute.
            </p>

            <ol
              aria-label="How it works"
              className="mt-8 flex flex-wrap items-center justify-center gap-x-6 gap-y-2"
            >
              {STEPS.map((label, i) => (
                <li
                  key={label}
                  className="mnl-dim flex items-center gap-2 text-carbon-500"
                >
                  <span className="mnl-num text-signal-600" aria-hidden="true">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  {label}
                </li>
              ))}
            </ol>
          </header>
        </Reveal>

        <div className="mx-auto mt-10 max-w-[640px]">
          {/* The wizard renders as a carbon intake terminal on the paper. */}
          <div className="border border-carbon-950 shadow-hard-xl">
            <QuoteWizard />
          </div>

          <p className="mt-6 text-center text-xs leading-relaxed text-carbon-500">
            We email a starting price using our most affordable part option —
            exact quote after a free in-store inspection. We never share your
            details —{" "}
            <Link href="/privacy" className="mnl-link text-carbon-950">
              privacy policy
            </Link>
            .
          </p>
        </div>
      </div>
    </div>
  );
}
