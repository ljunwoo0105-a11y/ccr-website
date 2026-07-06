import type { Metadata } from "next";
import Link from "next/link";
import Scanline from "@/components/motion/Scanline";

export const metadata: Metadata = {
  title: "Page not found",
};

export default function NotFound() {
  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-ink-950 px-6 py-24 text-center">
      <div
        className="pointer-events-none absolute inset-0 tech-grid"
        aria-hidden="true"
      />
      <Scanline play />

      <div className="relative">
        <p className="mono-label text-gold-500">404 · Not found</p>
        <h1 className="type-display mt-4 text-[clamp(2.25rem,6vw,4rem)] text-ink-50">
          This page needs repairs we can&apos;t do.
        </h1>
        <p className="mx-auto mt-5 max-w-md text-base leading-relaxed text-ink-300">
          That page doesn&apos;t exist — but if something&apos;s broken, we can
          probably fix it.
        </p>
        <div className="mt-9 flex flex-col items-center justify-center gap-4 sm:flex-row">
          <Link href="/" className="btn-gold">
            Back to home
          </Link>
          <Link href="/services" className="btn-ghost-dark">
            Browse our services
          </Link>
        </div>
      </div>
    </div>
  );
}
