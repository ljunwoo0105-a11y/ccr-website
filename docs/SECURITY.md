# Security Model & Review Checklist

This document is written for the reviewing programmer. It describes the
security architecture and where to look when auditing.

## Threat model (what we defend against)

1. **Competitors scraping the price list / quotes** — the stated business
   concern. Mitigations: no prices in any public payload; estimate delivered
   by email only after identity capture; per-IP *and* per-email rate limits
   on the quote endpoint; honeypot field silently drops bots; only the
   cheapest-tier "from" price is ever disclosed in writing.
2. **Unauthorised access to staff/admin surfaces** — costs, margins,
   customer PII, AI spend.
3. **Common web attacks** — injection, XSS, CSRF, brute force, enumeration.

## Authentication & authorisation

- Sessions: HS256 JWT (`jose`) in an `httpOnly`, `sameSite=lax`, `secure`
  (prod) cookie — JS can never read it. 12-hour expiry. `src/lib/auth.ts`.
- Passwords: bcrypt cost 12. Login returns the same generic message for
  unknown email vs wrong password (no account enumeration) and is rate
  limited per IP.
- **Two-layer guard**: `src/middleware.ts` blocks `/staff`, `/admin`,
  `/api/staff`, `/api/admin` at the edge, then every handler re-validates via
  `guard()` → `requireUser()`, which re-checks the account still exists, is
  active, and has the required role *in the database*. Disabling a user takes
  effect immediately even with a live token.
- Role model: `ADMIN > STAFF`. Admin-only: AI console, reviews, user
  management, hard-deletes.

## Input handling

- Every body is parsed with `parseBody()` against a zod schema
  (`src/lib/validation.ts`) — unknown shapes are rejected before any DB call.
- SQL injection: all queries go through Prisma's parameterised client; there
  is no raw SQL in the codebase.
- XSS: React escapes all interpolated content; the only
  `dangerouslySetInnerHTML` is JSON-LD built from `JSON.stringify` of
  server-controlled data. Email HTML escapes user input via `escapeHtml`.
- CSRF: state-changing routes require the `sameSite=lax` session cookie;
  the public quote endpoint creates leads only, is rate limited, and carries
  a honeypot. Browsers cannot read responses cross-origin.

## Rate limiting & abuse

`src/lib/rate-limit.ts` (fixed-window, in-memory — swap for Redis when
scaling beyond one instance):

| Endpoint | Limit |
| --- | --- |
| `POST /api/staff/login` | 5 / 15 min / IP |
| `POST /api/public/quote` | 5 / 10 min / IP and 3 / hour / email |
| `GET /api/public/catalog` | 120 / min / IP |

Quote requests store a salted SHA-256 **hash** of the IP (abuse
correlation without retaining raw IPs).

**Deployment requirement:** `clientIp()` trusts the *rightmost*
`X-Forwarded-For` hop — the one appended by the nearest proxy. The app must
run behind a proxy/platform that sets or appends that header itself (Vercel,
Cloudflare, nginx with `proxy_set_header X-Forwarded-For
$proxy_add_x_forwarded_for`). Never expose `next start` directly to the
internet, or per-IP limits become spoofable.

## Secrets

- All secrets live in `.env` (gitignored; `.env.example` documents them).
- `ANTHROPIC_API_KEY`, SMTP credentials, `LOYVERSE_API_TOKEN`,
  `GOOGLE_PLACES_API_KEY` are read **only** inside `src/lib/**` modules that
  import `"server-only"` — the build fails if a client component pulls them in.
- The browser receives no API keys of any kind; AI/POS/Places calls are all
  server-to-server.

## Data protection

- Customer PII: quote leads + intake records are staff-gated; staff/admin
  pages send `X-Robots-Tag: noindex` and `Cache-Control: no-store`
  (next.config.mjs).
- Password hashes are never selected in any API response (check
  `/api/admin/users`).
- Device passcodes are deliberately NOT collected in intake (only IMEI/serial
  — passcodes on paper if ever needed).

## Headers

`next.config.mjs`: `X-Frame-Options: DENY`, `X-Content-Type-Options:
nosniff`, `Referrer-Policy: strict-origin-when-cross-origin`, restricted
`Permissions-Policy`, plus the staff/admin no-index/no-store pair.

## AI-specific safety

- Budget cap: when `blockAtCap` is on, `trackedMessage()` refuses calls once
  the month's logged spend reaches the cap (`AiBudgetError` → HTTP 402), so a
  bug or abuse can't run up the API bill.
- Web-search agent output is parsed defensively (`extractJson`) and clamped;
  a deterministic margin fallback exists when parsing fails.
- AI endpoints are staff-gated; nothing AI-related is publicly reachable.

## Audit checklist for the reviewer

- [ ] `git grep -n "sellPrice\|costPrice" src/app/api/public src/app/(public)`
      → must show no price ever serialised to the public client
- [ ] Every handler under `src/app/api/staff|admin` starts with `guard(...)`
- [ ] `middleware.ts` matcher covers all four protected prefixes
- [ ] No new dependency added without review (`package.json` is short on purpose)
- [ ] `.env` not committed; `AUTH_SECRET` rotated for production
- [ ] Set up DB backups + restore drill for the production database
- [ ] (When scaling to >1 instance) move rate limiting to a shared store
