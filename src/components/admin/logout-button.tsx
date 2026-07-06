"use client";

import { useState } from "react";
import { LogOut } from "lucide-react";

export function LogoutButton() {
  const [busy, setBusy] = useState(false);

  async function logout() {
    setBusy(true);
    try {
      await fetch("/api/staff/logout", { method: "POST" });
    } catch {
      // Cookie may already be gone — still send them to the login screen.
    }
    window.location.href = "/staff/login";
  }

  return (
    <button
      type="button"
      onClick={logout}
      disabled={busy}
      className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-slate-400 transition hover:bg-slate-800/60 hover:text-slate-200 focus:outline-none focus:ring-2 focus:ring-slate-600 disabled:opacity-50"
    >
      <LogOut className="h-4 w-4" aria-hidden />
      {busy ? "Signing out…" : "Log out"}
    </button>
  );
}
