/**
 * Shared pure helpers for the admin console (usable from both server pages
 * and "use client" components — no JSX, no server-only imports).
 */

/** AI costs are USD. Sub-dollar amounts get 4 decimals so they don't render as $0.00. */
export function formatUsd(amount: number, decimals?: number): string {
  const d =
    decimals ?? (amount !== 0 && Math.abs(amount) < 1 ? 4 : 2);
  return `$${amount.toFixed(d)}`;
}

export type ApiResult<T> =
  | { ok: true; data: T }
  | { ok: false; error: string };

/** Fetch wrapper that unwraps the standard { ok, data } / { ok, error } envelope. */
export async function apiFetch<T>(
  url: string,
  init?: RequestInit
): Promise<ApiResult<T>> {
  try {
    const res = await fetch(url, init);
    const json = (await res.json()) as {
      ok?: boolean;
      data?: T;
      error?: string;
    };
    if (res.ok && json.ok) return { ok: true, data: json.data as T };
    return { ok: false, error: json.error ?? `Request failed (${res.status})` };
  } catch {
    return { ok: false, error: "Network error — please try again." };
  }
}

/** RequestInit for a JSON body request. */
export function apiJson(method: string, body: unknown): RequestInit {
  return {
    method,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  };
}
