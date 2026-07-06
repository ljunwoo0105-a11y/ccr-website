import "server-only";
import { createHash } from "crypto";

/**
 * Fixed-window in-memory rate limiter.
 *
 * Suitable for a single-instance deployment. If the site is ever scaled to
 * multiple instances, replace the Map with a shared store (Redis/Upstash) —
 * the call sites won't need to change.
 */

type Bucket = { count: number; resetAt: number };
const buckets = new Map<string, Bucket>();

const MAX_BUCKETS = 10_000;

function sweep(now: number) {
  if (buckets.size < MAX_BUCKETS) return;
  // First reclaim everything already expired.
  for (const [key, bucket] of buckets) {
    if (bucket.resetAt <= now) buckets.delete(key);
  }
  // Hard cap: if still at/over the ceiling (many live windows), evict the
  // oldest-expiring entries so the Map can never grow unbounded.
  if (buckets.size >= MAX_BUCKETS) {
    const byOldest = [...buckets.entries()].sort(
      (a, b) => a[1].resetAt - b[1].resetAt
    );
    const evict = buckets.size - MAX_BUCKETS + 1;
    for (let i = 0; i < evict; i++) buckets.delete(byOldest[i]![0]);
  }
}

export function rateLimit(
  key: string,
  limit: number,
  windowMs: number
): { ok: boolean; retryAfterSeconds: number } {
  const now = Date.now();
  sweep(now);
  const bucket = buckets.get(key);
  if (!bucket || bucket.resetAt <= now) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return { ok: true, retryAfterSeconds: 0 };
  }
  bucket.count += 1;
  if (bucket.count > limit) {
    return {
      ok: false,
      retryAfterSeconds: Math.ceil((bucket.resetAt - now) / 1000),
    };
  }
  return { ok: true, retryAfterSeconds: 0 };
}

/**
 * Client IP for rate-limit keys.
 *
 * X-Forwarded-For is client-influenced: clients can SEND a fake value, and
 * proxies APPEND the address they actually saw — so the only hop the nearest
 * trusted proxy vouches for is the RIGHTMOST one. Taking the leftmost hop
 * (the common mistake, CWE-348) would let an attacker rotate spoofed IPs and
 * dodge every per-IP limit with a single header.
 *
 * Deployment requirement (see docs/SECURITY.md): run behind a proxy/platform
 * that sets or appends X-Forwarded-For itself (Vercel, nginx, Cloudflare all
 * do). If the Node server is exposed directly, both headers are spoofable —
 * don't deploy it that way.
 */
export function clientIp(req: Request): string {
  const fwd = req.headers.get("x-forwarded-for");
  if (fwd) {
    const hops = fwd.split(",");
    return hops[hops.length - 1]!.trim();
  }
  return req.headers.get("x-real-ip") ?? "";
}

/** Privacy-preserving IP hash for abuse review — raw IPs are never stored. */
export function hashIp(ip: string): string {
  if (!ip) return "";
  return createHash("sha256")
    .update(ip + (process.env.AUTH_SECRET ?? ""))
    .digest("hex")
    .slice(0, 32);
}
