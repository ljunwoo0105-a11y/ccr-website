import { HOME_FAQS } from "@/components/public/faq-data";
import { Reveal } from "@/components/motion/Reveal";
import FaqAccordion from "@/components/public/proof/FaqAccordion";

/**
 * Common questions — paper act. Plain-English answers from faq-data (also
 * mirrored into FAQPage JSON-LD by the page) in a one-open accordion.
 */
export default function FaqSection() {
  return (
    <section className="bg-paper py-24" aria-labelledby="faq-heading">
      <div className="site-container">
        <div className="mx-auto max-w-[720px]">
          <Reveal>
            <div className="flex items-center gap-4">
              <span className="eyebrow text-gold-700">
                04 — COMMON QUESTIONS
              </span>
              <div className="h-px flex-1 bg-line" aria-hidden="true" />
            </div>
            <h2 id="faq-heading" className="site-heading mt-6 text-ink-950">
              Common questions
            </h2>
          </Reveal>

          <Reveal className="mt-10" delay={0.1}>
            <FaqAccordion items={HOME_FAQS} />
          </Reveal>
        </div>
      </div>
    </section>
  );
}
