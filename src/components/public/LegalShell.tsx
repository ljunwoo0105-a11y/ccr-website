import Link from "next/link";
import PageMasthead from "@/components/public/pages/PageMasthead";

/**
 * Restrained legal/policy template: dark spec-sheet masthead, then a quiet
 * dark reading column. Zero decoration — restraint is the template.
 */
export default function LegalShell({
  title,
  intro,
  updated,
  breadcrumb = "CCR / LEGAL",
  children,
}: {
  title: string;
  intro: string;
  updated: string;
  /** Mono breadcrumb, e.g. "CCR / WARRANTY". Defaults to "CCR / LEGAL". */
  breadcrumb?: string;
  children: React.ReactNode;
}) {
  return (
    <>
      <PageMasthead
        breadcrumb={breadcrumb}
        title={title}
        lead={intro}
        meta={`Last updated · ${updated}`}
      />

      <div className="bg-ink-950">
        <div className="mx-auto w-full max-w-[68ch] px-5 py-16 sm:px-6 sm:py-20">
          <div
            className="space-y-10 text-sm leading-relaxed text-ink-300
              [&_h2]:font-display [&_h2]:text-lg [&_h2]:font-bold [&_h2]:text-ink-100
              [&_h3]:text-base [&_h3]:font-semibold [&_h3]:text-ink-100
              [&_section]:space-y-3
              [&_ul]:list-disc [&_ul]:space-y-2 [&_ul]:pl-5
              [&_ol]:list-decimal [&_ol]:space-y-2 [&_ol]:pl-5
              [&_a]:font-medium [&_a]:text-gold-500 [&_a]:underline-offset-4
              [&_a:hover]:text-gold-300 [&_a:hover]:underline
              [&_strong]:font-semibold [&_strong]:text-ink-100"
          >
            {children}
          </div>

          <p className="mt-14 border-t border-ink-700 pt-6 text-xs text-ink-400">
            Questions about this policy? Visit us at Orion Springfield Central
            or{" "}
            <Link href="/#contact" className="link-gold">
              contact us
            </Link>
            .
          </p>
        </div>
      </div>
    </>
  );
}
