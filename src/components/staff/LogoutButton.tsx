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
      className="inline-flex w-full items-center gap-2 px-3 py-2 text-sm font-medium text-bone-100/70 transition-colors hover:bg-carbon-900 hover:text-bone-100 disabled:opacity-50"
    >
      <LogOut className="h-4 w-4" aria-hidden />
      {busy ? "Signing out…" : "Logout"}
    </button>
  );
}
