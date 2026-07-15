import { Loader2 } from "lucide-react";

type FormActionsProps = {
  readonly busy: boolean;
  readonly disabled: boolean;
  readonly onCancel: () => void;
};

export function FormActions(props: FormActionsProps) {
  return (
    <div className="flex justify-end gap-3">
      <button type="button" className="btn-ghost" onClick={props.onCancel}>
        Cancel
      </button>
      <button
        type="submit"
        className="btn-secondary"
        disabled={props.busy || props.disabled}
      >
        {props.busy && <Loader2 className="h-4 w-4 animate-spin" aria-hidden />}
        Check device in
      </button>
    </div>
  );
}
