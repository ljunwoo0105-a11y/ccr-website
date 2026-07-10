import Link from "next/link";
import { SERVICES } from "@/components/public/services-data";
import { RevealGroup, RevealItem } from "@/components/motion/Reveal";
import Sheet from "./Sheet";

/**
 * SHEET 01 — the service catalogue drawn as numbered work orders.
 */
export default function WorkOrders() {
  return (
    <Sheet no="01" footerNote="ALL WORK ORDERS INCLUDE FREE DIAGNOSIS & QUOTE">
      <div className="grid gap-8 py-10 lg:grid-cols-12 lg:py-14">
        <div className="lg:col-span-4">
          <h2 className="mnl-display text-4xl text-carbon-950 sm:text-5xl">
            Work
            <br />
            orders<span className="text-signal-500">.</span>
          </h2>
          <p className="mt-5 max-w-sm text-sm leading-relaxed text-carbon-700">
            Six standing work orders cover almost everything that comes across
            the bench. No booking needed — bring the device in, or open a work
            order online and we&apos;ll email a quote first.
          </p>
        </div>

        <RevealGroup
          as="ul"
          className="grid gap-4 sm:grid-cols-2 lg:col-span-8"
          stagger={0.06}
        >
          {SERVICES.map((svc, i) => {
            const Icon = svc.icon;
            return (
              <RevealItem key={svc.anchor} as="li" index={i} y={20}>
                <article className="mnl-plate-flat group flex h-full flex-col p-5 transition-all duration-150 hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-hard-lg">
                  <header className="flex items-start justify-between gap-3">
                    <span className="mnl-dim mnl-num text-signal-600">
                      WO-{String(i + 1).padStart(2, "0")}
                    </span>
                    <Icon
                      className="h-5 w-5 text-carbon-500 transition-colors group-hover:text-signal-600"
                      aria-hidden="true"
                    />
                  </header>
                  <h3 className="mnl-title mt-3 text-base text-carbon-950">
                    {svc.name}
                  </h3>
                  <p className="mt-2 text-xs leading-relaxed text-carbon-500">
                    {svc.short}
                  </p>
                  <ul className="mt-4 flex-1 space-y-1.5">
                    {svc.features.slice(0, 3).map((f) => (
                      <li key={f} className="mnl-dimrow">
                        <span className="mnl-dim text-carbon-700">{f}</span>
                        <span className="mnl-dim text-signal-600">✓</span>
                      </li>
                    ))}
                  </ul>
                  <Link
                    href="/quote"
                    className="mnl-dim mt-5 inline-flex items-center gap-2 text-carbon-950 transition-colors group-hover:text-signal-600"
                  >
                    Open work order
                    <span aria-hidden="true">→</span>
                  </Link>
                </article>
              </RevealItem>
            );
          })}
        </RevealGroup>
      </div>
    </Sheet>
  );
}
