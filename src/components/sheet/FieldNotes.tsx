import { HOME_FAQS } from "@/components/public/faq-data";
import Sheet from "./Sheet";

/**
 * SHEET 05 — the FAQ as numbered field notes. Native <details> accordion:
 * zero JS, keyboard accessible, styled like a troubleshooting index.
 */
export default function FieldNotes() {
  return (
    <Sheet no="05" footerNote="MORE QUESTIONS? CALL THE KIOSK — PLAIN ENGLISH, NO JARGON">
      <div className="grid gap-8 py-10 lg:grid-cols-12 lg:py-14">
        <div className="lg:col-span-4">
          <h2 className="mnl-display text-4xl text-carbon-950 sm:text-5xl">
            Field
            <br />
            notes<span className="text-signal-500">.</span>
          </h2>
          <p className="mt-5 max-w-sm text-sm leading-relaxed text-carbon-700">
            The questions every second customer asks at the counter, answered
            straight. Warranty terms, part tiers, timing, water damage — it&apos;s
            all here.
          </p>
        </div>

        <div className="lg:col-span-8">
          <ul className="divide-y divide-carbon-150 border-y border-carbon-950">
            {HOME_FAQS.map((faq, i) => (
              <li key={faq.question}>
                <details className="group">
                  <summary className="flex cursor-pointer list-none items-baseline gap-4 py-4 [&::-webkit-details-marker]:hidden">
                    <span className="mnl-dim mnl-num shrink-0 text-signal-600">
                      FN-{String(i + 1).padStart(2, "0")}
                    </span>
                    <span className="mnl-title flex-1 text-sm text-carbon-950 sm:text-base">
                      {faq.question}
                    </span>
                    <span
                      className="mnl-dim shrink-0 text-carbon-400 transition-transform duration-200 group-open:rotate-45 group-open:text-signal-600"
                      aria-hidden="true"
                    >
                      ＋
                    </span>
                  </summary>
                  <p className="max-w-2xl pb-5 pl-12 pr-4 text-sm leading-relaxed text-carbon-700">
                    {faq.answer}
                  </p>
                </details>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </Sheet>
  );
}
