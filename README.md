# CCR Cool Case Repair — Website

Full-stack website for **CCR (Cool Case Repair)**, Orion Springfield Central,
Springfield Central QLD. Replaces the old Lovable-generated site.

| Surface | URL | Access |
| --- | --- | --- |
| Public marketing site + quote system | `/` | Everyone |
| Staff portal (price list, intake, inventory, leads) | `/staff` | STAFF + ADMIN login |
| Admin console (AI models & costs, reviews, users) | `/admin` | ADMIN login |

## Quick start

```bash
npm install
npm run setup     # prisma generate + create SQLite db + seed
npm run dev       # http://localhost:3000
```

`npm run db:seed` prints the **initial admin/staff passwords once** — store
them and change them after first login (Admin → Users → reset password).

## Tech stack

- **Next.js 14 (App Router) + TypeScript (strict) + Tailwind CSS**
- **Prisma + SQLite** locally — switch `datasource` provider to `postgresql`
  and update `DATABASE_URL` for production
- **jose** JWT sessions in an httpOnly cookie, **bcryptjs** password hashing
- **@anthropic-ai/sdk** for the AI pricing agents
- **nodemailer** for emailed quote estimates
- No other runtime dependencies — deliberately small surface to audit

## Project layout

```
prisma/               schema + seed (sample parts, AI model registry, reviews)
src/middleware.ts     edge guard for /staff, /admin and their APIs
src/lib/              ALL shared server logic
  auth.ts             sessions, password hashing, role checks
  api.ts              ok/fail envelope, parseBody (zod), guard (role gate)
  validation.ts       every request schema (zod) — single source of truth
  rate-limit.ts       fixed-window limiter + IP hashing
  email.ts            SMTP sender + quote email template (dev: var/outbox/)
  config.ts           VERIFIED business facts, catalog constants
  google-reviews.ts   Places API sync + the only public review queries
  ai/client.ts        tracked Anthropic calls: usage log, cost, budget cap
  ai/pricing.ts       market research agent + margin agent
  pos/                POS adapter interface, Loyverse + mock drivers
src/app/(public)/     marketing pages + quote wizard (SEO/GEO optimised)
src/app/staff/        staff portal pages
src/app/admin/        admin console pages
src/app/api/          route handlers (public / staff / admin)
docs/CONTRACTS.md     build rules + module ownership (read before changing code)
docs/SECURITY.md      security model + review checklist
```

## The rules that shape this codebase

1. **Repair prices never reach the public client.** The public catalog API
   returns device/repair *names* only. The estimate (cheapest part tier,
   "from $X") is delivered **by email only**, after the customer provides
   name, email, phone, suburb and how they found us. This is deliberate
   anti-scraping: competitors gate their quotes the same way, and one of them
   (Mobile Experts) accidentally ships its entire price list in page source —
   we don't.
2. **Only real, 5-star Google reviews are shown publicly.** Reviews sync from
   the Google Places API (`GOOGLE_PLACES_API_KEY` + place id) into the
   database; the public feed is hard-filtered to `rating = 5 AND visible`.
   Admin can hide any review or add genuine reviews manually.
3. **All business facts live in `src/lib/config.ts`** and were verified
   against public sources in June 2026. The old site's "(07) 3000-COOL",
   "info@coolcaserepair.com.au" and "7am–9pm" hours were fabricated
   placeholders — never reintroduce them.

## Configuration (`.env`)

See `.env.example` for the full annotated list:

- `AUTH_SECRET` — session signing key (generate a long random string)
- `ANTHROPIC_API_KEY` — enables AI price recommendations + admin AI console
- `GOOGLE_PLACES_API_KEY` / `GOOGLE_PLACE_ID` — live Google review sync
- `SMTP_*` — outgoing quote emails (without it, emails are written to
  `var/outbox/*.html` so you can preview them in dev)
- `POS_PROVIDER` (`loyverse` | `mock`) + `LOYVERSE_API_TOKEN` — inventory
  stock sync. Parts match POS items by `posItemId` or SKU.

## AI features

- **Staff → Price List → "AI price"**: runs two agents through one tracked
  pipeline — a *market research agent* (Anthropic web search over Australian
  competitors) and a *margin agent* (your cost + target margin + market data
  → recommended sell price with reasoning). Staff can apply the suggested
  price with one click.
- **Admin → AI Console**: register/maintain models with USD-per-million-token
  pricing, pick default models per agent, estimate monthly cost before
  committing, see actual logged spend per feature/model/day, and set a
  monthly budget that can hard-block further calls.

Every Anthropic call goes through `src/lib/ai/client.ts` (`trackedMessage`),
which logs real token usage and cost and enforces the budget. There is no
untracked path to the API.

## Production checklist

- [ ] Change the seeded passwords; set a strong `AUTH_SECRET`
- [ ] Move `DATABASE_URL` to PostgreSQL
- [ ] Configure SMTP (and send a test quote)
- [ ] Add `GOOGLE_PLACES_API_KEY`, run Admin → Reviews → Sync, and confirm
      the place id matches the Springfield Central listing
- [ ] Set `POS_PROVIDER=loyverse` + token, link parts by SKU/POS item id
- [ ] Set `NEXT_PUBLIC_SITE_URL` to the real domain (sitemap/JSON-LD/emails)
- [ ] Replace the seeded **sample part pricing** with real pricing
- [ ] Review `docs/SECURITY.md` and run `npm run build && npm run typecheck`
