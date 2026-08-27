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
npm run setup     # prisma generate + apply schema + seed
npm run dev       # http://localhost:3000
```

Set `SEED_ADMIN_PASSWORD` and `SEED_STAFF_PASSWORD` to unique values of at
least 12 characters before the first `npm run db:seed`. Credentials are never
printed. Change them after first login (Admin → Users → reset password), then
remove the seed password variables.

## Tech stack

- **Next.js 15 (App Router) + TypeScript (strict) + Tailwind CSS**
- **Prisma + PostgreSQL** for the Node staff/admin deployment
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

- `DATABASE_URL` — PostgreSQL connection string
- `AUTH_SECRET` — session signing key (generate a long random string)
- `ANTHROPIC_API_KEY` — enables AI price recommendations + admin AI console
- `GOOGLE_PLACES_API_KEY` / `GOOGLE_PLACE_ID` — live Google review sync
- `SMTP_*` — outgoing quote emails; required in production. With all SMTP
  credentials empty, development writes `var/outbox/*.html` previews.
- `POS_PROVIDER` (`loyverse` | `mock`) + `LOYVERSE_API_TOKEN` — inventory
  stock sync. Parts match POS items by `posItemId` or SKU.

## Railway staff/admin deployment

The public website is deployed to Sites. The database-backed app runs as a
normal Node/Next.js service on Railway with Railway Postgres.

1. Create a Railway project from this repository and set the root directory to
   `ccr-website`.
2. Add a Railway Postgres service.
3. In the Next.js service, set `DATABASE_URL` to the Postgres service's
   connection string.
4. Add the rest of the production variables from `.env.example`, especially
   `AUTH_SECRET`, `NEXT_PUBLIC_SITE_URL`, SMTP, Google, Anthropic, and POS
   values.
5. Railway uses `railway.json`: build runs `npm run railway:build`; start runs
   `prisma migrate deploy && next start`.
6. Set both seed passwords, then after the first successful deploy run the
   seed once from Railway:

```bash
npm run db:seed
```

   Remove the seed password variables after both users have been created.

7. Set Sites environment variable `CCR_NODE_ORIGIN` to the Railway app origin,
   for example `https://ccr-admin-production.up.railway.app`, then redeploy
   Sites. The Sites worker proxies `/staff`, `/admin`, and `/api/*` there.
   It serves the current public build's `/_next/static/*` files locally and
   falls back to Railway only when a hashed asset is missing, so a staggered
   deployment cannot leave staff/admin pages unstyled. Railway and Sites should
   still be deployed from the same source revision, with Railway first.

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

- [ ] Set explicit seed passwords, seed once, change the created passwords,
      remove the seed variables, and set a strong `AUTH_SECRET`
- [ ] Set `DATABASE_URL` to Railway Postgres
- [ ] Configure SMTP (and send a test quote)
- [ ] Add `GOOGLE_PLACES_API_KEY`, run Admin → Reviews → Sync, and confirm
      the place id matches the Springfield Central listing
- [ ] Set `POS_PROVIDER=loyverse` + token, link parts by SKU/POS item id
- [ ] Set `NEXT_PUBLIC_SITE_URL` to the real domain (sitemap/JSON-LD/emails)
- [ ] Replace the seeded **sample part pricing** with real pricing
- [ ] Review `docs/SECURITY.md` and run `npm run build && npm run typecheck`
