import type { ReactNode } from "react";
import { SECTIONS, SHEET_COUNT } from "./sections";

/**
 * One sheet of the field manual. Every section on the page is a numbered
 * drawing sheet: a header rule with the sheet index and title, registration
 * marks in the corners, and a running footer strip — like pages pulled from
 * a service binder.
 */
export default function Sheet({
  no,
  children,
  tone = "paper",
  footerNote,
}: {
  no: string;
  children: ReactNode;
  tone?: "paper" | "recessed";
  footerNote?: string;
}) {
  const section = SECTIONS.find((s) => s.no === no);
  if (!section) throw new Error(`Unknown sheet ${no}`);
  return (
    <section
      id={section.id}
      className={`relative scroll-mt-24 border-b border-carbon-950 ${
        tone === "recessed" ? "bg-bone-200" : ""
      }`}
    >
      <div className="mnl-container relative">
        {/* Sheet header rule */}
        <div className="flex items-center gap-4 border-b border-carbon-950 py-3">
          <span className="mnl-reg text-carbon-950" aria-hidden="true" />
          <span className="mnl-dim-lg mnl-num text-signal-600">
            SHEET {section.no}
          </span>
          <span className="mnl-dim hidden text-carbon-500 sm:inline">
            {section.title}
          </span>
          <span
            className="mnl-hatch ml-auto hidden h-3 w-24 sm:block"
            aria-hidden="true"
          />
          <span className="mnl-dim mnl-num text-carbon-500">
            {section.no} / {String(SHEET_COUNT - 1).padStart(2, "0")}
          </span>
        </div>

        {children}
      </div>

      {/* Running footer strip */}
      {footerNote ? (
        <div className="border-t border-carbon-150">
          <div className="mnl-container flex items-center justify-between py-2">
            <span className="mnl-dim text-carbon-500">{footerNote}</span>
            <span className="mnl-dim mnl-num text-carbon-500">
              CCR·K1 / REV 2026.07
            </span>
          </div>
        </div>
      ) : null}
    </section>
  );
}
