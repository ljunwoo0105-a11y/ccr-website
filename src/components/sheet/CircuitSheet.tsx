import { Reveal } from "@/components/motion/Reveal";
import { SchematicBoardLoader } from "@/components/bay/loaders";
import Sheet from "./Sheet";

/**
 * SHEET 02 — board-level service. The animated 3D schematic makes the
 * point words can't: we don't stop at swapping parts, we work the board.
 */
export default function CircuitSheet() {
  return (
    <Sheet
      no="02"
      tone="recessed"
      footerNote="NO FIX, NO FEE ON BOARD-LEVEL ASSESSMENTS"
    >
      <div className="grid gap-8 py-10 lg:grid-cols-12 lg:py-14">
        <div className="lg:col-span-4">
          <h2 className="mnl-display text-4xl text-carbon-950 sm:text-5xl">
            Down to
            <br />
            the board<span className="text-signal-500">.</span>
          </h2>
          <p className="mt-5 max-w-sm text-sm leading-relaxed text-carbon-700">
            When a repair goes deeper than a module swap, it lands on the
            micro-soldering bench: hot air, microscope, and a steady hand on
            nets a fraction of a millimetre wide. This is how dead phones — and
            the photos on them — come back.
          </p>
          <dl className="mt-7 space-y-3">
            {[
              ["IC & CONNECTOR REWORK", "CHARGING · AUDIO · TOUCH"],
              ["WATER DAMAGE TRIAGE", "ULTRASONIC CLEAN + INSPECT"],
              ["DATA RECOVERY", "FROM DEAD BOARDS"],
              ["DIAGNOSTIC FEE", "FREE WITH ANY REPAIR"],
            ].map(([k, v]) => (
              <div key={k} className="mnl-dimrow">
                <dt className="mnl-dim text-carbon-950">{k}</dt>
                <dd className="mnl-dim text-signal-600">{v}</dd>
              </div>
            ))}
          </dl>
        </div>

        <Reveal y={28} className="lg:col-span-8">
          <div className="mnl-plate-flat overflow-hidden">
            <SchematicBoardLoader />
          </div>
        </Reveal>
      </div>
    </Sheet>
  );
}
