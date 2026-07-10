"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, Phone, X } from "lucide-react";
import { BUSINESS } from "@/lib/config";
import { SECTIONS } from "./sections";
import ThemeToggle from "./ThemeToggle";

/**
 * Manifold chrome — the manual's cover strip. A carbon doc-strip up top,
 * then a bone toolbar: stamped CCR mark, numbered section nav, signal CTA.
 */
export default function ManualHeader() {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const onHome = pathname === "/";

  // Lock scroll while the mobile index is open.
  useEffect(() => {
    document.documentElement.style.overflow = open ? "hidden" : "";
    return () => {
      document.documentElement.style.overflow = "";
    };
  }, [open]);

  // The toggle and the overlay are both lg:hidden, so at >=lg they vanish via
  // CSS while `open` can still be true — leaving the scroll lock stuck with no
  // control to release it. Close the menu once the viewport reaches lg; the
  // effect above then restores overflow.
  useEffect(() => {
    const mq = window.matchMedia("(min-width: 1024px)");
    if (mq.matches) setOpen(false);
    const onChange = (e: MediaQueryListEvent) => {
      if (e.matches) setOpen(false);
    };
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);

  const href = (id: string) => (onHome ? `#${id}` : `/#${id}`);

  return (
    <header className="sticky top-0 z-50">
      {/* Doc strip */}
      <div className="mnl-stamp">
        <div className="mnl-container flex items-center justify-between gap-4 py-1.5">
          <span className="mnl-dim truncate text-bone-100/80">
            FIELD SERVICE MANUAL · SPRINGFIELD CENTRAL QLD 4300
          </span>
          <a
            href={BUSINESS.phoneHref}
            className="mnl-dim mnl-num flex shrink-0 items-center gap-2 text-signal-400 transition-colors hover:text-bone-100"
          >
            <Phone className="h-3 w-3" aria-hidden="true" />
            {BUSINESS.phone}
          </a>
        </div>
      </div>

      {/* Toolbar */}
      <div className="border-b border-carbon-950 bg-bone-100/95 backdrop-blur-sm">
        <div className="mnl-container flex items-stretch justify-between gap-4">
          <Link
            href="/"
            className="flex items-center gap-3 py-3"
            aria-label={`${BUSINESS.name} — home`}
          >
            <span className="flex h-11 w-11 items-center justify-center bg-carbon-950 font-display text-lg leading-none text-bone-100 shadow-hard-signal">
              CCR
            </span>
            <span className="hidden flex-col justify-center sm:flex">
              <span className="mnl-dim-lg text-carbon-950">
                COOL CASE REPAIR
              </span>
              <span className="mnl-dim mt-0.5 text-carbon-500">
                TECH TEARDOWN & REPAIR CO.
              </span>
            </span>
          </Link>

          <nav
            className="hidden items-center gap-5 lg:flex"
            aria-label="Manual sections"
          >
            {SECTIONS.slice(1).map((s) => (
              <a
                key={s.id}
                href={href(s.id)}
                className="group mnl-dim flex items-baseline gap-1.5 text-carbon-700 transition-colors hover:text-signal-600"
              >
                <span className="mnl-num text-signal-600 opacity-60 transition-opacity group-hover:opacity-100">
                  {s.no}
                </span>
                {s.nav}
              </a>
            ))}
          </nav>

          <div className="flex items-center gap-3">
            <ThemeToggle />
            <Link href="/quote" className="mnl-btn mnl-btn-sm hidden sm:inline-flex">
              Free quote
            </Link>
            <button
              type="button"
              className="mnl-chip lg:hidden"
              onClick={() => setOpen((v) => !v)}
              aria-expanded={open}
              aria-label={open ? "Close the section index" : "Open the section index"}
            >
              {open ? (
                <X className="h-4 w-4" aria-hidden="true" />
              ) : (
                <Menu className="h-4 w-4" aria-hidden="true" />
              )}
              Index
            </button>
          </div>
        </div>
      </div>

      {/* Mobile index sheet */}
      {open ? (
        <div className="absolute inset-x-0 top-full max-h-[calc(100vh-6rem)] overflow-y-auto border-b border-carbon-950 bg-bone-100 shadow-[0_14px_0_0_rgb(var(--carbon-950)/0.08)] lg:hidden">
          <nav className="mnl-container py-4" aria-label="Manual sections">
            <ul className="divide-y divide-carbon-150">
              {SECTIONS.map((s) => (
                <li key={s.id}>
                  <a
                    href={href(s.id)}
                    className="flex items-baseline gap-4 py-3.5"
                    onClick={() => setOpen(false)}
                  >
                    <span className="mnl-dim-lg mnl-num text-signal-600">
                      {s.no}
                    </span>
                    <span className="mnl-title text-base text-carbon-950">
                      {s.title}
                    </span>
                  </a>
                </li>
              ))}
            </ul>
            <div className="mt-4 grid grid-cols-2 gap-3">
              <Link
                href="/quote"
                className="mnl-btn"
                onClick={() => setOpen(false)}
              >
                Free quote
              </Link>
              <a href={BUSINESS.phoneHref} className="mnl-btn-ghost">
                Call us
              </a>
            </div>
          </nav>
        </div>
      ) : null}
    </header>
  );
}
