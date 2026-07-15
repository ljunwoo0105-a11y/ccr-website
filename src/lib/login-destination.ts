const SAFE_ROOT = "http://ccr.local";

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
  if (url.pathname === "/staff" || url.pathname.startsWith("/staff/")) {
    return url.pathname + url.search + url.hash;
  }
  if (url.pathname === "/admin" || url.pathname.startsWith("/admin/")) {
    return url.pathname + url.search + url.hash;
  }
  return null;
}
