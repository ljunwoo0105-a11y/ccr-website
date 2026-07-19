"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import type { ApiEnvelope } from "@/components/staff/types";
import {
  defaultLoginDestination,
  safeLoginDestination,
} from "@/lib/login-destination";

interface Props {
  /** Optional ?next= destination passed through from the login page. */
  next?: string;
  /** Server-rendered error (no-JS form fallback redirects with ?error=). */
  initialError?: string | null;
}

export default function LoginForm({ next, initialError }: Props) {
  const router = useRouter();
  const safeNext = safeLoginDestination(next) ?? "";
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(initialError ?? null);
  const [busy, setBusy] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setBusy(true);
    try {
      const res = await fetch("/api/staff/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password, next: safeNext }),
      });
      const json = (await res.json()) as ApiEnvelope<{ role: string }>;
      if (!res.ok || !json.ok) {
        setError(json.error ?? "Login failed — try again");
        setBusy(false);
        return;
      }
      const dest =
        safeNext || defaultLoginDestination(json.data?.role ?? "STAFF");
      router.push(dest);
      router.refresh();
    } catch {
      setError("Network error — check your connection and try again");
      setBusy(false);
    }
  }

  return (
    <form
      action="/api/staff/login"
      method="post"
      onSubmit={handleSubmit}
      className="space-y-5"
      noValidate
    >
      {safeNext && <input type="hidden" name="next" value={safeNext} />}
      {error && (
        <p
          role="alert"
          className="border border-rose-500/70 bg-rose-50 px-3 py-2 font-mono text-xs text-rose-700"
        >
          {error}
        </p>
      )}
      <div>
        <label htmlFor="staff-email" className="label">
          Email
        </label>
        <input
          id="staff-email"
          name="email"
          type="email"
          autoComplete="email"
          required
          className="input"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
      </div>
      <div>
        <label htmlFor="staff-password" className="label">
          Password
        </label>
        <input
          id="staff-password"
          name="password"
          type="password"
          autoComplete="current-password"
          required
          className="input"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
      </div>
      <button type="submit" className="btn-primary w-full" disabled={busy}>
        {busy && <Loader2 className="h-4 w-4 animate-spin" aria-hidden />}
        {busy ? "Signing in…" : "Sign in"}
      </button>
      <p className="font-mono text-[11px] uppercase tracking-[0.08em] text-carbon-500">
        Staff access only. Contact the owner for an account.
      </p>
    </form>
  );
}
