type IntakeDetailRowProps = {
  readonly label: string;
  readonly value: string;
};

export function IntakeDetailRow(props: IntakeDetailRowProps) {
  return (
    <div className="flex justify-between gap-4">
      <dt className="shrink-0 text-carbon-500">{props.label}</dt>
      <dd className="text-right font-medium text-carbon-950">{props.value}</dd>
    </div>
  );
}
