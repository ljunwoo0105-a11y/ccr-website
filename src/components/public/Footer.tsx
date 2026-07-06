import Link from "next/link";
import { Star } from "lucide-react";
import { BUSINESS } from "@/lib/config";
import { CcrMark } from "@/components/brand/CcrMark";
import { SERVICES } from "@/components/public/services-data";

const COMPANY_LINKS = [
  { href: "/", label: "Home" },
  { href: "/services", label: "Services" },
  { href: "/reviews", label: "Reviews" },
  { href: "/quote", label: "Get a quote" },
  { href: "/warranty", label: "Warranty" },
  { href: "/privacy", label: "Privacy" },
  { href: "/terms", label: "Terms" },
  { href: "/staff/login", label: "Staff login" },
];

const linkClass = "text-sm text-ink-400 transition-colors hover:text-ink-100";

export default function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="relative overflow-hidden border-t border-ink-700 bg-ink-950">
      {/* Giant clipped watermark — pure furniture, no scroll animation. */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -bottom-[0.2em] left-0 right-0 select-none overflow-hidden text-[20vw] leading-none"
      >
        <span className="ccr-wordmark block text-ink-900">CCR</span>
      </div>

      <div className="site-container-wide relative">
        <div className="grid gap-10 py-16 md:grid-cols-2 lg:grid-cols-4">
          {/* Brand */}
          <div>
            <div className="flex items-center gap-2.5">
              <CcrMark className="w-9 text-ink-50" />
              <span className="ccr-wordmark text-2xl text-ink-50">CCR</span>
            </div>
            <p className="mt-4 text-sm leading-relaxed text-ink-400">
              Phone, tablet, computer, drone and watch repairs at Orion
              Springfield Central — most done same-day.
            </p>
            <p className="mt-4 flex items-center gap-2 font-mono text-xs text-ink-400">
              <Star
                size={13}
                className="fill-gold-500 text-gold-500"
                aria-hidden="true"
              />
              <span className="tnum">
                {BUSINESS.defaultRating.toFixed(1)} ·{" "}
                {BUSINESS.defaultReviewCount.toLocaleString("en-AU")}+ reviews
              </span>
            </p>
            <div className="mt-4 flex gap-3">
              <a
                href={BUSINESS.socials.facebook}
                target="_blank"
                rel="noopener noreferrer"
                className={linkClass}
              >
                Facebook
              </a>
              <span className="text-ink-600" aria-hidden="true">
                ·
              </span>
              <a
                href={BUSINESS.socials.instagram}
                target="_blank"
                rel="noopener noreferrer"
                className={linkClass}
              >
                Instagram
              </a>
            </div>
          </div>

          {/* Services */}
          <div>
            <h2 className="mono-label text-ink-500">Services</h2>
            <ul className="mt-4 space-y-2.5">
              {SERVICES.map((service) => (
                <li key={service.anchor}>
                  <Link
                    href={`/services#${service.anchor}`}
                    className={linkClass}
                  >
                    {service.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Company */}
          <div>
            <h2 className="mono-label text-ink-500">Company</h2>
            <ul className="mt-4 space-y-2.5">
              {COMPANY_LINKS.map((item) => (
                <li key={item.href}>
                  <Link href={item.href} className={linkClass}>
                    {item.label}
                  </Link>
                </li>
              ))}
              <li>
                <a
                  href={BUSINESS.googleReviewUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={linkClass}
                >
                  Review us on Google
                </a>
              </li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h2 className="mono-label text-ink-500">Contact</h2>
            <p className="mt-4">
              <a
                href={BUSINESS.phoneHref}
                className="tnum font-mono text-ink-200 transition-colors hover:text-gold-500"
              >
                {BUSINESS.phone}
              </a>
            </p>
            <p className="mt-2">
              <a href={`mailto:${BUSINESS.email}`} className={linkClass}>
                {BUSINESS.email}
              </a>
            </p>
            <address className="mt-3 space-y-1 not-italic text-sm text-ink-400">
              <p>{BUSINESS.address.line1}</p>
              <p>
                {BUSINESS.address.line2}, {BUSINESS.address.suburb}{" "}
                {BUSINESS.address.state} {BUSINESS.address.postcode}
              </p>
            </address>
            <p className="mt-3 text-sm text-ink-400">Open 7 days</p>
          </div>
        </div>

        <p className="max-w-3xl pb-8 text-xs leading-relaxed text-ink-500">
          Online quotes are estimates only and are confirmed with a free
          in-store inspection. Warranty periods vary by part quality — see our{" "}
          <Link
            href="/warranty"
            className="underline underline-offset-2 transition-colors hover:text-ink-300"
          >
            warranty policy
          </Link>{" "}
          for details.
        </p>

        <div className="mono-label flex flex-col justify-between gap-2 border-t border-ink-700 py-5 text-[0.6875rem] text-ink-500 sm:flex-row">
          <p>
            © {year} {BUSINESS.name}
          </p>
          <p>Orion Springfield Central, QLD</p>
        </div>
      </div>
    </footer>
  );
}
