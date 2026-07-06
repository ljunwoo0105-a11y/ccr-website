"use client";

import { useState } from "react";
import { LogOut } from "lucide-react";

export default function LogoutButton() {
  const [busy, setBusy] = useState(false);

  async function handleLogout() {
    setBusy(true);
    try {
      await fetch("/api/staff/logout", { method: "POST" });
    } finally {
      window.location.href = "/staff/login";
    }
  }

  return (
    <button
      type="button"
      onClick={handleLogout}
      disabled={busy}
      className="inline-flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-slate-300 transition hover:bg-slate-800 hover:text-white disabled:opacity-50"
    >
      <LogOut className="h-4 w-4" aria-hidden />
      {busy ? "Signing out…" : "Logout"}
    </button>
  );
}
