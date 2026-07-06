import Link from "next/link";
import { ArrowRight, Star } from "lucide-react";
import { BUSINESS } from "@/lib/config";
import { CcrMark } from "@/components/brand/CcrMark";
import HeaderShell from "@/components/public/chrome/HeaderShell";
import MobileNav from "@/components/public/MobileNav";

const NAV_LINKS = [
  { href: "/", label: "Home" },
  { href: "/services", label: "Services" },
  { href: "/#about", label: "Why Choose Us" },
  { href: "/reviews", label: "Reviews" },
  { href: "/#contact", label: "Contact" },
];

/**
 * Dark-act chrome: a mono utility strip (rating · kiosk locator · phone)
 * over a 64px main bar. Server component — scroll condensing lives in the
 * HeaderShell client leaf.
 */
export default function Header() {
  return (
    <HeaderShell
      utility={
        <div className="border-b border-ink-700 bg-ink-900">
          <div className="site-container-wide flex h-9 items-center justify-between gap-4 font-mono text-[0.6875rem] sm:text-xs">
            <span className="inline-flex items-center gap-2 text-ink-200">
              <Star
                className="h-3 w-3 fill-gold-500 text-gold-500"
                aria-hidden="true"
              />
              <span className="tnum">
                {BUSINESS.defaultRating.toFixed(1)} ·{" "}
                {BUSINESS.defaultReviewCount.toLocaleString("en-AU")}+ Google
                reviews
              </span>
            </span>

            <span className="hidden tracking-[0.14em] text-ink-400 lg:block">
              ORION SPRINGFIELD CENTRAL · KIOSK K1 · NEAR FOOT LOCKER
            </span>

            <a
              href={BUSINESS.phoneHref}
              className="tnum rounded text-ink-200 transition-colors duration-200 hover:text-gold-500 focus:outline-none focus-visible:ring-2 focus-visible:ring-gold-500"
            >
              {BUSINESS.phone}
            </a>
          </div>
        </div>
      }
    >
      <div className="site-container-wide flex h-16 items-center justify-between gap-4">
        <Link
          href="/"
          className="inline-flex items-center gap-2 rounded focus:outline-none focus-visible:ring-2 focus-visible:ring-gold-500"
          aria-label={`${BUSINESS.name} home`}
        >
          <CcrMark className="h-8 w-8 text-ink-50" />
          <span className="ccr-wordmark text-2xl leading-none text-ink-50">
            CCR
          </span>
        </Link>

        <nav className="hidden items-center gap-7 lg:flex" aria-label="Main">
          {NAV_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="mono-label relative rounded text-[0.75rem] text-ink-300 transition-colors duration-200 after:absolute after:inset-x-0 after:-bottom-1 after:h-px after:origin-left after:scale-x-0 after:bg-gold-500 after:transition-transform after:duration-200 hover:text-ink-100 hover:after:scale-x-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-gold-500"
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-4">
          <Link
            href="/staff/login"
            aria-label="Staff Login"
            className="mono-label rounded text-[0.6875rem] text-ink-400 transition-colors duration-200 hover:text-ink-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-gold-500"
          >
            Staff
          </Link>
          <Link
            href="/quote"
            className="btn-gold btn-sm group hidden md:inline-flex"
          >
            Get a free quote
            <ArrowRight
              className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-1"
              aria-hidden="true"
            />
          </Link>
          <MobileNav />
        </div>
      </div>
    </HeaderShell>
  );
}
