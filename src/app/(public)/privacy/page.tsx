import type { Metadata } from "next";
import Link from "next/link";
import { BUSINESS } from "@/lib/config";
import LegalShell from "@/components/public/LegalShell";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description: `How ${BUSINESS.name} collects, uses and protects your personal information — quote form details, repair records and your rights under the Australian Privacy Principles.`,
  alternates: { canonical: "/privacy" },
};

export default function PrivacyPage() {
  return (
    <LegalShell
      title="Privacy Policy"
      intro="We collect the minimum information needed to quote and complete your repair — and we never sell it. This policy explains what we collect, why, and your rights."
      updated="June 2026"
    >
      <section>
        <h2>1. Who we are</h2>
        <p>
          This policy covers {BUSINESS.legalName} (&ldquo;CCR&rdquo;,
          &ldquo;we&rdquo;, &ldquo;us&rdquo;), a device repair business
          operating from {BUSINESS.address.line1}, {BUSINESS.address.line2},{" "}
          {BUSINESS.address.suburb} {BUSINESS.address.state}{" "}
          {BUSINESS.address.postcode}. We handle personal information in line
          with the Privacy Act 1988 (Cth) and the Australian Privacy Principles
          (APPs).
        </p>
      </section>

      <section>
        <h2>2. What we collect</h2>
        <h3>When you request a quote online</h3>
        <ul>
          <li>Your name, email address and phone number</li>
          <li>Your suburb</li>
          <li>How you heard about us (referral source)</li>
          <li>
            Details of your device and the problem (device type, brand, model,
            repair needed and any notes you add)
          </li>
        </ul>
        <h3>When you book a repair in store</h3>
        <ul>
          <li>Your contact details</li>
          <li>
            Device details and a record of the device&apos;s condition at
            check-in (used to protect both you and us)
          </li>
        </ul>
        <h3>Automatically, for site security</h3>
        <ul>
          <li>
            A one-way cryptographic hash of your IP address when you submit the
            quote form — used only for spam prevention and rate limiting. We do
            not store your raw IP address with your quote, and we do not use
            advertising or tracking cookies on this site.
          </li>
        </ul>
      </section>

      <section>
        <h2>3. Why we collect it</h2>
        <ul>
          <li>
            To prepare and <strong>email you your repair estimate</strong> —
            the main reason we ask for your details.
          </li>
          <li>To contact you about your quote, booking or repair.</li>
          <li>
            To keep accurate repair and warranty records, so we can honour your
            warranty later.
          </li>
          <li>
            To understand how customers find us (referral source) and improve
            our service.
          </li>
        </ul>
        <p>
          We only use your information for these purposes. We do not send
          marketing emails unless you&apos;ve specifically asked us to.
        </p>
      </section>

      <section>
        <h2>4. Who we share it with</h2>
        <p>
          <strong>We never sell or rent your personal information.</strong> We
          only disclose it:
        </p>
        <ul>
          <li>
            to service providers who help us operate (for example, our email
            delivery provider, so your estimate can reach your inbox), under
            confidentiality obligations;
          </li>
          <li>where required or authorised by law.</li>
        </ul>
        <p>
          Reviews shown on this site are public Google reviews and display the
          name the reviewer chose to publish on Google.
        </p>
      </section>

      <section>
        <h2>5. How we store and protect it</h2>
        <ul>
          <li>
            Your information is stored in a secure database accessible only to
            authorised CCR staff via password-protected accounts.
          </li>
          <li>
            We keep repair records for as long as needed to honour warranties
            and meet legal record-keeping obligations, then delete or
            de-identify them.
          </li>
          <li>
            This website uses only essential cookies (for staff sign-in). There
            are no advertising or analytics tracking cookies.
          </li>
        </ul>
      </section>

      <section>
        <h2>6. Your device data during repair</h2>
        <p>
          We do not browse or copy the contents of your device, and we only
          access what is needed to test the repair (for example, testing the
          camera or speaker). For some repairs you may prefer to remove your
          SIM and disable security locks first — we&apos;ll let you know.
          Please back up your data before any repair; see our{" "}
          <Link href="/terms">Terms &amp; Conditions</Link>.
        </p>
      </section>

      <section>
        <h2>7. Access, correction and deletion</h2>
        <p>
          You can ask us at any time to access, correct or delete the personal
          information we hold about you. Email{" "}
          <a href={`mailto:${BUSINESS.email}`}>{BUSINESS.email}</a> with your
          name and phone number and we&apos;ll respond within a reasonable
          time (usually within 30 days). Note that we may need to keep some
          records to honour an active warranty or meet legal obligations.
        </p>
      </section>

      <section>
        <h2>8. Complaints</h2>
        <p>
          If you believe we&apos;ve mishandled your personal information,
          contact us first at{" "}
          <a href={`mailto:${BUSINESS.email}`}>{BUSINESS.email}</a> or{" "}
          <a href={BUSINESS.phoneHref}>{BUSINESS.phone}</a> and we&apos;ll do
          our best to fix it. If you&apos;re not satisfied with our response,
          you can complain to the Office of the Australian Information
          Commissioner (OAIC) at{" "}
          <a href="https://www.oaic.gov.au" target="_blank" rel="noopener noreferrer">
            oaic.gov.au
          </a>
          .
        </p>
      </section>

      <section>
        <h2>9. Changes to this policy</h2>
        <p>
          We may update this policy from time to time. The version published on
          this page, with its &ldquo;last updated&rdquo; date, is the current
          one.
        </p>
      </section>
    </LegalShell>
  );
}
