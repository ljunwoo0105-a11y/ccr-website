"use client";

import { useCallback, useEffect, useState } from "react";
import {
  Check,
  Copy,
  KeyRound,
  Plus,
  ShieldCheck,
  UserCheck,
  UserX,
  X,
} from "lucide-react";
import { cn, formatDate } from "@/lib/utils";
import { Modal } from "@/components/admin/modal";
import { apiFetch, apiJson } from "@/components/admin/shared";

interface AdminUser {
  id: string;
  name: string;
  email: string;
  role: string;
  active: boolean;
  createdAt: string;
}

interface Reveal {
  kind: "created" | "reset";
  name: string;
  email: string;
  tempPassword: string;
}

interface AddForm {
  name: string;
  email: string;
  role: "ADMIN" | "STAFF";
}

const EMPTY_ADD_FORM: AddForm = { name: "", email: "", role: "STAFF" };

export function UsersManager({ currentUserId }: { currentUserId: string }) {
  const [users, setUsers] = useState<AdminUser[] | null>(null);
  const [listError, setListError] = useState<string | null>(null);
  const [addForm, setAddForm] = useState<AddForm | null>(null);
  const [addError, setAddError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [reveal, setReveal] = useState<Reveal | null>(null);
  const [copied, setCopied] = useState(false);

  const load = useCallback(async () => {
    const result = await apiFetch<AdminUser[]>("/api/admin/users");
    if (result.ok) {
      setUsers(result.data);
      setListError(null);
    } else {
      setListError(result.error);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function createUser() {
    if (!addForm) return;
    if (!addForm.name.trim() || !addForm.email.trim()) {
      setAddError("Name and email are required");
      return;
    }
    setBusy(true);
    setAddError(null);
    const result = await apiFetch<{ user: AdminUser; tempPassword: string }>(
      "/api/admin/users",
      apiJson("POST", {
        name: addForm.name.trim(),
        email: addForm.email.trim(),
        role: addForm.role,
      })
    );
    setBusy(false);
    if (!result.ok) {
      setAddError(result.error);
      return;
    }
    setAddForm(null);
    setCopied(false);
    setReveal({
      kind: "created",
      name: result.data.user.name,
      email: result.data.user.email,
      tempPassword: result.data.tempPassword,
    });
    await load();
  }

  async function resetPassword(u: AdminUser) {
    if (
      !window.confirm(
        `Reset the password for ${u.email}? Their current password stops working immediately.`
      )
    ) {
      return;
    }
    setBusyId(u.id);
    const result = await apiFetch<{ tempPassword: string }>(
      `/api/admin/users/${u.id}/reset-password`,
      { method: "POST" }
    );
    setBusyId(null);
    if (!result.ok) {
      setListError(result.error);
      return;
    }
    setCopied(false);
    setReveal({
      kind: "reset",
      name: u.name,
      email: u.email,
      tempPassword: result.data.tempPassword,
    });
  }

  async function patchUser(
    u: AdminUser,
    patch: { active?: boolean; role?: "ADMIN" | "STAFF" }
  ) {
    setBusyId(u.id);
    const result = await apiFetch<AdminUser>(
      `/api/admin/users/${u.id}`,
      apiJson("PATCH", patch)
    );
    setBusyId(null);
    if (!result.ok) {
      setListError(result.error);
      return;
    }
    setListError(null);
    await load();
  }

  async function copyPassword() {
    if (!reveal) return;
    try {
      await navigator.clipboard.writeText(reveal.tempPassword);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      setListError("Couldn't copy — select the password and copy it manually.");
    }
  }

  return (
    <div className="space-y-6">
      {reveal && (
        <section
          className="card border-emerald-200 bg-emerald-50"
          role="status"
        >
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 className="text-base font-semibold text-emerald-900">
                {reveal.kind === "created"
                  ? `Account created for ${reveal.name}`
                  : `Password reset for ${reveal.name}`}
              </h2>
              <p className="mt-1 text-sm text-emerald-800">
                Temporary password for{" "}
                <span className="font-medium">{reveal.email}</span> — save this
                now, it won&apos;t be shown again.
              </p>
              <div className="mt-3 flex items-center gap-2">
                <code className="rounded-lg border border-emerald-200 bg-white px-3 py-2 font-mono text-sm text-slate-900">
                  {reveal.tempPassword}
                </code>
                <button
                  type="button"
                  className="btn-ghost px-3 py-2"
                  onClick={copyPassword}
                >
                  {copied ? (
                    <>
                      <Check className="h-4 w-4 text-emerald-600" aria-hidden />
                      Copied
                    </>
                  ) : (
                    <>
                      <Copy className="h-4 w-4" aria-hidden />
                      Copy
                    </>
                  )}
                </button>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setReveal(null)}
              aria-label="Dismiss temporary password"
              className="rounded p-1 text-emerald-700 transition hover:bg-emerald-100"
            >
              <X className="h-5 w-5" aria-hidden />
            </button>
          </div>
        </section>
      )}

      <section className="card p-0">
        <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
          <h2 className="text-base font-semibold text-slate-900">Accounts</h2>
          <button
            type="button"
            className="btn-primary"
            onClick={() => {
              setAddError(null);
              setAddForm(EMPTY_ADD_FORM);
            }}
          >
            <Plus className="h-4 w-4" aria-hidden />
            Add user
          </button>
        </div>

        {listError && (
          <p className="border-b border-red-100 bg-red-50 px-6 py-3 text-sm text-red-700">
            {listError}
          </p>
        )}

        {users === null ? (
          <p className="px-6 py-8 text-sm text-slate-500">Loading users…</p>
        ) : users.length === 0 ? (
          <p className="px-6 py-8 text-sm text-slate-500">No accounts yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-slate-200 text-xs uppercase tracking-wide text-slate-400">
                  <th className="px-6 py-3 font-medium">Name</th>
                  <th className="px-4 py-3 font-medium">Email</th>
                  <th className="px-4 py-3 font-medium">Role</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                  <th className="px-4 py-3 font-medium">Created</th>
                  <th className="px-4 py-3 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map((u) => {
                  const isSelf = u.id === currentUserId;
                  const rowBusy = busyId === u.id;
                  return (
                    <tr
                      key={u.id}
                      className="border-b border-slate-100 last:border-0"
                    >
                      <td className="whitespace-nowrap px-6 py-3 font-medium text-slate-900">
                        {u.name}
                        {isSelf && (
                          <span className="ml-2 text-xs font-normal text-slate-400">
                            (you)
                          </span>
                        )}
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 text-slate-600">
                        {u.email}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={cn(
                            "inline-flex rounded-full px-2 py-0.5 text-xs font-medium",
                            u.role === "ADMIN"
                              ? "bg-orange-100 text-orange-700"
                              : "bg-blue-100 text-blue-700"
                          )}
                        >
                          {u.role}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={cn(
                            "inline-flex rounded-full px-2 py-0.5 text-xs font-medium",
                            u.active
                              ? "bg-emerald-100 text-emerald-700"
                              : "bg-slate-100 text-slate-500"
                          )}
                        >
                          {u.active ? "active" : "inactive"}
                        </span>
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 text-slate-500">
                        {formatDate(u.createdAt)}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex flex-wrap items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => resetPassword(u)}
                            disabled={rowBusy}
                            className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-2 py-1 text-xs font-medium text-slate-600 transition hover:bg-slate-50 disabled:opacity-50"
                          >
                            <KeyRound className="h-3.5 w-3.5" aria-hidden />
                            Reset password
                          </button>
                          <button
                            type="button"
                            onClick={() =>
                              patchUser(u, { active: !u.active })
                            }
                            disabled={rowBusy || (isSelf && u.active)}
                            title={
                              isSelf && u.active
                                ? "You can't deactivate your own account"
                                : undefined
                            }
                            className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-2 py-1 text-xs font-medium text-slate-600 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
                          >
                            {u.active ? (
                              <>
                                <UserX className="h-3.5 w-3.5" aria-hidden />
                                Deactivate
                              </>
                            ) : (
                              <>
                                <UserCheck
                                  className="h-3.5 w-3.5"
                                  aria-hidden
                                />
                                Activate
                              </>
                            )}
                          </button>
                          <button
                            type="button"
                            onClick={() =>
                              patchUser(u, {
                                role: u.role === "ADMIN" ? "STAFF" : "ADMIN",
                              })
                            }
                            disabled={rowBusy || (isSelf && u.role === "ADMIN")}
                            title={
                              isSelf && u.role === "ADMIN"
                                ? "You can't demote your own account"
                                : undefined
                            }
                            className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-2 py-1 text-xs font-medium text-slate-600 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
                          >
                            <ShieldCheck className="h-3.5 w-3.5" aria-hidden />
                            {u.role === "ADMIN" ? "Make staff" : "Make admin"}
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {addForm && (
        <Modal title="Add user" onClose={() => setAddForm(null)}>
          <form
            className="space-y-4"
            onSubmit={(e) => {
              e.preventDefault();
              void createUser();
            }}
          >
            <div>
              <label className="label" htmlFor="user-name">
                Full name
              </label>
              <input
                id="user-name"
                className="input"
                value={addForm.name}
                onChange={(e) =>
                  setAddForm({ ...addForm, name: e.target.value })
                }
                required
              />
            </div>
            <div>
              <label className="label" htmlFor="user-email">
                Email
              </label>
              <input
                id="user-email"
                className="input"
                type="email"
                value={addForm.email}
                onChange={(e) =>
                  setAddForm({ ...addForm, email: e.target.value })
                }
                required
              />
            </div>
            <div>
              <label className="label" htmlFor="user-role">
                Role
              </label>
              <select
                id="user-role"
                className="input"
                value={addForm.role}
                onChange={(e) =>
                  setAddForm({
                    ...addForm,
                    role: e.target.value === "ADMIN" ? "ADMIN" : "STAFF",
                  })
                }
              >
                <option value="STAFF">Staff — portal access only</option>
                <option value="ADMIN">Admin — full console access</option>
              </select>
            </div>
            <p className="rounded-lg bg-slate-50 px-3 py-2 text-xs text-slate-500">
              A temporary 12-character password is generated automatically and
              shown once after the account is created.
            </p>

            {addError && (
              <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
                {addError}
              </p>
            )}

            <div className="flex justify-end gap-3 pt-2">
              <button
                type="button"
                className="btn-ghost"
                onClick={() => setAddForm(null)}
              >
                Cancel
              </button>
              <button type="submit" className="btn-primary" disabled={busy}>
                {busy ? "Creating…" : "Create account"}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
