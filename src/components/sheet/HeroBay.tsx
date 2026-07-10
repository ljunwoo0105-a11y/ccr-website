import Link from "next/link";
import { Star } from "lucide-react";
import { BUSINESS } from "@/lib/config";
import { Reveal, RevealGroup, RevealItem } from "@/components/motion/Reveal";
import { DeviceBayLoader } from "@/components/bay/loaders";
import { SHEET_COUNT } from "./sections";

/**
 * SHEET 00 — the teardown bay IS the landing view. A drawing-office title
 * page: stencil headline, then the interactive 3D rig where the visitor's
 * own device springs apart into its bill of materials.
 */
export default function HeroBay({
  rating,
  reviewCount,
}: {
  rating: number;
  reviewCount: number;
}) {
  return (
    <section id="bay" className="relative scroll-mt-24 border-b border-carbon-950">
      <div className="mnl-container">
        {/* Sheet rule */}
        <div className="flex items-center gap-4 border-b border-carbon-950 py-3">
          <span className="mnl-reg text-carbon-950" aria-hidden="true" />
          <span className="mnl-dim-lg mnl-num text-signal-600">SHEET 00</span>
          <span className="mnl-dim hidden text-carbon-500 sm:inline">
            Teardown bay · interactive
          </span>
          <span className="mnl-hatch ml-auto hidden h-3 w-24 sm:block" aria-hidden="true" />
          <span className="mnl-dim mnl-num text-carbon-500">
            00 / {String(SHEET_COUNT - 1).padStart(2, "0")}
          </span>
        </div>

        {/* Headline row */}
        <div className="grid gap-8 py-10 lg:grid-cols-12 lg:py-14">
          <RevealGroup className="lg:col-span-8">
            <RevealItem index={0}>
              <p className="mnl-dim-lg flex flex-wrap items-center gap-x-3 gap-y-1 text-carbon-500">
                <span className="inline-block h-2 w-2 bg-signal-500" aria-hidden="true" />
                WALK-IN REPAIR LAB · ORION SPRINGFIELD CENTRAL · OPEN 7 DAYS
              </p>
            </RevealItem>
            <RevealItem index={1}>
              <h1 className="mnl-display mt-6 text-[clamp(2.9rem,7.4vw,6.5rem)] text-carbon-950">
                Every fix
                <br />
                starts with
                <br />
                <span className="relative inline-block text-signal-500">
                  a teardown.
                  <span
                    className="mnl-hatch-signal absolute -bottom-2 left-0 h-2 w-full"
                    aria-hidden="true"
                  />
                </span>
              </h1>
            </RevealItem>
          </RevealGroup>

          <RevealGroup className="flex flex-col justify-end gap-6 lg:col-span-4">
            <RevealItem index={2}>
              <p className="max-w-sm text-base leading-relaxed text-carbon-700">
                Phones, tablets, laptops, watches and drones — opened, diagnosed
                and repaired at the kiosk, most jobs on the spot. Pull the
                caliper below and see exactly what we work on.
              </p>
            </RevealItem>
            <RevealItem index={3}>
              <div className="flex flex-wrap gap-3">
                <Link href="/quote" className="mnl-btn">
                  Get a free quote
                </Link>
                <a href={BUSINESS.phoneHref} className="mnl-btn-ghost">
                  {BUSINESS.phone}
                </a>
              </div>
            </RevealItem>
            <RevealItem index={4}>
              <a
                href={BUSINESS.googleMapsUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="group inline-flex items-baseline gap-2"
              >
                <span className="flex items-center gap-0.5" aria-hidden="true">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star key={i} className="h-3.5 w-3.5 fill-star text-star" />
                  ))}
                </span>
                <span className="mnl-dim mnl-num text-carbon-950">
                  {rating.toFixed(1)}
                </span>
                <span className="mnl-dim text-carbon-500 underline-offset-4 group-hover:underline">
                  {reviewCount.toLocaleString("en-AU")}+ GOOGLE REVIEWS
                </span>
              </a>
            </RevealItem>
          </RevealGroup>
        </div>
      </div>

      {/* The bay — full-bleed plate */}
      <Reveal y={32} className="border-t border-carbon-950">
        <DeviceBayLoader />
      </Reveal>

      {/* Title block — the engineering drawing signature */}
      <div className="border-t border-carbon-950 bg-bone-200">
        <div className="mnl-container grid grid-cols-2 divide-x divide-carbon-150 sm:grid-cols-4 lg:grid-cols-6">
          {[
            ["DRAWN BY", "CCR SERVICE DESK"],
            ["CHECKED", "QC · DUAL SIGN-OFF"],
            ["SCALE", "1:1 · UNITS MM"],
            ["MATERIAL", "GENUINE / OEM / AFTM"],
            ["WARRANTY", "UP TO 12 MONTHS"],
            ["LOCATION", "KIOSK K1 · QLD 4300"],
          ].map(([k, v], i) => (
            <div
              key={k}
              className={`px-3 py-2.5 ${i > 3 ? "hidden lg:block" : ""} ${
                i > 1 && i <= 3 ? "hidden sm:block" : ""
              }`}
            >
              <p className="mnl-dim text-[0.5625rem] text-carbon-500">{k}</p>
              <p className="mnl-dim mnl-num mt-0.5 text-carbon-950">{v}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
