"use client";

import { useCallback, useEffect, useState } from "react";
import { RefreshCw } from "lucide-react";
import { cn } from "@/lib/utils";
import { apiFetch } from "@/components/admin/shared";
import {
  buildRecordActionRequest,
  type IntakeListRow,
  type IntakePatch,
  type RepairFormListRow,
  type RepairFormPatch,
} from "@/components/admin/records-state";
import { RecordsDeleteModal, type DeleteTarget } from "./records-delete-modal";
import { RecordsEditModal, type EditTarget } from "./records-edit-modal";
import { IntakeRows, RepairFormRows } from "./records-list";

type Tab = "intakes" | "repair-forms";

type DeleteDialogState = {
  readonly target: DeleteTarget | null;
  readonly text: string;
  readonly error: string | null;
};

const closedDeleteDialog: DeleteDialogState = {
  target: null,
  text: "",
  error: null,
};

export function RecordsManager() {
  const [tab, setTab] = useState<Tab>("intakes");
  const [intakes, setIntakes] = useState<readonly IntakeListRow[] | null>(null);
  const [forms, setForms] = useState<readonly RepairFormListRow[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [editTarget, setEditTarget] = useState<EditTarget | null>(null);
  const [deleteDialog, setDeleteDialog] =
    useState<DeleteDialogState>(closedDeleteDialog);

  const load = useCallback(async () => {
    const [intakeResult, formResult] = await Promise.all([
      apiFetch<readonly IntakeListRow[]>("/api/admin/records/intakes"),
      apiFetch<readonly RepairFormListRow[]>("/api/admin/records/repair-forms"),
    ]);
    const errors: string[] = [];
    if (!intakeResult.ok) {
      errors.push(`Intakes: ${intakeResult.error}`);
      setIntakes((current) => current ?? []);
    }
    if (!formResult.ok) {
      errors.push(`Repair forms: ${formResult.error}`);
      setForms((current) => current ?? []);
    }
    if (intakeResult.ok) setIntakes(intakeResult.data);
    if (formResult.ok) setForms(formResult.data);
    setError(errors.length > 0 ? errors.join(" ") : null);
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function submitEdit(patch: IntakePatch | RepairFormPatch) {
    if (!editTarget) return;
    setBusyId(editTarget.row.id);
    setActionError(null);
    const request = buildRecordActionRequest({
      type: editTarget.type,
      id: editTarget.row.id,
      action: { kind: "patch", patch },
    });
    const result = await apiFetch<unknown>(request.url, request.init);
    setBusyId(null);
    if (!result.ok) {
      setActionError(result.error);
      return;
    }
    setEditTarget(null);
    await load();
  }

  async function confirmDelete() {
    const target = deleteDialog.target;
    if (!target) return;
    setBusyId(target.id);
    setDeleteDialog((current) => ({ ...current, error: null }));
    const request = buildRecordActionRequest({
      type: target.type,
      id: target.id,
      action: { kind: "delete" },
    });
    const result = await apiFetch<{ readonly deleted: boolean }>(
      request.url,
      request.init
    );
    setBusyId(null);
    if (!result.ok) {
      setDeleteDialog((current) =>
        current.target?.id === target.id
          ? { ...current, error: result.error }
          : current
      );
      return;
    }
    setDeleteDialog(closedDeleteDialog);
    await load();
  }

  function openDelete(target: DeleteTarget) {
    setDeleteDialog({ target, text: "", error: null });
  }

  const loading = tab === "intakes" ? intakes === null : forms === null;

  return (
    <section className="card p-0">
      <div className="flex flex-col gap-3 border-b border-carbon-150 px-6 py-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="text-base font-semibold text-carbon-950">
            Records manager
          </h2>
          <p className="mt-0.5 text-sm text-carbon-500">
            Edit operational statuses and remove bad records with confirmation.
          </p>
        </div>
        <button type="button" className="btn-ghost px-3 py-2" onClick={load}>
          <RefreshCw className="h-4 w-4" aria-hidden />
          Refresh
        </button>
      </div>
      <div className="border-b border-carbon-150 px-6 py-3">
        <div className="inline-flex max-w-full rounded-md border border-carbon-150 bg-bone-100 p-1">
          <TabButton active={tab === "intakes"} onClick={() => setTab("intakes")}>
            Intakes
          </TabButton>
          <TabButton
            active={tab === "repair-forms"}
            onClick={() => setTab("repair-forms")}
          >
            Repair forms
          </TabButton>
        </div>
      </div>
      {error && (
        <p className="border-b border-rose-200/60 bg-rose-50 px-6 py-3 text-sm text-rose-700">
          {error}
        </p>
      )}
      {loading ? (
        <p className="px-6 py-8 text-sm text-carbon-500">
          {tab === "intakes" ? "Loading intakes..." : "Loading repair forms..."}
        </p>
      ) : tab === "intakes" ? (
        <IntakeRows
          rows={intakes ?? []}
          busyId={busyId}
          onEdit={setEditTarget}
          onDelete={openDelete}
        />
      ) : (
        <RepairFormRows
          rows={forms ?? []}
          busyId={busyId}
          onEdit={setEditTarget}
          onDelete={openDelete}
        />
      )}
      {editTarget && (
        <RecordsEditModal
          target={editTarget}
          busy={busyId === editTarget.row.id}
          error={actionError}
          onCancel={() => setEditTarget(null)}
          onSubmit={submitEdit}
        />
      )}
      {deleteDialog.target && (
        <RecordsDeleteModal
          target={deleteDialog.target}
          value={deleteDialog.text}
          busy={busyId === deleteDialog.target.id}
          error={deleteDialog.error}
          onValue={(text) =>
            setDeleteDialog((current) => ({ ...current, text }))
          }
          onCancel={() => setDeleteDialog(closedDeleteDialog)}
          onConfirm={confirmDelete}
        />
      )}
    </section>
  );
}

function TabButton({
  active,
  onClick,
  children,
}: {
  readonly active: boolean;
  readonly onClick: () => void;
  readonly children: string;
}) {
  return (
    <button
      type="button"
      className={cn(
        "rounded px-3 py-1.5 text-sm font-medium transition",
        active ? "bg-carbon-950 text-bone-50" : "text-carbon-600 hover:bg-bone-50"
      )}
      onClick={onClick}
    >
      {children}
    </button>
  );
}
