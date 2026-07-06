"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowRight, Menu, Phone, X } from "lucide-react";
import { BUSINESS } from "@/lib/config";
import { CcrMark } from "@/components/brand/CcrMark";
import { EASE_PRECISION } from "@/components/motion/Reveal";

const LINKS = [
  { href: "/", label: "Home" },
  { href: "/services", label: "Services" },
  { href: "/reviews", label: "Reviews" },
  { href: "/quote", label: "Get a Quote" },
  { href: "/#contact", label: "Contact" },
];

/**
 * Mobile chrome: full-width ink-950 sheet sliding down from the top.
 * Nav rows are large display type with mono index numerals staggering in;
 * phone + gold quote CTA pin to the sheet bottom. Body scroll locks while
 * open; Escape closes.
 */
export default function MobileNav() {
  const [open, setOpen] = useState(false);
  const close = () => setOpen(false);

  useEffect(() => {
    if (!open) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open]);

  return (
    <div className="lg:hidden">
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-expanded={open}
        aria-controls="mobile-menu"
        aria-label="Open menu"
        className="inline-flex items-center justify-center rounded-md p-2 text-ink-200 transition-colors duration-200 hover:text-ink-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-gold-500"
      >
        <Menu className="h-5 w-5" strokeWidth={1.5} aria-hidden="true" />
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            id="mobile-menu"
            initial={{ y: "-8%", opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: "-8%", opacity: 0 }}
            transition={{ duration: 0.3, ease: EASE_PRECISION }}
            className="fixed inset-0 z-[9999] flex min-h-dvh flex-col overflow-y-auto bg-ink-950 text-ink-50"
          >
            <div className="flex h-16 shrink-0 items-center justify-between border-b border-ink-700 px-5">
              <Link
                href="/"
                onClick={close}
                aria-label={`${BUSINESS.name} home`}
                className="inline-flex items-center gap-2 rounded focus:outline-none focus-visible:ring-2 focus-visible:ring-gold-500"
              >
                <CcrMark className="h-8 w-8 text-ink-50" />
                <span className="ccr-wordmark text-2xl leading-none text-ink-50">
                  CCR
                </span>
              </Link>
              <button
                type="button"
                onClick={close}
                aria-label="Close menu"
                className="inline-flex items-center justify-center rounded-md p-2 text-ink-300 transition-colors duration-200 hover:text-ink-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-gold-500"
              >
                <X className="h-5 w-5" strokeWidth={1.5} aria-hidden="true" />
              </button>
            </div>

            <nav
              className="flex flex-1 flex-col px-6 py-8"
              aria-label="Mobile"
            >
              {LINKS.map((link, index) => (
                <motion.div
                  key={link.href}
                  initial={{ opacity: 0, x: -16 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{
                    duration: 0.4,
                    delay: index * 0.06,
                    ease: EASE_PRECISION,
                  }}
                >
                  <Link
                    href={link.href}
                    onClick={close}
                    className="group flex items-baseline gap-4 border-b border-ink-700 py-4 focus:outline-none focus-visible:ring-2 focus-visible:ring-gold-500"
                  >
                    <span
                      className="mono-label tnum text-gold-500"
                      aria-hidden="true"
                    >
                      {String(index + 1).padStart(2, "0")}
                    </span>
                    <span className="font-display text-2xl font-bold text-ink-50 transition-colors duration-200 group-hover:text-gold-500">
                      {link.label}
                    </span>
                  </Link>
                </motion.div>
              ))}
              <motion.div
                initial={{ opacity: 0, x: -16 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{
                  duration: 0.4,
                  delay: LINKS.length * 0.06,
                  ease: EASE_PRECISION,
                }}
                className="pt-6"
              >
                <Link
                  href="/staff/login"
                  onClick={close}
                  aria-label="Staff Login"
                  className="mono-label rounded text-ink-400 transition-colors duration-200 hover:text-ink-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-gold-500"
                >
                  Staff
                </Link>
              </motion.div>
            </nav>

            <div className="flex shrink-0 flex-col gap-3 border-t border-ink-700 px-6 py-6">
              <a
                href={BUSINESS.phoneHref}
                onClick={close}
                className="btn-ghost-dark w-full"
              >
                <Phone className="h-4 w-4" aria-hidden="true" />
                <span className="tnum">Call {BUSINESS.phone}</span>
              </a>
              <Link
                href="/quote"
                onClick={close}
                className="btn-gold group w-full"
              >
                Get a free quote
                <ArrowRight
                  className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-1"
                  aria-hidden="true"
                />
              </Link>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
