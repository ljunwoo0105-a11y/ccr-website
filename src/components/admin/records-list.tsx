"use client";

import { Pencil, Trash2 } from "lucide-react";
import { formatDateTime } from "@/lib/utils";
import {
  repairTypesLabel,
  type IntakeListRow,
  type RepairFormListRow,
} from "@/components/admin/records-state";
import type { DeleteTarget } from "@/components/admin/records-delete-modal";
import type { EditTarget } from "@/components/admin/records-edit-modal";

function Badge({ children }: { readonly children: string }) {
  return (
    <span className="inline-flex rounded-full border border-carbon-150 bg-bone-100 px-2 py-0.5 text-xs font-medium text-carbon-700">
      {children}
    </span>
  );
}

function RowActions({
  editTarget,
  deleteTarget,
  busy,
  onEdit,
  onDelete,
}: {
  readonly editTarget: EditTarget;
  readonly deleteTarget: DeleteTarget;
  readonly busy: boolean;
  readonly onEdit: (target: EditTarget) => void;
  readonly onDelete: (target: DeleteTarget) => void;
}) {
  return (
    <div className="flex shrink-0 items-center justify-end gap-1">
      <button
        type="button"
        onClick={() => onEdit(editTarget)}
        disabled={busy}
        aria-label={`Edit ${deleteTarget.label}`}
        className="rounded p-1.5 text-carbon-400 transition hover:bg-bone-200 hover:text-carbon-700 disabled:opacity-50"
      >
        <Pencil className="h-4 w-4" aria-hidden />
      </button>
      <button
        type="button"
        onClick={() => onDelete(deleteTarget)}
        disabled={busy}
        aria-label={`Delete ${deleteTarget.label}`}
        className="rounded p-1.5 text-carbon-400 transition hover:bg-rose-50 hover:text-rose-600 disabled:opacity-50"
      >
        <Trash2 className="h-4 w-4" aria-hidden />
      </button>
    </div>
  );
}

export function IntakeRows({
  rows,
  busyId,
  onEdit,
  onDelete,
}: {
  readonly rows: readonly IntakeListRow[];
  readonly busyId: string | null;
  readonly onEdit: (target: EditTarget) => void;
  readonly onDelete: (target: DeleteTarget) => void;
}) {
  if (rows.length === 0) {
    return (
      <p className="px-6 py-8 text-sm text-carbon-500">No intake records.</p>
    );
  }

  return (
    <div className="divide-y divide-carbon-150">
      {rows.map((row) => (
        <article
          key={row.id}
          className="grid gap-3 px-6 py-4 md:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)_auto]"
        >
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="truncate text-sm font-semibold text-carbon-950">
                {row.customerName}
              </h3>
              <Badge>{row.status}</Badge>
              {row.agreementAcceptedAt ? (
                <Badge>agreement signed</Badge>
              ) : row.hasAgreementSnapshot ? (
                <Badge>agreement snapshot</Badge>
              ) : (
                <Badge>legacy agreement</Badge>
              )}
            </div>
            <p className="mt-1 text-sm text-carbon-600">
              {row.deviceType} - {row.brand} {row.model}
            </p>
            <p className="mt-1 text-xs text-carbon-500">
              {repairTypesLabel(row.repairTypes)}
            </p>
          </div>
          <dl className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs text-carbon-500 sm:grid-cols-3 md:grid-cols-2">
            <div>
              <dt className="font-medium text-carbon-400">Phone</dt>
              <dd>{row.customerPhone}</dd>
            </div>
            <div>
              <dt className="font-medium text-carbon-400">Email</dt>
              <dd className="truncate">{row.customerEmail ?? "-"}</dd>
            </div>
            <div>
              <dt className="font-medium text-carbon-400">Updated</dt>
              <dd>{formatDateTime(row.updatedAt)}</dd>
            </div>
            <div>
              <dt className="font-medium text-carbon-400">Condition</dt>
              <dd>{row.preConditionAccuracyAccepted ? "accepted" : "pending"}</dd>
            </div>
          </dl>
          <RowActions
            editTarget={{ type: "intake", row }}
            deleteTarget={{ type: "intake", id: row.id, label: `intake ${row.id}` }}
            busy={busyId === row.id}
            onEdit={onEdit}
            onDelete={onDelete}
          />
        </article>
      ))}
    </div>
  );
}

export function RepairFormRows({
  rows,
  busyId,
  onEdit,
  onDelete,
}: {
  readonly rows: readonly RepairFormListRow[];
  readonly busyId: string | null;
  readonly onEdit: (target: EditTarget) => void;
  readonly onDelete: (target: DeleteTarget) => void;
}) {
  if (rows.length === 0) {
    return (
      <p className="px-6 py-8 text-sm text-carbon-500">No repair form records.</p>
    );
  }

  return (
    <div className="divide-y divide-carbon-150">
      {rows.map((row) => (
        <article
          key={row.id}
          className="grid gap-3 px-6 py-4 md:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)_auto]"
        >
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="truncate text-sm font-semibold text-carbon-950">
                {row.customerName}
              </h3>
              <Badge>{row.status}</Badge>
              {row.emailedAt ? <Badge>emailed</Badge> : <Badge>not emailed</Badge>}
            </div>
            <p className="mt-1 text-sm text-carbon-600">
              {row.deviceType} - {row.brand} {row.model}
            </p>
            {row.emailError && (
              <p className="mt-1 text-xs font-medium text-rose-600">
                {row.emailError}
              </p>
            )}
          </div>
          <dl className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs text-carbon-500 sm:grid-cols-3 md:grid-cols-2">
            <div>
              <dt className="font-medium text-carbon-400">Email</dt>
              <dd className="truncate">{row.customerEmail}</dd>
            </div>
            <div>
              <dt className="font-medium text-carbon-400">Phone</dt>
              <dd>{row.customerPhone ?? "-"}</dd>
            </div>
            <div>
              <dt className="font-medium text-carbon-400">Updated</dt>
              <dd>{formatDateTime(row.updatedAt)}</dd>
            </div>
            <div>
              <dt className="font-medium text-carbon-400">Created</dt>
              <dd>{formatDateTime(row.createdAt)}</dd>
            </div>
          </dl>
          <RowActions
            editTarget={{ type: "repair-form", row }}
            deleteTarget={{
              type: "repair-form",
              id: row.id,
              label: `repair form ${row.id}`,
            }}
            busy={busyId === row.id}
            onEdit={onEdit}
            onDelete={onDelete}
          />
        </article>
      ))}
    </div>
  );
}
