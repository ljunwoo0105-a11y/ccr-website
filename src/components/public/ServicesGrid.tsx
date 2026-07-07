import Image from "next/image";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { BUSINESS } from "@/lib/config";
import { SERVICES } from "@/components/public/services-data";
import { Reveal, RevealGroup, RevealItem } from "@/components/motion/Reveal";
import GlowCard from "@/components/motion/GlowCard";
import LineRise from "@/components/motion/LineRise";
import TiltCard from "@/components/motion/TiltCard";

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

export default function ServicesGrid() {
  return (
    <section className="bg-ink-950 py-24" aria-labelledby="services-heading">
      <div className="site-container-wide">
        <Reveal className="mb-12">
          <div className="flex items-center gap-4">
            <span className="eyebrow text-gold-500">01 — WHAT WE FIX</span>
            <div className="h-px flex-1 bg-ink-700" aria-hidden="true" />
          </div>
          <LineRise
            as="h2"
            id="services-heading"
            className="site-heading mt-5 text-ink-50"
            lines={["Every device. One kiosk."]}
          />
          <p className="mt-4 max-w-2xl text-ink-300">
            Phones, tablets, computers, drones, watches and business IT — clear
            advice, local support and warranty-backed work.
          </p>
        </Reveal>

        <RevealGroup className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          {SERVICES.map((service, index) => (
            <RevealItem key={service.anchor} index={index} className="flex">
              <TiltCard className="w-full">
                <GlowCard
                  as="article"
                  className="card-dark scan-on-hover group relative flex h-full flex-col overflow-hidden transition-colors hover:border-gold-500/40"
                >
                  <Link
                    href={`/services#${service.anchor}`}
                    className="flex flex-1 flex-col focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-500"
                  >
                    <div className="relative aspect-[16/10] overflow-hidden bg-ink-800">
                      <Image
                        src={serviceImages[service.anchor]}
                        alt={`${service.name} service`}
                        width={1200}
                        height={750}
                        sizes="(min-width: 1024px) 33vw, (min-width: 768px) 50vw, 100vw"
                        className="h-full w-full object-cover transition-all duration-500 group-hover:scale-[1.03] md:grayscale md:group-hover:grayscale-0"
                      />
                      {/* Duotone wash — lifts on hover; touch devices see color */}
                      <div
                        aria-hidden="true"
                        className="pointer-events-none absolute inset-0 bg-ink-950/30 opacity-0 transition-opacity duration-500 md:opacity-100 md:group-hover:opacity-0"
                      />
                    </div>

                    <div className="flex flex-1 flex-col p-6">
                      <div className="flex items-center gap-3">
                        <span
                          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-ink-700 text-gold-500"
                          aria-hidden="true"
                        >
                          <service.icon className="h-5 w-5" strokeWidth={1.5} />
                        </span>
                        <h3 className="font-display text-xl font-bold text-ink-100">
                          {service.name}
                        </h3>
                      </div>

                      <p className="mt-2 text-sm text-ink-300">
                        {service.short}
                      </p>

                      <ul className="mt-4 space-y-2">
                        {service.features.slice(0, 5).map((feature) => (
                          <li
                            key={feature}
                            className="flex items-center text-sm text-ink-300"
                          >
                            <span
                              className="mr-3 h-1.5 w-1.5 shrink-0 bg-gold-500"
                              aria-hidden="true"
                            />
                            {feature}
                          </li>
                        ))}
                      </ul>

                      <div className="mt-auto flex items-center justify-between pt-4">
                        <span className="mono-label inline-flex items-center gap-2 text-gold-500">
                          VIEW DETAILS
                          <ArrowRight
                            className="h-3.5 w-3.5 transition-transform duration-200 group-hover:translate-x-1"
                            aria-hidden="true"
                          />
                        </span>
                        <span
                          className="mono-label text-ink-500 opacity-0 transition-opacity delay-500 group-hover:opacity-100"
                          aria-hidden="true"
                        >
                          DIAG · OK
                        </span>
                      </div>
                    </div>
                  </Link>
                </GlowCard>
              </TiltCard>
            </RevealItem>
          ))}
        </RevealGroup>

        <Reveal className="mt-12">
          <div className="relative overflow-hidden rounded-lg border border-ink-700 bg-ink-900 p-8 md:p-12">
            <div
              className="tech-grid absolute inset-0 opacity-50"
              aria-hidden="true"
            />
            <div className="relative">
              <LineRise
                as="h3"
                className="font-display text-2xl font-bold text-ink-50 md:text-3xl"
                lines={["Express repairs while you shop."]}
              />
              <p className="mt-3 max-w-2xl text-ink-300">
                Bring your device to Orion Springfield Central for fast
                diagnosis and practical repair options — express service for
                in-stock parts.
              </p>
              <div className="mt-7 flex flex-col gap-3 sm:flex-row">
                <Link href="/quote" className="btn-gold">
                  Book a repair
                </Link>
                <a href={BUSINESS.phoneHref} className="btn-ghost-dark">
                  Call {BUSINESS.phone}
                </a>
              </div>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
