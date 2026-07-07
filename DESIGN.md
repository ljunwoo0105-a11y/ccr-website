# CCR "Pulse" Design System

An electric deep-space service lab. Blue-black navy surfaces under a drifting
technical grid, glass HUD panels with corner brackets, and one **electric
volt-cyan accent** with a violet gradient partner — the site feels like the
diagnostic equipment on the bench, powered on. Copy stays sentence-case and
plain-English; the energy comes from light, motion and precision, not jargon.

The public site is **dark end-to-end**: alternating ink-950/ink-900 bands,
photographic relief, the volt ticker, and exactly one full inversion — the
volt→violet **beam CtaBanner**. Paper/stone tokens survive only as rare
docket accents (wizard receipt).

Staff portal and admin console keep the legacy system (`.btn-primary`,
`.card`, `ccr-*`, `slate-*`) — do not restyle them.

> **Class-name note:** the site-wide semantic tokens kept their original
> names through the re-identity — `ink-*` now holds the space-navy ramp and
> `gold-*` holds volt cyan. Read the names as "surface ramp" and "accent".

## 1. Color

Elevation on dark = lightness + hairlines (+ glass blur on panels). One accent.

| Token | Hex | Usage |
|---|---|---|
| `ink-950` | `#04070F` | Page background — deep space |
| `ink-900` | `#090F1E` | Surface 1: bands, cards, header backdrop (`/85` + blur) |
| `ink-850` | `#0C1426` | Surface 1.5: row hover, accordion open |
| `ink-800` | `#101A30` | Surface 2: raised cards, inputs, table rows |
| `ink-700` | `#1B2A47` | Hairlines, dividers, tech grid — the border floor |
| `ink-600` | `#2B3E63` | Strong borders on hover, empty stars |
| `ink-500` | `#46587E` | Disabled/placeholder |
| `ink-400` | `#7186AB` | Muted meta text (floor for text) |
| `ink-300` | `#96A7C8` | Secondary text |
| `ink-200` | `#C2CDE4` | Primary body text |
| `ink-100` | `#E0E7F5` | High-emphasis body, card titles |
| `ink-50`  | `#F1F5FD` | Display headlines |
| `gold-300` | `#7DF3FF` | Accent hover tint |
| `gold-500` | `#00D9FF` | **THE accent (volt)**: CTAs, links, prices, counters, scanline, ticker |
| `gold-600` | `#00A9C7` | Pressed state, active borders |
| `pulse-500` | `#7C5CFF` | Violet gradient partner — gradients/markers only, never solo text |
| `star` | `#FFC24D` | Star ratings ONLY — the trust hue that never changes |
| `bg-pulse-beam` | volt→violet 120° | Gradient: CtaBanner surface, `.text-gradient-pulse` |
| `status-green` | `#34D399` | "Open now" pulse dot only |
| `status-red` | `#F87171` | Form validation errors only |

Rules: filled volt elements carry `text-ink-950`; volt text is fine on any ink
surface; violet never appears alone (gradient partner only); stars are always
`star` gold; max one gradient word per headline.

## 2. Typography

| Voice | Font | Rules |
|---|---|---|
| Display | Space Grotesk (`.type-display`) | 700, sentence case, tracking −0.03em, `text-wrap: balance` |
| Body | Manrope | 400/500/600, 1–1.125rem, line-height 1.65, max 68ch |
| Instrument | JetBrains Mono | Labels, prices, numerals, tables. Uppercase +0.14em ≤ 13px. **Mono never sets a paragraph** |

Scale: hero H1 `clamp(3rem, 7.5vw, 6.25rem)`; section H2 `clamp(2rem, 4vw, 3rem)`
(`.site-heading`); numerals `tabular-nums` (`.tnum`). `.text-gradient-pulse`
for the single electric word.

## 3. Motion

Movements of powered-on diagnostic equipment — short travel, decisive settle,
nothing bounces. Two easings only:

- `--ease-precision: cubic-bezier(0.22, 1, 0.36, 1)` — reveals, expansions
- `--ease-inout: cubic-bezier(0.65, 0, 0.35, 1)` — scanline sweeps, header condense

Durations: hover 150–200ms · UI state 250–350ms · reveals 500–650ms ·
counters 1200ms · scanline 900ms.

Policy:
- Everything reveals **once** (`viewport={{ once: true, margin: "-80px" }}`);
  display headlines rise via `LineRise` masks; stagger 0.07s capped at 6.
