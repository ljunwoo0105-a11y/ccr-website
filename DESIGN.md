# CCR "Benchlight" Design System

The repair bench as a precision lab, shot at night. Near-black warm ink
surfaces, a fine technical grid, registration-mark ticks, and monospace spec
labels — lit by a single warm **gold bench-lamp accent that is also the
Google-star hue**, so every accent moment reinforces the 4.9★ trust signal.
Copy stays sentence-case and plain-English so mall shoppers feel welcomed,
not intimidated.

The public page is a **two-act composition**:

- **Dark act** (ink-950): Header, Hero, StatsBand — and the closing act:
  ContactSection, CtaBanner (gold inversion), Footer.
- **Paper act** (warm paper): ServicesGrid, WhyChooseUs, ReviewsSection,
  FaqSection — the content-dense middle stays bright and familiar for
  everyday families.

Staff portal and admin console keep the legacy system (`.btn-primary`,
`.card`, `ccr-*`, `slate-*`) — do not restyle them.

## 1. Color

Elevation on dark = **lightness + hairlines**, never shadows. One accent.

| Token | Hex | Usage |
|---|---|---|
| `ink-950` | `#0B0C0E` | Page background, surface 0 |
| `ink-900` | `#101214` | Surface 1: bands, cards, header backdrop (`/85` + blur) |
| `ink-850` | `#15181B` | Surface 1.5: row hover, accordion open |
| `ink-800` | `#1A1E22` | Surface 2: raised cards, inputs, table rows |
| `ink-700` | `#262B31` | Hairlines, dividers, tech grid — the border floor on dark |
| `ink-600` | `#3A4148` | Strong borders on hover, inactive ticks |
| `ink-500` | `#566069` | Disabled/placeholder (dark); secondary-text floor on paper |
| `ink-400` | `#828D97` | Muted meta text — dark surfaces only, never on paper |
| `ink-300` | `#9AA5AE` | Secondary text on dark |
| `ink-200` | `#C3CBD2` | Primary body text on dark |
| `ink-100` | `#E4E8EC` | High-emphasis body, card titles on dark |
| `ink-50`  | `#F4F6F8` | Display headlines on dark, logo on dark |
| `paper`   | `#FAF9F6` | Light middle-act background (warm, printed feel) |
| `stone`   | `#F0EEE8` | Tint panels, photo mats on paper |
| `line`    | `#DCDAD2` | Hairlines on paper |
| `gold-300` | `#FFC966` | Accent hover tint, star gradient top |
| `gold-500` | `#FFB224` | **THE accent**: CTAs, stars, prices, counters, scanline, CtaBanner bg |
| `gold-600` | `#E89B0C` | Pressed state, active wizard tile borders |
| `gold-700` | `#8F5C00` | AA-safe accent **text** twin on paper surfaces |
| `status-green` | `#34D399` | "Open now" pulse dot only. Never decorative |
| `status-red` | `#F87171` | Form validation errors only |

Rules:
- Gold covers < 10% of any viewport except the deliberate CtaBanner inversion.
- Filled gold elements always carry `text-ink-950` (10.8:1).
- Gold-500 text is allowed on ink surfaces (10.6:1) but **banned on paper**
  (use `gold-700`).
- On paper: headings `ink-950`, body `ink-600`, secondary `ink-500` (floor).
- Star ratings are ALWAYS gold — never any other hue.

## 2. Typography

| Voice | Font | Rules |
|---|---|---|
| Display | Archivo (variable, `wdth` 125 via `.type-display`/`.ccr-wordmark`) | Weights 800–900, sentence case, tracking −0.02em, `text-wrap: balance` |
| Body | Instrument Sans | 400/500/600, 1–1.125rem, line-height 1.65, max 68ch |
| Instrument | IBM Plex Mono | Labels, prices, numerals, tables, step counters. Uppercase +0.14em ≤ 13px. **Mono never sets a paragraph** |

Scale: hero H1 `clamp(2.75rem, 6vw, 5.25rem)`; section H2 `clamp(2rem, 4vw, 3rem)`
(`.site-heading`); card titles 1.25rem/700. All numerals `tabular-nums` (`.tnum`).
Headlines: at most one gold word or full stop per headline.

## 3. Motion

Movements of a calibrated instrument — short travel, decisive settle, nothing
bounces. Two easings only:

- `--ease-precision: cubic-bezier(0.22, 1, 0.36, 1)` — reveals, expansions
- `--ease-inout: cubic-bezier(0.65, 0, 0.35, 1)` — scanline sweeps, header condense

