import Link from "next/link";
import {
  Star,
  Zap,
  BadgeCheck,
  ShieldCheck,
  MapPin,
  type LucideIcon,
} from "lucide-react";
import { Reveal, RevealGroup, RevealItem } from "@/components/motion/Reveal";

interface Reason {
  icon: LucideIcon;
  title: string;
  body: string;
}

export default function WhyChooseUs({
  rating,
  reviewCount,
}: {
  rating: number;
  reviewCount: number;
}) {
  const reasons: Reason[] = [
    {
      icon: Star,
      title: `Rated ${rating.toFixed(1)} from ${Math.floor(reviewCount / 100) * 100}+ reviews`,
      body: "Springfield locals have left us thousands of five-star Google reviews — honest advice and repairs done right the first time.",
    },
    {
      icon: Zap,
      title: "Express same-day service",
      body: "Drop your device off, do a lap of Orion, and pick it up fixed — most screens and batteries done while you shop.",
    },
    {
      icon: BadgeCheck,
      title: "Price Beat Guarantee",
      body: "Bring a genuine written quote for the same repair and part quality, and we'll beat it.",
    },
    {
      icon: ShieldCheck,
      title: "Quality parts, real warranty",
      body: "Genuine, OEM-grade, premium or standard aftermarket — each tier backed by its own warranty, up to 12 months.",
    },
    {
      icon: MapPin,
      title: "Inside Orion Springfield Central",
      body: "Kiosk K1, near Foot Locker — open seven days, no appointment needed. Walk in any time.",
    },
  ];

  return (
    <section
      id="about"
      className="scroll-mt-24 bg-paper py-24"
      aria-labelledby="why-heading"
    >
      <div className="site-container">
        <div className="grid gap-12 lg:grid-cols-12 lg:gap-16">
          <Reveal className="self-start lg:sticky lg:top-28 lg:col-span-5">
            <div className="flex items-center gap-4">
              <span className="eyebrow text-gold-700">02 — WHY CCR</span>
              <div className="h-px flex-1 bg-line" aria-hidden="true" />
            </div>
            <h2 id="why-heading" className="site-heading mt-5 text-ink-950">
              Repairs you can watch happen.
            </h2>
            <p className="mt-4 text-ink-600">
              Our kiosk sits out in the open at Orion Springfield Central — no
              back room, no mystery. Certified technicians work in front of
              you, explain your options in plain English, and back the repair
              with a warranty.
            </p>
            <Link href="/quote" className="link-paper mt-6 inline-block">
              Get a free quote →
            </Link>
          </Reveal>

          <RevealGroup className="lg:col-span-7">
            {reasons.map((reason, index) => (
              <RevealItem
                key={reason.title}
                index={index}
                x={-16}
                y={0}
                className="group -mx-4 grid grid-cols-[auto_auto_1fr] items-start gap-5 rounded-lg border-t border-line px-4 py-6 transition-colors last:border-b hover:bg-stone/60"
              >
                <span className="mono-label tnum pt-1 text-ink-500 transition-colors group-hover:text-gold-700">
                  {String(index + 1).padStart(2, "0")}
                </span>
                <span
                  className="flex h-12 w-12 items-center justify-center rounded-lg border border-line text-gold-700"
                  aria-hidden="true"
                >
                  <reason.icon className="h-5 w-5" strokeWidth={1.5} />
                </span>
                <div>
                  <h3 className="font-display text-lg font-bold text-ink-950">
                    {reason.title}
                  </h3>
                  <p className="mt-1 text-sm leading-relaxed text-ink-600">
                    {reason.body}
                  </p>
                </div>
              </RevealItem>
            ))}
          </RevealGroup>
        </div>
      </div>
    </section>
  );
}
