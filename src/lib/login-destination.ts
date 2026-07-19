const SAFE_ROOT = "http://ccr.local";

/**
 * Where a fresh login lands when no explicit `next` was requested.
 * Admins get the back-office console; staff get the public landing page,
 * where the pricing section unlocks for their session.
 */
export function defaultLoginDestination(role: string): string {
  return role === "ADMIN" ? "/admin" : "/";
}

export function safeLoginDestination(value: string | null | undefined): string | null {
  if (!value) return null;
  const trimmed = value.trim();
  if (!trimmed || trimmed.includes("\\") || !trimmed.startsWith("/") || trimmed.startsWith("//")) {
    return null;
  }

  const path = trimmed.split(/[?#]/, 1)[0] ?? "";
  if (path.includes("%")) return null;

  let url: URL;
  try {
    url = new URL(trimmed, SAFE_ROOT);
  } catch {
    return null;
  }

  if (url.origin !== SAFE_ROOT) return null;
  if (url.pathname === "/") return url.pathname + url.search + url.hash;
  // A finished login must never land back on the login form.
  if (url.pathname === "/staff/login") return null;
  if (url.pathname === "/staff" || url.pathname.startsWith("/staff/")) {
    return url.pathname + url.search + url.hash;
  }
  if (url.pathname === "/admin" || url.pathname.startsWith("/admin/")) {
    return url.pathname + url.search + url.hash;
  }
  return null;
}
