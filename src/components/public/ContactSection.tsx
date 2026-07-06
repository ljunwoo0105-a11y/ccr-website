import Link from "next/link";
import { ExternalLink } from "lucide-react";
import { BUSINESS } from "@/lib/config";
import { Reveal } from "@/components/motion/Reveal";
import HoursTable from "@/components/public/HoursTable";

export default function ContactSection() {
  return (
    <section
      id="contact"
      className="scroll-mt-20 border-t border-ink-700 bg-ink-950 py-24"
      aria-labelledby="contact-heading"
    >
      <div className="site-container">
        <Reveal className="flex items-center gap-4">
          <span className="eyebrow text-gold-500">05 — Find the kiosk</span>
          <div className="h-px flex-1 bg-ink-700" aria-hidden="true" />
        </Reveal>

        <div className="mt-12 grid gap-12 lg:grid-cols-2">
          <Reveal>
            <h2 id="contact-heading" className="site-heading text-ink-50">
              Kiosk K1, near Foot Locker.
            </h2>
            <p className="mt-4 max-w-md text-ink-300">
              Walk in seven days a week — no appointment needed.
            </p>

            <address className="mt-6 space-y-1 not-italic text-ink-200">
              <p>{BUSINESS.address.line1}</p>
              <p>
                {BUSINESS.address.line2}, {BUSINESS.address.suburb}{" "}
                {BUSINESS.address.state} {BUSINESS.address.postcode}
              </p>
              <p className="text-ink-400">{BUSINESS.address.landmark}</p>
            </address>

            <p className="mono-label tnum mt-6 text-ink-500">
              {BUSINESS.geo.lat.toFixed(4)} · {BUSINESS.geo.lng.toFixed(4)} ·
              Orion Springfield Central
            </p>

            <div className="mt-10">
              <p className="mono-label text-ink-400">Call or text</p>
              <a
                href={BUSINESS.phoneHref}
                className="tnum mt-1 inline-block font-mono text-[clamp(1.5rem,3vw,2.25rem)] font-medium text-gold-500 transition-colors hover:text-gold-300"
              >
                {BUSINESS.phone}
              </a>
              <p className="mt-2 text-sm">
                <a
                  href={`mailto:${BUSINESS.email}`}
                  className="text-ink-400 transition-colors hover:text-ink-100"
                >
                  {BUSINESS.email}
                </a>
              </p>
            </div>

            <div className="mt-10 flex flex-col gap-3 sm:flex-row">
              <Link href="/quote" className="btn-gold">
                Get a free quote
              </Link>
              <a
                href={BUSINESS.googleMapsUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="btn-ghost-dark"
              >
                Open in Google Maps
                <ExternalLink size={16} aria-hidden="true" />
              </a>
            </div>
          </Reveal>

          <Reveal delay={0.1}>
            <HoursTable />
          </Reveal>
        </div>
      </div>
    </section>
  );
}
