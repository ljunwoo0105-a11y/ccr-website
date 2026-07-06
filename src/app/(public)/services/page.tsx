import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Phone } from "lucide-react";
import {
  BUSINESS,
  PART_QUALITIES,
  QUALITY_LABELS,
  QUALITY_DEFAULT_WARRANTY,
} from "@/lib/config";
import { cn } from "@/lib/utils";
import { SERVICES } from "@/components/public/services-data";
import CtaBanner from "@/components/public/CtaBanner";
import JsonLd from "@/components/public/JsonLd";
import { servicesSchema } from "@/components/public/schema";
import { warrantyWords } from "@/components/public/format";
import { Reveal, RevealGroup, RevealItem } from "@/components/motion/Reveal";
import PageMasthead from "@/components/public/pages/PageMasthead";

export const metadata: Metadata = {
  title: "Repair Services — Phone, Tablet, Computer, Drone & Watch",
  description: `Phone, tablet, computer, drone, watch and car key repairs at Orion Springfield Central. Choose your part quality — genuine, OEM or aftermarket — with warranties up to 12 months. Free quotes from ${BUSINESS.name}.`,
  alternates: { canonical: "/services" },
};

const QUALITY_DESCRIPTIONS: Record<(typeof PART_QUALITIES)[number], string> = {
  GENUINE:
    "Original manufacturer service part — identical to what your device shipped with.",
  OEM: "Built by the original component maker to factory specification.",
  PREMIUM:
    "High-grade aftermarket part with excellent colour, brightness and touch response.",
  AFTERMARKET:
    "Dependable budget-friendly option, fully tested before and after fitting.",
};

// `?v=2` busts stale Next.js image-optimizer + browser caches after the
// broken placeholder JPEGs were replaced with the real ones. Bump if reimaged.
const IMG_VERSION = "2";
const serviceImages: Record<string, string> = {
  "phone-repair": `/images/ccr/generated-phone-repair.jpg?v=${IMG_VERSION}`,
  "tablet-repair": `/images/ccr/generated-tablet-repair.jpg?v=${IMG_VERSION}`,
  "computer-repair": `/images/ccr/generated-computer-repair.jpg?v=${IMG_VERSION}`,
  "drone-repair": `/images/ccr/generated-drone-repair.jpg?v=${IMG_VERSION}`,
  "watch-carkey-repair": `/images/ccr/generated-watch-repair.jpg?v=${IMG_VERSION}`,
  "it-solutions": `/images/ccr/generated-it-solutions.jpg?v=${IMG_VERSION}`,
};

