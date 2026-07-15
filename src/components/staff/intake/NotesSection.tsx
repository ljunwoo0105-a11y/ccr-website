type NotesSectionProps = {
  readonly accessories: string;
  readonly conditionNotes: string;
  readonly onAccessoriesChange: (value: string) => void;
  readonly onConditionNotesChange: (value: string) => void;
};

export function NotesSection(props: NotesSectionProps) {
  return (
    <section className="card">
      <h2 className="mb-4 text-base font-semibold text-carbon-950">
        Accessories &amp; notes
      </h2>
      <div className="grid grid-cols-1 gap-4">
        <div>
          <label htmlFor="in-accessories" className="label">
            Accessories left with the device{" "}
            <span className="text-carbon-400">(optional)</span>
          </label>
          <input
            id="in-accessories"
            className="input"
            placeholder="Case, SIM tray pin, charging cable…"
            value={props.accessories}
            onChange={(event) => props.onAccessoriesChange(event.target.value)}
          />
        </div>
        <div>
          <label htmlFor="in-notes" className="label">
            Condition notes <span className="text-carbon-400">(optional)</span>
          </label>
          <textarea
            id="in-notes"
            className="input min-h-[80px]"
            placeholder="Scratches on the frame, dent on the corner…"
            value={props.conditionNotes}
            onChange={(event) =>
              props.onConditionNotesChange(event.target.value)
            }
          />
        </div>
      </div>
    </section>
  );
}
