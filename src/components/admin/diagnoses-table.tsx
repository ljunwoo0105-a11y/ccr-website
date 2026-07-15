"use client";

import { Pencil, PowerOff, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import type { DiagnosisRule } from "./diagnoses-types";
import { diagnosisColumns, diagnosisScope } from "./diagnoses-state";

type DiagnosisTableProps = {
  readonly records: readonly DiagnosisRule[];
  readonly busyId: string | null;
  readonly onEdit: (record: DiagnosisRule) => void;
  readonly onDeactivate: (record: DiagnosisRule) => void;
  readonly onHardDelete: (record: DiagnosisRule) => void;
};

function ActiveBadge({ active }: { readonly active: boolean }) {
  return (
    <span
      className={cn(
        "inline-flex rounded-full px-2 py-0.5 text-xs font-medium",
        active ? "border border-emerald-500/50 bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-500"
      )}
    >
      {active ? "Active" : "Inactive"}
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
  readonly record: DiagnosisRule;
  readonly busy: boolean;
  readonly onEdit: (record: DiagnosisRule) => void;
  readonly onDeactivate: (record: DiagnosisRule) => void;
  readonly onHardDelete: (record: DiagnosisRule) => void;
}) {
  return (
    <div className="flex flex-wrap gap-2">
      <button
        type="button"
        className="btn-ghost px-3 py-2"
        onClick={() => onEdit(record)}
        aria-label={`Edit ${record.symptomCode}`}
      >
        <Pencil className="h-4 w-4" aria-hidden />
        Edit
      </button>
      <button
        type="button"
        className="btn-ghost px-3 py-2"
        disabled={busy || !record.active}
        onClick={() => onDeactivate(record)}
        aria-label={`Deactivate ${record.symptomCode}`}
      >
        <PowerOff className="h-4 w-4" aria-hidden />
        Deactivate
      </button>
      <button
        type="button"
        className="btn-ghost px-3 py-2 text-rose-700"
        disabled={busy || record.active}
        onClick={() => onHardDelete(record)}
        aria-label={`Permanently delete ${record.symptomCode}`}
      >
        <Trash2 className="h-4 w-4" aria-hidden />
        Delete
      </button>
    </div>
  );
}

export function DiagnosesTable({
  records,
  busyId,
  onEdit,
  onDeactivate,
  onHardDelete,
}: DiagnosisTableProps) {
  return (
    <>
      <div className="hidden overflow-x-auto md:block">
        <table className="w-full min-w-[760px] text-left text-sm">
          <thead>
            <tr className="border-b border-carbon-150 text-xs uppercase tracking-wide text-carbon-400">
              {diagnosisColumns.map((column) => (
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
                <td className="px-4 py-3 first:pl-6 text-carbon-700">{diagnosisScope(record)}</td>
                <td className="px-4 py-3">
                  <span className="font-medium text-carbon-950">{record.symptomLabel}</span>
                  <span className="block font-mono text-xs text-carbon-400">{record.symptomCode}</span>
                </td>
                <td className="px-4 py-3 font-mono text-xs text-carbon-700">{record.repairType}</td>
                <td className="px-4 py-3 text-carbon-700">{record.outcome}</td>
                <td className="px-4 py-3 text-carbon-700">{record.priority}</td>
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
                <p className="font-medium text-carbon-950">{record.symptomLabel}</p>
                <p className="break-all font-mono text-xs text-carbon-400">{record.symptomCode}</p>
              </div>
              <ActiveBadge active={record.active} />
            </div>
            <dl className="grid grid-cols-2 gap-2 text-sm">
              <dt className="text-carbon-400">Scope</dt>
              <dd className="text-carbon-700">{diagnosisScope(record)}</dd>
              <dt className="text-carbon-400">Repair</dt>
              <dd className="font-mono text-xs text-carbon-700">{record.repairType}</dd>
              <dt className="text-carbon-400">Outcome</dt>
              <dd className="text-carbon-700">{record.outcome}</dd>
              <dt className="text-carbon-400">Priority</dt>
              <dd className="text-carbon-700">{record.priority}</dd>
            </dl>
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