export default function ServicesPage() {
  return (
    <>
      <JsonLd
        data={servicesSchema(
          SERVICES.map((s) => ({
            name: s.name,
            description: s.short,
            anchor: s.anchor,
          }))
        )}
      />

      {/* Spec-sheet masthead */}
      <PageMasthead
        breadcrumb="CCR / SERVICES"
        title="What we fix."
        lead="Phones, tablets, computers, drones, watches and car keys — repaired at Orion Springfield Central, most on the spot while you shop."
        meta="Price beat guarantee · Warranty up to 12 months"
      >
        <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:gap-4">
          <Link href="/quote" className="btn-gold">
            Get a free quote
          </Link>
          <a href={BUSINESS.phoneHref} className="btn-ghost-dark">
            <Phone size={16} aria-hidden="true" />
            Call {BUSINESS.phone}
          </a>
        </div>

        <nav aria-label="Services on this page" className="mt-10">
          <ul className="flex flex-wrap gap-2">
            {SERVICES.map((s) => (
              <li key={s.anchor}>
                <a
                  href={`#${s.anchor}`}
                  className="mono-label inline-flex items-center rounded-full border border-ink-700 px-4 py-2 text-ink-300 transition-colors duration-200 hover:border-gold-500 hover:text-gold-500"
                >
                  {s.name}
                </a>
              </li>
            ))}
          </ul>
        </nav>
      </PageMasthead>

      {/* Per-service spec sections — anchor ids must never change */}
      {SERVICES.map((service, index) => (
        <section
          key={service.anchor}
          id={service.anchor}
          className={cn(
            "scroll-mt-20 bg-paper py-16 sm:py-20",
            index > 0 && "border-t border-line"
          )}
          aria-labelledby={`${service.anchor}-heading`}
        >
          <div className="site-container">
            <Reveal>
              <div className="flex items-center gap-4">
                <span className="eyebrow text-gold-700">
                  {String(index + 1).padStart(2, "0")} — {service.name}
                </span>
                <div className="h-px flex-1 bg-line" aria-hidden="true" />
              </div>

              <div className="mt-10 grid items-start gap-10 lg:grid-cols-2 lg:gap-16">
                {/* Photo on a stone mat */}
                <div className={cn(index % 2 === 1 && "lg:order-2")}>
                  <div className="tick-corners rounded-lg bg-stone p-3 text-ink-950">
                    <Image
                      src={serviceImages[service.anchor]}
                      alt={`${service.name} service`}
                      width={1200}
                      height={900}
                      sizes="(min-width: 1024px) 50vw, 100vw"
                      className="aspect-[4/3] w-full rounded object-cover"
                    />
                  </div>
                </div>

                <div>
                  <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-ink-950">
                    <service.icon
                      className="h-5 w-5 text-gold-500"
                      strokeWidth={1.5}
                      aria-hidden="true"
                    />
                  </div>
                  <h2
                    id={`${service.anchor}-heading`}
                    className="site-heading mt-4 text-ink-950"
                  >
                    {service.name}
                  </h2>
                  <p className="mt-4 text-sm leading-relaxed text-ink-600 sm:text-base">
                    {service.detail}
                  </p>

                  <h3 className="mono-label mt-8 text-ink-500">
                    Common repairs
                  </h3>
                  <ul className="mt-4 grid gap-x-6 gap-y-2 text-sm text-ink-600 sm:grid-cols-2">
                    {service.commonRepairs.map((repair) => (
                      <li key={repair} className="flex items-start gap-2.5">
                        <span
                          className="mt-2 h-1 w-1 shrink-0 rounded-full bg-gold-700"
                          aria-hidden="true"
                        />
                        {repair}
                      </li>
                    ))}
                  </ul>

                  <div className="mt-6">
                    <Link
                      href="/quote"
                      className="link-paper inline-flex items-center gap-1.5 text-sm"
                    >
                      Get a free {service.name.toLowerCase()} quote
                      <ArrowRight size={14} aria-hidden="true" />
                    </Link>
                  </div>
                </div>
              </div>
            </Reveal>
          </div>
        </section>
      ))}

      {/* Part quality explainer */}
      <section
        id="part-quality"
        className="scroll-mt-20 border-t border-line bg-paper py-16 sm:py-20"
        aria-labelledby="quality-heading"
      >
        <div className="site-container">
          <Reveal>
            <div className="flex items-center gap-4">
              <span className="eyebrow text-gold-700">
                {String(SERVICES.length + 1).padStart(2, "0")} — Part quality
              </span>
              <div className="h-px flex-1 bg-line" aria-hidden="true" />
            </div>
            <h2 id="quality-heading" className="site-heading mt-8 text-ink-950">
              Your parts, your choice.
            </h2>
            <p className="mt-3 max-w-2xl text-base leading-relaxed text-ink-600">
              Most repairs come with a choice of part quality, each tier backed
              by its own warranty. We&apos;ll always tell you which options are
              available for your exact device.
            </p>
          </Reveal>

          <RevealGroup className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {PART_QUALITIES.map((quality, i) => (
              <RevealItem key={quality} index={i} className="h-full">
                <div className="card-paper flex h-full flex-col p-6">
                  <h3 className="font-display text-lg font-bold text-ink-950">
                    {QUALITY_LABELS[quality]}
                  </h3>
                  <p className="mono-label mt-2 text-gold-700">
                    {warrantyWords(QUALITY_DEFAULT_WARRANTY[quality] ?? 90)}{" "}
                    warranty
                  </p>
                  <p className="mt-3 text-sm leading-relaxed text-ink-600">
                    {QUALITY_DESCRIPTIONS[quality]}
                  </p>
                </div>
              </RevealItem>
            ))}
          </RevealGroup>

          <p className="mt-8 text-xs text-ink-500">
            Availability varies by device and repair. See our{" "}
            <Link href="/warranty" className="link-paper">
              warranty policy
            </Link>{" "}
            for full coverage details.
          </p>
        </div>
      </section>

      <CtaBanner />
    </>
  );
}
