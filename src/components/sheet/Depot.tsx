import Link from "next/link";
import { MapPin, Phone, Mail, Clock } from "lucide-react";
import { BUSINESS } from "@/lib/config";
import { Reveal } from "@/components/motion/Reveal";
import Sheet from "./Sheet";

/**
 * SHEET 06 — the depot. Where the bench actually is, when it runs, and the
 * final signal-orange call to action stamped across the closing plate.
 */
export default function Depot() {
  return (
    <Sheet no="06" footerNote="END OF MANUAL — REV 2026.07 · KEEP FOR YOUR RECORDS">
      <div className="grid gap-6 py-10 lg:grid-cols-12 lg:py-14">
        {/* Location plate */}
        <div className="mnl-plate-flat p-6 lg:col-span-4">
          <h2 className="mnl-dim-lg flex items-center gap-2 text-signal-600">
            <MapPin className="h-4 w-4" aria-hidden="true" />
            The depot
          </h2>
          <address className="mt-4 not-italic">
            <p className="mnl-title text-lg text-carbon-950">
              {BUSINESS.address.line1}
            </p>
            <p className="mt-2 text-sm leading-relaxed text-carbon-700">
              {BUSINESS.address.line2}, {BUSINESS.address.suburb}{" "}
              {BUSINESS.address.state} {BUSINESS.address.postcode}
              <br />
              <span className="text-carbon-500">{BUSINESS.address.landmark}</span>
            </p>
          </address>
          <div className="mt-5 space-y-2.5 border-t border-carbon-150 pt-4">
            <a
              href={BUSINESS.phoneHref}
              className="mnl-dim mnl-num flex items-center gap-2 text-carbon-950 transition-colors hover:text-signal-600"
            >
              <Phone className="h-3.5 w-3.5" aria-hidden="true" />
              {BUSINESS.phone}
            </a>
            <a
              href={`mailto:${BUSINESS.email}`}
              className="mnl-dim flex items-center gap-2 break-all text-carbon-950 transition-colors hover:text-signal-600"
            >
              <Mail className="h-3.5 w-3.5" aria-hidden="true" />
              {BUSINESS.email}
            </a>
          </div>
          <a
            href={BUSINESS.googleMapsUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="mnl-btn-ghost mnl-btn-sm mt-6 w-full"
          >
            Open in Google Maps →
          </a>
        </div>

        {/* Hours plate */}
        <div className="mnl-plate-flat p-6 lg:col-span-4">
          <h2 className="mnl-dim-lg flex items-center gap-2 text-signal-600">
            <Clock className="h-4 w-4" aria-hidden="true" />
            Bench hours
          </h2>
          <dl className="mt-4 space-y-3">
            {BUSINESS.hours.map((h) => (
              <div key={h.days} className="mnl-dimrow">
                <dt className="mnl-dim text-carbon-950">{h.days}</dt>
                <dd className="mnl-dim mnl-num text-carbon-700">
                  {h.open} – {h.close}
                </dd>
              </div>
            ))}
          </dl>
          <p className="mt-5 border-t border-carbon-150 pt-4 text-xs leading-relaxed text-carbon-500">
            Kiosk hours follow Orion Springfield Central centre trading. Open
            seven days — including the Thursday late-night run.
          </p>
        </div>

        {/* CTA stamp */}
        <Reveal y={24} className="lg:col-span-4">
          <div className="mnl-stamp relative flex h-full flex-col justify-between overflow-hidden p-6">
            <div
              className="mnl-hatch-signal absolute inset-x-0 top-0 h-2"
              aria-hidden="true"
            />
            <div>
              <p className="mnl-dim text-signal-400">FINAL INSTRUCTION</p>
              <p className="mnl-display mt-3 text-4xl text-bone-100 sm:text-5xl">
                Bring it in broken<span className="text-signal-400">.</span>
              </p>
              <p className="mt-4 max-w-xs text-sm leading-relaxed text-bone-100/70">
                Free quote first if you want the number up front — or walk
                straight up to the kiosk and watch the teardown happen.
              </p>
            </div>
            <div className="mt-8 flex flex-col gap-3">
              <Link href="/quote" className="mnl-btn w-full">
                Get a free quote
              </Link>
              <a href={BUSINESS.phoneHref} className="mnl-btn-bone w-full">
                Call {BUSINESS.phone}
              </a>
            </div>
          </div>
        </Reveal>
      </div>
    </Sheet>
  );
}
