import { HOME_FAQS } from "@/components/public/faq-data";
import { Reveal } from "@/components/motion/Reveal";
import LineRise from "@/components/motion/LineRise";
import FaqAccordion from "@/components/public/proof/FaqAccordion";

/**
 * Common questions — dark act, ink-900 band. Plain-English answers from
 * faq-data (also mirrored into FAQPage JSON-LD by the page) in a one-open
 * accordion styled as a test log.
 */
export default function FaqSection() {
  return (
    <section
      className="border-y border-ink-700 bg-ink-900 py-24"
      aria-labelledby="faq-heading"
    >
      <div className="site-container">
        <div className="mx-auto max-w-[720px]">
          <Reveal>
            <div className="flex items-center gap-4">
              <span className="eyebrow text-gold-500">
                04 — COMMON QUESTIONS
              </span>
              <div className="h-px flex-1 bg-ink-700" aria-hidden="true" />
            </div>
            <LineRise
              as="h2"
              id="faq-heading"
              className="site-heading mt-6 text-ink-50"
              lines={["Straight answers."]}
            />
          </Reveal>

          <Reveal className="mt-10" delay={0.1}>
            <FaqAccordion items={HOME_FAQS} />
          </Reveal>
        </div>
      </div>
    </section>
  );
}
