"use client";

import { AlertTriangle } from "lucide-react";
import { Modal } from "@/components/admin/modal";
import { deleteConfirmationMatches } from "@/components/admin/records-state";

export type DeleteTarget = {
  readonly type: "intake" | "repair-form";
  readonly id: string;
  readonly label: string;
};

export function RecordsDeleteModal({
  target,
  value,
  busy,
  error,
  onValue,
  onCancel,
  onConfirm,
}: {
  readonly target: DeleteTarget;
  readonly value: string;
  readonly busy: boolean;
  readonly error: string | null;
  readonly onValue: (value: string) => void;
  readonly onCancel: () => void;
  readonly onConfirm: () => void;
}) {
  const confirmed = deleteConfirmationMatches(value);

  return (
    <Modal title="Delete record" onClose={onCancel}>
      <div className="space-y-4">
        <div className="flex gap-3 bg-rose-50 px-3 py-3 text-sm text-rose-800">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
          <p>
            This permanently deletes {target.label}. Type{" "}
            <span className="font-mono font-semibold">DELETE</span> to confirm.
          </p>
        </div>
        <div>
          <label className="label" htmlFor="record-delete-confirm">
            Confirmation
          </label>
          <input
            id="record-delete-confirm"
            className="input font-mono"
            value={value}
            onChange={(event) => onValue(event.target.value)}
            autoComplete="off"
          />
        </div>
        {error && (
          <p className="bg-rose-50 px-3 py-2 text-sm text-rose-700">{error}</p>
        )}
        <div className="flex justify-end gap-3 pt-2">
          <button type="button" className="btn-ghost" onClick={onCancel}>
            Cancel
          </button>
          <button
            type="button"
            className="btn-primary bg-rose-600 hover:bg-rose-700"
            disabled={!confirmed || busy}
            onClick={onConfirm}
          >
            {busy ? "Deleting..." : "Delete"}
          </button>
        </div>
      </div>
    </Modal>
  );
}
