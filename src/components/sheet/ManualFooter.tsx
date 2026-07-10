import Link from "next/link";
import { BUSINESS } from "@/lib/config";
import { SERVICES } from "@/components/public/services-data";
import { SECTIONS } from "./sections";

/**
 * The manual's back cover — a carbon ink stamp. Giant outline wordmark,
 * mono columns, revision strip along the bottom edge.
 */
export default function ManualFooter() {
  const year = new Date().getFullYear();
  return (
    <footer className="mnl-stamp relative overflow-hidden">
      {/* Outline wordmark backdrop */}
      <div
        aria-hidden="true"
        className="mnl-outline pointer-events-none select-none whitespace-nowrap px-4 pt-10 font-display text-[clamp(3.2rem,10.5vw,9rem)] uppercase leading-none text-transparent"
      >
        COOL CASE REPAIR
      </div>

      <div className="mnl-container grid gap-10 py-12 md:grid-cols-2 lg:grid-cols-4">
        <div>
          <span className="flex h-11 w-14 items-center justify-center bg-bone-100 font-display text-lg leading-none text-carbon-950 shadow-hard-signal">
            CCR
          </span>
          <p className="mt-4 max-w-xs text-sm leading-relaxed text-bone-100/70">
            {BUSINESS.tagline}. Walk-in kiosk — most repairs done on the spot
            while you shop.
          </p>
          <div className="mt-5 flex gap-4">
            <a
              href={BUSINESS.socials.facebook}
              target="_blank"
              rel="noopener noreferrer"
              className="mnl-dim text-bone-100/70 underline decoration-bone-100/30 underline-offset-4 transition-colors hover:text-signal-400"
            >
              Facebook
            </a>
            <a
              href={BUSINESS.socials.instagram}
              target="_blank"
              rel="noopener noreferrer"
              className="mnl-dim text-bone-100/70 underline decoration-bone-100/30 underline-offset-4 transition-colors hover:text-signal-400"
            >
              Instagram
            </a>
          </div>
        </div>

        <nav aria-label="Manual index">
          <h2 className="mnl-dim-lg text-signal-400">Index</h2>
          <ul className="mt-4 space-y-2.5">
            {SECTIONS.map((s) => (
              <li key={s.id}>
                <a
                  href={`/#${s.id}`}
                  className="mnl-dim flex items-baseline gap-2 text-bone-100/70 transition-colors hover:text-bone-100"
                >
                  <span className="mnl-num text-signal-400/70">{s.no}</span>
                  {s.title}
                </a>
              </li>
            ))}
            <li>
              <Link
                href="/quote"
                className="mnl-dim flex items-baseline gap-2 text-bone-100/70 transition-colors hover:text-bone-100"
              >
                <span className="mnl-num text-signal-400/70">▸</span>
                Free quote
              </Link>
            </li>
          </ul>
        </nav>

        <nav aria-label="Services">
          <h2 className="mnl-dim-lg text-signal-400">Work orders</h2>
          <ul className="mt-4 space-y-2.5">
            {SERVICES.map((svc) => (
              <li key={svc.anchor}>
                <a
                  href="/#services"
                  className="mnl-dim block text-bone-100/70 transition-colors hover:text-bone-100"
                >
                  {svc.name}
                </a>
              </li>
            ))}
          </ul>
        </nav>

        <div>
          <h2 className="mnl-dim-lg text-signal-400">The depot</h2>
          <address className="mt-4 space-y-2.5 not-italic">
            <p className="mnl-dim leading-relaxed text-bone-100/70">
              {BUSINESS.address.line1}
              <br />
              {BUSINESS.address.line2}, {BUSINESS.address.suburb}
              <br />
              {BUSINESS.address.state} {BUSINESS.address.postcode}
            </p>
            <p>
              <a
                href={BUSINESS.phoneHref}
                className="mnl-dim mnl-num text-bone-100/70 transition-colors hover:text-bone-100"
              >
                {BUSINESS.phone}
              </a>
            </p>
            <p>
              <a
                href={`mailto:${BUSINESS.email}`}
                className="mnl-dim break-all text-bone-100/70 transition-colors hover:text-bone-100"
              >
                {BUSINESS.email}
              </a>
            </p>
          </address>
        </div>
      </div>

      {/* Revision strip */}
      <div className="border-t border-bone-100/15">
        <div className="mnl-container flex flex-wrap items-center justify-between gap-3 py-4">
          <span className="mnl-dim text-bone-100/70">
            © {year} {BUSINESS.legalName} · ABN on request
          </span>
          <span className="flex items-center gap-4">
            <Link
              href="/privacy"
              className="mnl-dim text-bone-100/70 transition-colors hover:text-bone-100"
            >
              Privacy
            </Link>
            <Link
              href="/terms"
              className="mnl-dim text-bone-100/70 transition-colors hover:text-bone-100"
            >
              Terms
            </Link>
            <Link
              href="/staff/login"
              className="mnl-dim text-bone-100/70 transition-colors hover:text-bone-100"
            >
              Staff
            </Link>
          </span>
          <span className="mnl-dim mnl-num flex items-center gap-3 text-bone-100/70">
            <span className="mnl-reg" aria-hidden="true" />
            DOC CCR-4300 · REV 2026.07
          </span>
        </div>
      </div>
    </footer>
  );
}
