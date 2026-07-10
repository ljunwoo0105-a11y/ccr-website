// The manual's table of contents — shared by header nav, index rail and
// the sheet plates so numbering can never drift out of sync.

export interface SheetSection {
  no: string;
  id: string;
  title: string;
  nav: string;
}

export const SECTIONS: SheetSection[] = [
  { no: "00", id: "bay", title: "Teardown bay", nav: "Teardown" },
  { no: "01", id: "services", title: "Work orders", nav: "Services" },
  { no: "02", id: "circuit", title: "Board-level service", nav: "Circuit" },
  { no: "03", id: "procedure", title: "Service procedure", nav: "Procedure" },
  { no: "04", id: "qc", title: "Quality control log", nav: "QC log" },
  { no: "05", id: "faq", title: "Field notes", nav: "Field notes" },
  { no: "06", id: "depot", title: "The depot", nav: "Depot" },
];

export const SHEET_COUNT = SECTIONS.length;
