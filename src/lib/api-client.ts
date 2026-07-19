/**
 * Browser-safe request helpers. No server-only imports so this is importable
 * from both server pages and "use client" components.
 */

/** RequestInit for a JSON body request. */
export function apiJson(method: string, body: unknown): RequestInit {
  return {
    method,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  };
}
