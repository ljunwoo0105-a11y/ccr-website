# CCR Website — Build Contracts

Read this before writing any code in this repo. The foundation (configs,
Prisma schema, `src/lib/**`, `src/middleware.ts`, root layout, seed) is
already built — build on top of it, never modify it.

## Stack

Next.js 14 App Router + TypeScript (strict) + Tailwind CSS + Prisma (SQLite
dev) + zod + jose + bcryptjs + nodemailer + @anthropic-ai/sdk + lucide-react.
**Do not add npm dependencies.** Path alias `@/*` → `src/*`.

## Non-negotiable product rules

1. **Part prices NEVER reach the public client.** No public API response,
   page payload, or HTML may contain sell/cost prices or the price list.
   Quote estimates are emailed only (cheapest tier, "from $X"). Competitor
   Mobile Experts ships its full price list in page source — that mistake is
   the reason this rule exists.
2. **Public reviews: only `visible=true AND rating=5`**, always through
   `getPublicReviews()` / `getAggregateRating()` in `src/lib/google-reviews.ts`.
3. **Business facts come from `BUSINESS` in `src/lib/config.ts`.** Never
   hardcode contact details. The old site's "(07) 3000-COOL",
   "info@coolcaserepair.com.au" and "7am–9pm daily" are FABRICATED — banned.
4. Every API input is validated with the zod schemas in
   `src/lib/validation.ts` via `parseBody()` from `src/lib/api.ts`.
5. Every protected handler starts with `const { user, error } = await guard()`
   (`guard("ADMIN")` for admin routes) and returns `error` when set —
   middleware alone is not sufficient.
6. Secrets (`ANTHROPIC_API_KEY`, SMTP, POS tokens, Places key) are read only
   inside `src/lib/**` server modules. Never in client components.

## Shared helpers (use these, don't reinvent)

| Module | Provides |
| --- | --- |
| `@/lib/db` | `db` (Prisma), `getSetting`, `setSetting` |
| `@/lib/auth` | `requireUser`, `getSession`, `createSessionToken`, `verifyPassword`, `hashPassword`, `SESSION_COOKIE`, `sessionCookieOptions()` |
| `@/lib/api` | `ok(data)`, `fail(msg, status)`, `parseBody(req, schema)`, `guard(minRole)` |
| `@/lib/validation` | all zod schemas (quote, login, part, intake, reviews, AI) |
| `@/lib/rate-limit` | `rateLimit(key, limit, windowMs)`, `clientIp(req)`, `hashIp(ip)` |
| `@/lib/email` | `sendEmail`, `renderQuoteEmail` |
| `@/lib/config` | `BUSINESS`, `SITE_URL`, `DEVICE_TYPES`, `PART_QUALITIES`, `QUALITY_LABELS`, `QUALITY_DEFAULT_WARRANTY`, `REFERRAL_SOURCES` |
| `@/lib/utils` | `cn`, `formatAud`, `formatDate`, `formatDateTime` |
| `@/lib/ai/client` | `trackedMessage`, `monthSpendUsd`, `computeCostUsd`, `getModelPricing`, `AiBudgetError`, `AiConfigError` |
| `@/lib/ai/pricing` | `recommendPricing(ctx)` → market research + margin agents |
| `@/lib/pos` | `getPosAdapter()`, `syncInventoryFromPos()` |
| `@/lib/google-reviews` | `syncGoogleReviews`, `getPublicReviews`, `getAggregateRating` |

## API envelope

Success: `{ ok: true, data: ... }` · Error: `{ ok: false, error: "message" }`.
Client code checks `res.ok && json.ok`.

## Styling

Tailwind only. Reusable classes already defined in `src/app/globals.css`:
`container-page`, `btn-primary` (orange CTA), `btn-secondary` (blue),
`btn-ghost`, `input`, `label`, `card`. Brand colors: `ccr-primary`,
`ccr-secondary`, `ccr-accent`, `ccr-glow` (tailwind.config.ts). Icons:
`lucide-react`. No component library — keep markup simple and accessible
(labels on inputs, focus states, aria where needed).

## Path ownership (one owner per path — no exceptions)

| Owner | Paths |
| --- | --- |
| foundation (done) | configs, `prisma/**`, `src/lib/**`, `src/middleware.ts`, `src/app/layout.tsx`, `src/app/globals.css` |
| public-site | `src/app/(public)/layout.tsx`, `src/app/(public)/page.tsx`, `src/app/(public)/{services,reviews,terms,privacy,warranty}/**`, `src/components/public/**`, `src/app/{sitemap.ts,robots.ts,not-found.tsx,icon.svg}` |
| quote-flow | `src/app/(public)/quote/**`, `src/components/quote/**`, `src/app/api/public/**` |
| staff-portal | `src/app/staff/**`, `src/components/staff/**`, `src/app/api/staff/**` |
| admin-console | `src/app/admin/**`, `src/components/admin/**`, `src/app/api/admin/**` |

## Conventions

- Server components by default; `"use client"` only where interactivity is
  needed; client components live under `src/components/<area>/`.
- DB-reading staff/admin pages: `export const dynamic = "force-dynamic"`.
- Public pages reading reviews: `export const revalidate = 3600`.
- Route handlers: `export async function GET/POST/PATCH/DELETE(req: Request)`
  (use `NextRequest` only if needed). Params: `{ params }: { params: { id: string } }`.
- Money is AUD, format with `formatAud`.
- TypeScript strict — no `any` unless unavoidable, no `@ts-ignore`.
