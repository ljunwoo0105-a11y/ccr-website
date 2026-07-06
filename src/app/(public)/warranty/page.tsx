import type { Metadata } from "next";
import Link from "next/link";
import {
  BUSINESS,
  PART_QUALITIES,
  QUALITY_LABELS,
  QUALITY_DEFAULT_WARRANTY,
} from "@/lib/config";
import LegalShell from "@/components/public/LegalShell";
import { warrantyWords } from "@/components/public/format";

export const metadata: Metadata = {
  title: "Repair Warranty Policy",
  description: `Repair warranty at ${BUSINESS.name}: up to 12 months on genuine parts, up to 6 months on OEM and premium parts, 90 days on standard aftermarket. What's covered, what's not, and how to claim.`,
  alternates: { canonical: "/warranty" },
};

export default function WarrantyPage() {
  return (
    <LegalShell
      title="Repair Warranty Policy"
      intro="Every repair we complete is backed by a parts and workmanship warranty. The warranty period depends on the part quality you choose — here's exactly what's covered."
      updated="June 2026"
      breadcrumb="CCR / WARRANTY"
    >
      <section>
        <h2>1. Warranty periods by part quality</h2>
        <p>
          When you book a repair we offer a choice of part quality where
          available, and your warranty period follows the tier you choose:
        </p>
        <div className="card-paper overflow-hidden">
          <table className="w-full text-left text-sm">
            <caption className="sr-only">
              Warranty periods by part quality tier
            </caption>
            <thead>
              <tr className="border-b border-line bg-stone">
                <th scope="col" className="mono-label px-5 py-3 text-ink-500">
                  Part quality
                </th>
                <th scope="col" className="mono-label px-5 py-3 text-ink-500">
                  Warranty period
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {PART_QUALITIES.map((quality) => (
                <tr key={quality}>
                  <th
                    scope="row"
                    className="px-5 py-3.5 font-medium text-ink-950"
                  >
                    {QUALITY_LABELS[quality]}
                  </th>
                  <td className="mono-label px-5 py-3.5 text-gold-700">
                    {warrantyWords(QUALITY_DEFAULT_WARRANTY[quality] ?? 90)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p>
          The exact warranty for your repair is confirmed before any work
          starts and noted on your receipt. The warranty period begins on the
          day you collect your device.
        </p>
      </section>

      <section>
        <h2>2. What the warranty covers</h2>
        <ul>
          <li>
            <strong>Part defects</strong> — faults in the replacement part
            itself, such as dead pixels, touch or display faults, a battery
            that fails to hold charge well below its rated capacity, or a
            faulty speaker, microphone, camera or charging port that we fitted.
          </li>
          <li>
            <strong>Workmanship</strong> — issues caused by the way the repair
            was carried out, such as loose connectors, missing screws, screen
            adhesive failures or components disturbed during the repair.
          </li>
        </ul>
        <p>
          If a covered fault appears within the warranty period we will repair
          or replace the affected part free of charge.
        </p>
      </section>

      <section>
        <h2>3. What the warranty does not cover</h2>
        <ul>
          <li>
            Physical damage occurring after the repair — drops, cracks,
            pressure damage, bent frames or punctures.
          </li>
          <li>Liquid or moisture damage occurring after the repair.</li>
          <li>
            Software issues, operating system updates, app faults or device
            performance unrelated to the repaired part.
          </li>
          <li>
            Pre-existing or unrelated faults in other components of the device,
            including faults that only become apparent once the device is
            working again (we will always flag anything we notice during
            repair).
          </li>
          <li>
            Devices opened, repaired or tampered with by anyone else after our
            repair.
          </li>
          <li>
            Loss of data. Please back up your device before any repair — data
            preservation can never be guaranteed.
          </li>
          <li>Normal wear and tear, including gradual battery degradation.</li>
          <li>
            Water-resistance. Opening any device can affect factory seals, and
            we cannot guarantee water-resistance after a repair.
          </li>
        </ul>
        <p>
          Repairs on devices with pre-existing liquid damage are completed on a
          best-effort basis. Because liquid damage is progressive and
          unpredictable, those repairs carry no warranty unless we tell you
          otherwise in writing.
        </p>
      </section>

      <section>
        <h2>4. How to make a claim</h2>
        <ol>
          <li>
            Bring the device and your receipt (or your name and phone number so
            we can look up the job) to our kiosk at {BUSINESS.address.line1},{" "}
            {BUSINESS.address.line2}, {BUSINESS.address.suburb} — or call{" "}
            <a href={BUSINESS.phoneHref}>{BUSINESS.phone}</a> first if
            you&apos;d like to talk it through.
          </li>
          <li>
            We&apos;ll inspect the device to confirm the fault is covered. This
            inspection is free.
          </li>
          <li>
            If the fault is covered, we&apos;ll repair or replace the affected
            part at no cost — most warranty repairs are completed on the spot
            or within a few days if a part needs to be ordered.
          </li>
          <li>
            If the fault isn&apos;t covered (for example, new physical damage),
            we&apos;ll explain why and give you a no-obligation quote for the
            fix.
          </li>
        </ol>
      </section>

      <section>
        <h2>5. Your rights under Australian Consumer Law</h2>
        <p>
          Our goods and services come with guarantees that cannot be excluded
          under the Australian Consumer Law. You are entitled to a replacement
          or refund for a major failure and compensation for any other
          reasonably foreseeable loss or damage. You are also entitled to have
          services remedied if they are not rendered with due care and skill.
        </p>
        <p>
          This warranty is provided in addition to — and does not limit — your
          rights under the Australian Consumer Law. See also our{" "}
          <Link href="/terms">Terms &amp; Conditions</Link>.
        </p>
      </section>
    </LegalShell>
  );
}