Durations: hover 150–200ms · UI state 250–350ms · reveals 500–650ms ·
counters 1200ms · scanline 900ms.

Policy:
- Everything reveals **once** (`viewport={{ once: true, margin: "-80px" }}`),
  pattern `opacity 0→1 + y 24→0` (rows `x -16→0`), sibling stagger 0.07s
  capped at 6. No blur or scale reveals.
- Continuous motion is rationed to the status-dot pulse and the 60s hero grid
  drift. Scanlines fire on events (load, hover, submit), never loop.
- Hover grammar: transform + color only. Never animate layout/size.
- All motion lives in client-leaf components under `src/components/motion/`;
  sections stay server components wherever possible.
- Reduced motion: `MotionConfig reducedMotion="user"` at the public layout
  root; counters render final values; scanline and grid drift hidden.
- Decorative animation is `aria-hidden` with a sr-only static equivalent.

### Motion primitives (`src/components/motion/`)

| Component | Purpose |
|---|---|
| `Reveal` / `RevealGroup` + `RevealItem` | Once-only scroll reveals, staggered groups |
| `Counter` | Count-up stat numerals (SSR renders final value) |
| `Scanline` | THE signature — gold diagnostic sweep on load/submit events |
| CSS `.scan-on-hover` | Card-hover scanline sweep (pure CSS) |
| `GlowCard` + CSS `.bench-glow` | Cursor-following bench-lamp glow (pointer-fine only) |
| `Parallax` | Short scroll-linked drift (hero content, CTA grid) |
| `StarRow` | Five gold stars filling sequentially, sr-only rating text |
| `Collapse` | Height-auto accordion animation |

## 4. Furniture

- `.tech-grid` / `.tech-grid-gold` — 48px CSS technical grid backgrounds
- `.tick-corners` — registration "+" ticks on opposing corners
- `.leader-row` — dotted-leader rows (hours, pricing) — the "docket" detail
- `.mono-label` / `.eyebrow` — the instrument voice; section eyebrows read
  `01 — WHAT WE FIX` with a hairline extending right
- Radius: 8px (`rounded-lg`) on cards, pill buttons only. **No `rounded-xl`.**
- Buttons: `.btn-gold` (the action), `.btn-ghost-dark`, `.btn-ghost-paper`,
  `.btn-ink` (on gold). Inputs: `.input-dark`, `.label-dark`.
- Cards: `.card-dark` (ink-900 + ink-700 hairline), `.card-paper`
  (white + line hairline). Hover: border warms (`ink-700→gold-500/40` on dark,
  `line→ink-950/30` on paper), arrows translate 4px.
- Brand: `CcrMark` (inline SVG, currentColor; `variant="blueprint"` for the
  hero schematic). The 4K PNGs stay for print fidelity.

## 5. Signatures

1. **The diagnostic scanline** — a 1px gold line sweeping once at meaningful
   moments: down the hero on load, across a service card on hover (leaving a
   mono `DIAG · OK` stamp), over the quote summary on submit.
2. **The annotated blueprint mark** — the CCR mark huge in the hero as a
   stroke-only schematic with crosshair ticks and mono labels calling out
   SAME-DAY / 12-MO WARRANTY / CERTIFIED TECHS.
3. **Gold = star gold** — the accent and the rating hue are one token.

## 6. Layout & content rules

- Containers: `.site-container` (max-w-6xl), `.site-container-wide` (max-w-7xl).
- 4px spacing scale; sections `py-20`–`py-28`.
- Never two photo-less dark sections in a row.
- Service photos: full color on stone mats in the paper act (product shelf
  space — never dull), `?v=2` cache-bust suffix preserved.
- Verified business facts only (see `src/lib/config.ts`) — phone 0452 385 321,
  Kiosk K1 near Foot Locker, hours, 4.9★/1,866+ reviews, Price Beat Guarantee,
  up to 12-month warranty. `en-AU` number formatting everywhere.
- Preserve: anchor ids (`#about`, `#contact`, service anchors on /services),
  JSON-LD schemas, aria patterns, the reviews empty-state contract (never
  fabricate reviews), `revalidate` exports, metadata.
- Quote wizard = "diagnostic intake": mono step rail `STEP 02 / 05`, gold
  progress fill, selectable tiles, docket-style summary, persistent
  "Rather talk? 0452 385 321" escape hatch, 150ms error shake, scanline +
  status-green `REQUEST LOGGED` stamp on success, reassurance line
  "No obligation · Price Beat Guarantee" under the final submit.
