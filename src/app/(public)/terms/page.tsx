import type { Metadata } from "next";
import Link from "next/link";
import { BUSINESS } from "@/lib/config";

import LegalShell from "@/components/public/LegalShell";

export const metadata: Metadata = {
  title: "Terms & Conditions",
  description: `Terms and conditions for repairs and quotes at ${BUSINESS.name}, Orion Springfield Central. Quotes, inspections, uncollected devices, warranty and Australian Consumer Law.`,
  alternates: { canonical: "/terms" },
};

export default function TermsPage() {
  return (
    <LegalShell
      title="Terms & Conditions"
      intro="The plain-English terms that apply when you request a quote or book a repair with Cool Case Repair (CCR) at Orion Springfield Central."
      updated="June 2026"
    >
      <section>
        <h2>1. About these terms</h2>
        <p>
          These terms apply to quotes requested through this website and to
          repair services provided by {BUSINESS.legalName} (&ldquo;CCR&rdquo;,
          &ldquo;we&rdquo;, &ldquo;us&rdquo;) at {BUSINESS.address.line1},{" "}
          {BUSINESS.address.line2}, {BUSINESS.address.suburb}{" "}
          {BUSINESS.address.state} {BUSINESS.address.postcode}. By requesting a
          quote or leaving a device with us for repair, you agree to these
          terms.
        </p>
      </section>

      <section>
        <h2>2. Quotes and estimates</h2>
        <ul>
          <li>
            Quotes provided through our online quote form are{" "}
            <strong>estimates only</strong>. They are calculated from the most
            affordable suitable part option for the repair you describe and are
            based on the information you give us.
          </li>
          <li>
            Every estimate is <strong>subject to a free in-store
            inspection</strong> of the device. The final price may change if
            the device, model or fault differs from what was described, or if
            additional damage is found during inspection. We will always
            confirm the final price with you before starting any work.
          </li>
          <li>
            Online estimates are <strong>valid for 14 days</strong> from the
            date of our email. Part availability and pricing can change after
            that.
          </li>
          <li>
            Where you choose a higher part-quality tier (for example genuine
            service-pack instead of aftermarket), the price will differ from
            the emailed estimate. We&apos;ll explain your options in store.
          </li>
          <li>
            Our Price Beat Guarantee applies to genuine written quotes from
            local competitors for the same repair, on the same device, using
            the same part quality, and is verified in store.
          </li>
        </ul>
      </section>

      <section>
        <h2>3. Repairs</h2>
        <ul>
          <li>
            We record the condition of your device at check-in (including
            existing damage and functionality) and ask you to acknowledge that
            record. This protects both of us.
          </li>
          <li>
            Some repairs — particularly liquid damage, board-level work and
            ordered parts — may require the device to stay with us longer.
            We&apos;ll give you a realistic time frame before we start.
          </li>
          <li>
            A deposit may be required where parts must be ordered specifically
            for your repair. Deposits on specially ordered parts are
            non-refundable once the part has been ordered, except as required
            by law.
          </li>
          <li>
            Repaired parts are covered by our{" "}
            <Link href="/warranty">warranty policy</Link>, with warranty
            periods depending on the part quality chosen.
          </li>
        </ul>
      </section>

      <section>
        <h2>4. Your data and Find My / activation locks</h2>
        <ul>
          <li>
            <strong>Back up your device before any repair.</strong> While we
            take great care, data loss can occur during any repair and we are
            not liable for loss of data, apps, settings or media. Data
            recovery, where requested, is provided on a best-effort basis.
          </li>
          <li>
            You may be asked to disable Find My iPhone, activation locks or
            similar security features before some repairs can proceed.
          </li>
          <li>
            By leaving a device with us you confirm you are its owner or are
            authorised by the owner to approve the repair.
          </li>
        </ul>
      </section>

      <section>
        <h2>5. Uncollected devices</h2>
        <p>
          Please collect your device promptly once we let you know it&apos;s
          ready. We will attempt to contact you using the details you provide.
          Devices left <strong>uncollected for 90 days</strong> after we notify
          you that the repair is complete (or that we cannot proceed) may be
          treated as abandoned and disposed of or sold to recover repair and
          storage costs, to the extent permitted by Queensland law. Any surplus
          after our reasonable costs will be returned to you on request.
        </p>
      </section>

      <section>
        <h2>6. Liability</h2>
        <ul>
          <li>
            To the extent permitted by law, our liability for any claim arising
            from a repair is limited to re-supplying the service or refunding
            the amount you paid for it.
          </li>
          <li>
            We are not liable for faults unrelated to the repair we performed,
            for pre-existing damage, or for indirect or consequential loss
            (including loss of data or loss of income) beyond what the
            Australian Consumer Law requires.
          </li>
          <li>
            Opening a device can affect manufacturer water-resistance seals; we
            cannot guarantee water-resistance after any repair.
          </li>
        </ul>
      </section>

      <section>
        <h2>7. Australian Consumer Law</h2>
        <p>
          <strong>
            Nothing in these terms excludes, restricts or modifies your rights
            under the Australian Consumer Law.
          </strong>{" "}
          Our goods and services come with guarantees that cannot be excluded.
          You are entitled to a replacement or refund for a major failure and
          compensation for any other reasonably foreseeable loss or damage, and
          to have services remedied if they are not rendered with due care and
          skill.
        </p>
      </section>

      <section>
        <h2>8. Website</h2>
        <p>
          Content on this website is general information about our services and
          is provided in good faith. Review content reflects the opinions of
          the customers who wrote it. We may update these terms from time to
          time — the version on this page applies from its &ldquo;last
          updated&rdquo; date.
        </p>
      </section>

      <section>
        <h2>9. Contact</h2>
        <p>
          Questions about these terms? Call{" "}
          <a href={BUSINESS.phoneHref}>{BUSINESS.phone}</a>, email{" "}
          <a href={`mailto:${BUSINESS.email}`}>{BUSINESS.email}</a> or visit us
          at {BUSINESS.address.line1}, {BUSINESS.address.line2},{" "}
          {BUSINESS.address.suburb} {BUSINESS.address.state}{" "}
          {BUSINESS.address.postcode}.
        </p>
      </section>
    </LegalShell>
  );
}