- Continuous motion is rationed to EXACTLY THREE elements site-wide: the
  status-dot pulse, the 60s hero grid drift, and the volt TickerBand marquee
  (35s, pauses on hover/focus, static under reduced motion). Scanlines fire
  on events (load, hover, submit), never loop.
- Hover grammar: transform + color + glow only. Never animate layout/size.
- All motion lives in client leaves under `src/components/motion/`; sections
  stay server components. `MotionConfig reducedMotion="user"` at the public
  layout root; decorative animation is `aria-hidden` with sr-only equivalents.

### Motion primitives (`src/components/motion/`)

| Component | Purpose |
|---|---|
| `Reveal` / `RevealGroup` + `RevealItem` | Once-only scroll reveals, staggered groups |
| `Counter` | Count-up stat numerals (SSR renders final value) |
| `Scanline` | Volt laser sweep on load/submit events |
| CSS `.scan-on-hover` | Card-hover scanline sweep (pure CSS) |
| `GlowCard` + CSS `.bench-glow` | Cursor-following volt glow (pointer-fine only) |
| `Parallax` | Short scroll-linked drift |
| `StarRow` | Five gold stars filling sequentially, sr-only rating text |
| `Collapse` | Height-auto accordion animation |
| `TiltCard` | ±4° pointer tilt with spring settle (pointer-fine only) |
| `LineRise` | Masked line-rise for display headlines (once, staggered) |

Plus `TickerBand` (`src/components/public/TickerBand.tsx`): the volt marquee
of business promises under the hero — the third sanctioned continuous
animation and the chromatic heartbeat.

## 4. Furniture

- `.card-dark` — glass HUD panel: translucent ink-900 + backdrop blur +
  ink-700 hairline; hover `border-gold-500/40` (+ `shadow-volt-card` on
  showcase cards)
- `.hud-corners` — L-shaped interface brackets (top-left, bottom-right),
  currentColor
- `.tech-grid` / `.tech-grid-gold` — 48px technical grids (space-blue / dark-on-beam)
- `.leader-row` — dotted-leader rows (hours, pricing)
- `.mono-label` / `.eyebrow` — instrument voice; section eyebrows read
  `01 — WHAT WE FIX` in `text-gold-500` with an ink-700 hairline to the edge
- Radius: `rounded-md` buttons, `rounded-lg` cards. Nothing rounder.
- Buttons: `.btn-gold` (volt fill, glows on hover), `.btn-ghost-dark`,
  `.btn-ink` (on the beam). Inputs: `.input-dark`, `.label-dark`.
- Photos: duotone at rest on dark (grayscale + ink-950/30 overlay), color
  lifts on hover; touch devices get color at rest. `?v=2` suffix preserved.
- Brand: `CcrMark` inline SVG (currentColor; `blueprint` variant for
  watermarks). The 4K PNGs stay for print fidelity.

## 5. Signatures

1. **The volt scanline** — a 1px cyan laser sweeping once at meaningful
   moments: down the hero on load, across cards on hover (leaving a mono
   `DIAG · OK` stamp), over the quote summary on submit.
2. **The HUD bench panel** — a floating glass card with corner brackets in
   the hero running live `SCREEN … OK / DIAG COMPLETE` diagnostics.
3. **The beam** — the volt→violet gradient: one word per headline, the
   ticker's markers, and the full CtaBanner inversion.
4. **Gold stars on an electric site** — ratings stay Google-gold no matter
   what; trust never gets re-themed.

## 6. Layout & content rules

- Containers: `.site-container` (max-w-6xl), `.site-container-wide` (max-w-7xl).
- 4px spacing scale; sections `py-20`–`py-28`; alternate ink-950/ink-900 bands;
  never two photo-less sections in a row.
- Verified business facts only (see `src/lib/config.ts`) — phone 0452 385 321,
  Kiosk K1 near Foot Locker, hours, 4.9★/1,866+ reviews, Price Beat Guarantee,
  up to 12-month warranty. `en-AU` formatting everywhere.
- Preserve: anchor ids (`#about`, `#contact`, service anchors), JSON-LD, aria
  patterns, the reviews empty-state contract, `revalidate` exports, metadata.
- Quote wizard = diagnostic intake: mono step rail, volt progress fill,
  selectable tiles, docket summary, "Rather talk? 0452 385 321" escape hatch,
  error shake, scanline + `REQUEST LOGGED` stamp on success.
