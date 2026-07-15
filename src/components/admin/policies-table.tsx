"use client";

import { Pencil, PowerOff, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Policy } from "./policies-types";
import { policyColumns } from "./policies-state";

type PoliciesTableProps = {
  readonly records: readonly Policy[];
  readonly busyId: string | null;
  readonly onEdit: (record: Policy) => void;
  readonly onDeactivate: (record: Policy) => void;
  readonly onHardDelete: (record: Policy) => void;
};

function ActiveBadge({ active }: { readonly active: boolean }) {
  return (
    <span
      className={cn(
        "inline-flex rounded-full px-2 py-0.5 text-xs font-medium",
        active ? "border border-emerald-500/50 bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-500"
      )}
    >
      {active ? "Current" : "Inactive"}
    </span>
  );
}

function ActionButtons({
  record,
  busy,
  onEdit,
  onDeactivate,
  onHardDelete,
}: {
  readonly record: Policy;
  readonly busy: boolean;
  readonly onEdit: (record: Policy) => void;
  readonly onDeactivate: (record: Policy) => void;
  readonly onHardDelete: (record: Policy) => void;
}) {
  return (
    <div className="flex flex-wrap gap-2">
      <button
        type="button"
        className="btn-ghost px-3 py-2"
        onClick={() => onEdit(record)}
        aria-label={`Edit ${record.category} ${record.version}`}
      >
        <Pencil className="h-4 w-4" aria-hidden />
        Edit
      </button>
      <button
        type="button"
        className="btn-ghost px-3 py-2"
        disabled={busy || !record.active}
        onClick={() => onDeactivate(record)}
        aria-label={`Deactivate ${record.category} ${record.version}`}
      >
        <PowerOff className="h-4 w-4" aria-hidden />
        Deactivate
      </button>
      <button
        type="button"
        className="btn-ghost px-3 py-2 text-rose-700"
        disabled={busy || record.active}
        onClick={() => onHardDelete(record)}
        aria-label={`Permanently delete ${record.category} ${record.version}`}
      >
        <Trash2 className="h-4 w-4" aria-hidden />
        Delete
      </button>
    </div>
  );
}

export function PoliciesTable({
  records,
  busyId,
  onEdit,
  onDeactivate,
  onHardDelete,
}: PoliciesTableProps) {
  return (
    <>
      <div className="hidden overflow-x-auto md:block">
        <table className="w-full min-w-[720px] text-left text-sm">
          <thead>
            <tr className="border-b border-carbon-150 text-xs uppercase tracking-wide text-carbon-400">
              {policyColumns.map((column) => (
                <th key={column} className="px-4 py-3 font-medium first:pl-6">
                  {column}
                </th>
              ))}
              <th className="px-4 py-3 font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {records.map((record) => (
              <tr key={record.id} className="border-b border-carbon-150 last:border-0">
                <td className="px-4 py-3 first:pl-6 font-mono text-xs text-carbon-700">
                  {record.category}
                </td>
                <td className="px-4 py-3 font-mono text-xs text-carbon-700">{record.version}</td>
                <td className="px-4 py-3 text-carbon-950">{record.title}</td>
                <td className="px-4 py-3"><ActiveBadge active={record.active} /></td>
                <td className="px-4 py-3">
                  <ActionButtons
                    record={record}
                    busy={busyId === record.id}
                    onEdit={onEdit}
                    onDeactivate={onDeactivate}
                    onHardDelete={onHardDelete}
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="divide-y divide-carbon-150 md:hidden">
        {records.map((record) => (
          <div key={record.id} className="space-y-3 px-4 py-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="font-medium text-carbon-950">{record.title}</p>
                <p className="font-mono text-xs text-carbon-400">
                  {record.category} / {record.version}
                </p>
              </div>
              <ActiveBadge active={record.active} />
            </div>
            <p className="line-clamp-3 text-sm text-carbon-500">{record.body}</p>
            <ActionButtons
              record={record}
              busy={busyId === record.id}
              onEdit={onEdit}
              onDeactivate={onDeactivate}
              onHardDelete={onHardDelete}
            />
          </div>
        ))}
      </div>
    </>
  );
}
