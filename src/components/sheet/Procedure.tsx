import { RevealGroup, RevealItem } from "@/components/motion/Reveal";
import Sheet from "./Sheet";

const STEPS = [
  {
    no: "01",
    title: "Check-in",
    time: "T+0 MIN",
    body: "Walk up to Kiosk K1 — no appointment. We log the fault, note your data and passcode preferences, and give you a firm price before touching a screw.",
  },
  {
    no: "02",
    title: "Teardown & diagnose",
    time: "T+10 MIN",
    body: "The device is opened on the bench and tested component by component, exactly like the rig on Sheet 00. You approve the findings before any part is ordered or fitted.",
  },
  {
    no: "03",
    title: "Repair",
    time: "SAME DAY*",
    body: "Parts are fitted in the quality tier you chose — genuine, OEM or aftermarket. Most screens and batteries are done while you do a lap of the centre.",
  },
  {
    no: "04",
    title: "QC & handback",
    time: "SIGNED OFF",
    body: "Every function is tested against a QC checklist — touch, cameras, mics, sensors, seal. You check it too, and the warranty for your part tier starts that day.",
  },
];

/**
 * SHEET 03 — the service procedure as a numbered timeline with a dashed
 * process rail, read like assembly steps in a manual.
 */
export default function Procedure() {
  return (
    <Sheet no="03" footerNote="*COMPLEX BOARD WORK & PART ORDERS QUOTED WITH A TIME FRAME AT CHECK-IN">
      <div className="py-10 lg:py-14">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <h2 className="mnl-display text-4xl text-carbon-950 sm:text-5xl">
            The procedure<span className="text-signal-500">.</span>
          </h2>
          <p className="mnl-dim max-w-xs text-carbon-500">
            FOUR STEPS · ONE VISIT · WARRANTY STAMPED AT HANDBACK
          </p>
        </div>

        <RevealGroup
          as="ol"
          className="relative mt-10 grid gap-6 md:grid-cols-2 xl:grid-cols-4"
          stagger={0.09}
        >
          {STEPS.map((step, i) => (
            <RevealItem key={step.no} as="li" index={i} y={24}>
              <div className="relative h-full">
                {/* process rail connector */}
                {i < STEPS.length - 1 ? (
                  <span
                    aria-hidden="true"
                    className="absolute -right-6 top-9 hidden w-6 border-t border-dashed border-carbon-200 xl:block"
                  />
                ) : null}
                <article className="mnl-plate-flat flex h-full flex-col p-5">
                  <header className="flex items-baseline justify-between border-b border-carbon-150 pb-3">
                    <span className="mnl-display text-3xl text-signal-500">
                      {step.no}
                    </span>
                    <span className="mnl-dim mnl-num text-carbon-500">
                      {step.time}
                    </span>
                  </header>
                  <h3 className="mnl-title mt-4 text-base text-carbon-950">
                    {step.title}
                  </h3>
                  <p className="mt-2.5 text-xs leading-relaxed text-carbon-500">
                    {step.body}
                  </p>
                </article>
              </div>
            </RevealItem>
          ))}
        </RevealGroup>
      </div>
    </Sheet>
  );
}
