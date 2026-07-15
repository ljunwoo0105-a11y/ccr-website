# CCR Design System

This document extracts the visual system that exists in the current source. It is descriptive, not a redesign proposal.

## 1. Atmosphere & Identity

CCR currently reads as a Manifold field-service manual: bone drafting paper, carbon ink rules, stamped safety-orange actions, numbered sheets, registration marks, hatch fills, and hard-offset plate shadows. The signature is the workshop-manual sheet language: public pages are framed as numbered repair-binder pages, while staff and admin screens reuse the same bone/carbon/signal tokens for dense operational work. Source anchors: public layout comment and shell in `src/app/(public)/layout.tsx:7`, `src/app/(public)/layout.tsx:21`; home sheet sequence in `src/app/(public)/page.tsx:41`; Manifold CSS comment in `src/app/globals.css:400`; staff/admin reskin comment in `src/app/globals.css:40`.

## 2. Color

### Palette

The active Manifold palette is RGB-channel CSS variables in `src/app/globals.css:651` and Tailwind semantic colors in `tailwind.config.ts:59`. Dark mode swaps the bone and carbon ramps under `:root[data-theme="dark"]` in `src/app/globals.css:679`.

| Role | Token | Light | Dark | Usage | Source |
|---|---|---:|---:|---|---|
| Raised paper | `--bone-50`, `bone-50` | `#FAF8F2` | `#22201A` | Card and plate face | `src/app/globals.css:653`, `tailwind.config.ts:60` |
| Page paper | `--bone-100`, `bone-100` | `#F4F1E8` | `#181713` | Main manual/staff/admin background | `src/app/globals.css:654`, `tailwind.config.ts:61` |
| Recessed paper | `--bone-200`, `bone-200` | `#ECE7DA` | `#13120F` | Recessed panels, inactive fills | `src/app/globals.css:655`, `tailwind.config.ts:62` |
| Paper hover | `--bone-300`, `bone-300` | `#E0DACA` | `#0F0E0C` | Chip hover fills | `src/app/globals.css:656`, `tailwind.config.ts:63` |
| Strong paper shadow | `--bone-400`, `bone-400` | `#CFC7B2` | `#333028` | Strong paper lines | `src/app/globals.css:657`, `tailwind.config.ts:64` |
| Primary ink | `--carbon-950`, `carbon-950` | `#161511` | `#F0EDE2` | Headings, borders, stamped fills | `src/app/globals.css:658`, `tailwind.config.ts:67` |
| Stamp ink | `--carbon-900`, `carbon-900` | `#211F19` | `#E4E0D2` | Dark sidebar/stamp blocks | `src/app/globals.css:659`, `tailwind.config.ts:68` |
| Secondary ink | `--carbon-700`, `carbon-700` | `#3D3A30` | `#C9C4B2` | Secondary text on paper | `src/app/globals.css:660`, `tailwind.config.ts:69` |
| Muted text | `--carbon-500`, `carbon-500` | `#686456` | `#98937F` | Metadata text floor | `src/app/globals.css:665`, `tailwind.config.ts:70` |
| Faint annotation | `--carbon-400`, `carbon-400` | `#8B8778` | `#7A7566` | Decorative annotations | `src/app/globals.css:666`, `tailwind.config.ts:71` |
| Strong hairline | `--carbon-200`, `carbon-200` | `#B9B4A3` | `#454237` | Strong rules | `src/app/globals.css:667`, `tailwind.config.ts:72` |
| Default hairline | `--carbon-150`, `carbon-150` | `#CFC9B8` | `#36332A` | Dividers | `src/app/globals.css:668`, `tailwind.config.ts:73` |
| Accent pressed/text | `--signal-600`, `signal-600` | `#D63E00` | `#FF6B24` | Accent text on paper | `src/app/globals.css:669`, `tailwind.config.ts:76` |
| Accent primary | `--signal-500`, `signal-500` | `#F24C00` | `#F24C00` | Primary buttons, focus, active badges | `src/app/globals.css:670`, `tailwind.config.ts:77` |
| Accent hover | `--signal-400`, `signal-400` | `#FF6B24` | `#FF8242` | Button hover and stamp links | `src/app/globals.css:671`, `tailwind.config.ts:78` |
| Accent wash | `--signal-100`, `signal-100` | `#FBE3D5` | `#3D1F0F` | Soft status fills | `src/app/globals.css:672`, `tailwind.config.ts:79` |
| Metallic detail | `--copper-500`, `copper-500` | `#B26E3A` | `#C4824A` | Metallic/trace detail | `src/app/globals.css:673`, `tailwind.config.ts:82` |
| Light copper | `--copper-300`, `copper-300` | `#D9A167` | `#E2AE78` | Lighter metallic detail | `src/app/globals.css:674`, `tailwind.config.ts:83` |
| Signal text ink | `--ink-on-signal` | `#161511` | `#161511` | Text on orange fills | `src/app/globals.css:677` |

### Legacy/Secondary Tokens Still Present

The `ink-*`, `gold-*`, `pulse-*`, `star`, `paper`, `stone`, `line`, `status-*`, `ccr-*`, `surface-*`, `slate-*`, and `amber-*` palettes remain in Tailwind. They are still referenced by quote/public legacy components and some status states. Source: `tailwind.config.ts:18`, `tailwind.config.ts:38`, `tailwind.config.ts:45`, `tailwind.config.ts:48`, `tailwind.config.ts:85`, `tailwind.config.ts:91`, `tailwind.config.ts:99`, `tailwind.config.ts:107`, `tailwind.config.ts:111`, `src/components/quote/QuoteWizard.tsx:348`, `src/components/public/ServicesGrid.tsx:50`.

### Rules Observed

- `signal-500` is the primary action accent in Manifold buttons and staff/admin active states (`src/app/globals.css:479`, `src/components/staff/SidebarNav.tsx:55`, `src/components/admin/admin-nav.tsx:46`).
- Carbon-on-bone is the default text and border pairing (`src/app/globals.css:405`, `src/app/staff/(portal)/layout.tsx:22`, `src/app/admin/layout.tsx:31`).
- Dark theme is token-driven through `[data-theme="dark"]`, bootstrapped as the default before first paint in `src/app/layout.tsx:48`.
- Stamp plates deepen signal values in dark mode to preserve contrast (`src/app/globals.css:722`).

## 3. Typography

### Font Stack

| Voice | Font | Usage | Source |
|---|---|---|---|
| Display | Archivo Black via `--font-display` | CCR marks, sheet titles, big manual display | `src/app/layout.tsx:9`, `src/app/layout.tsx:12`, `tailwind.config.ts:131` |
| Sans/body | Archivo via `--font-sans` | Body text and normal UI text | `src/app/layout.tsx:16`, `src/app/layout.tsx:61`, `tailwind.config.ts:130` |
| Drafting mono | IBM Plex Mono via `--font-mono` | Sheet numbers, labels, badges, tables, controls | `src/app/layout.tsx:22`, `tailwind.config.ts:133`, `src/app/globals.css:447` |
| Heading alias | `--font-heading: var(--font-display)` | Compatibility alias only | `src/app/globals.css:11` |

### Scale and Voices

| Pattern | Definition | Usage | Source |
|---|---|---|---|
| `.mnl-display` | `font-display`, uppercase, `font-weight: 400`, `letter-spacing: -0.015em`, `line-height: 0.92` | Manual display headings | `src/app/globals.css:430`, `src/components/sheet/HeroBay.tsx:46`, `src/components/staff/pricing-workbench/WorkbenchControls.tsx:22` |
| `.mnl-title` | `font-display`, uppercase, `letter-spacing: 0`, `line-height: 1.05` | Card titles and stamp titles | `src/app/globals.css:438`, `src/components/sheet/Depot.tsx:22`, `src/components/staff/pricing-workbench/ResultPanel.tsx:36` |
| `.mnl-dim` | `font-mono`, `0.6875rem`, medium, uppercase, `tracking-[0.18em]` | Sheet metadata, index labels, microcopy | `src/app/globals.css:447`, `src/components/sheet/ManualHeader.tsx:49`, `src/components/sheet/Sheet.tsx:37` |
| `.mnl-dim-lg` | `font-mono`, `text-xs`, uppercase, `tracking-[0.22em]` | Larger sheet labels | `src/app/globals.css:450`, `src/components/sheet/Sheet.tsx:34`, `src/components/sheet/Depot.tsx:17` |
| `.mnl-num` | Tabular numerals via `font-variant-numeric` and `font-feature-settings` | Sheet numbers, phone, measured stats | `src/app/globals.css:453`, `src/components/sheet/Sheet.tsx:34`, `src/components/sheet/SpecStrip.tsx:62` |
| Legacy `.type-display` | Display font 700, `tracking: -0.03em`, `line-height: 1.02` | Older Pulse pages/components | `src/app/globals.css:106`, `src/app/not-found.tsx:20`, `src/components/public/CtaBanner.tsx:34` |
| Legacy `.mono-label` | Mono uppercase label, `text-xs`, `tracking-[0.14em]` | Older public/quote labels | `src/app/globals.css:121`, `src/components/quote/QuoteWizard.tsx:469`, `src/components/public/Header.tsx:70` |

### Rules Observed

- Display and title voices are uppercase in Manifold; legacy Pulse display is sentence-case/tight.
- Mono is used for labels, dimensions, status tags, and numeric table data, not paragraph copy (`src/app/globals.css:447`, `src/components/staff/ui.ts:9`).
- The body element uses `font-sans`; source does not define a body-specific type scale beyond Tailwind utility usage (`src/app/layout.tsx:61`).

## 4. Spacing & Layout

### Base Rhythm

The source uses Tailwind's default spacing scale, which is 4px-based, with common values `px-3`, `px-4`, `px-5`, `px-6`, `py-2.5`, `py-3.5`, `gap-3`, `gap-4`, `gap-6`, `py-10`, and `lg:py-14`. Examples: buttons in `src/app/globals.css:479`, chips in `src/app/globals.css:527`, sheet interiors in `src/components/sheet/HeroBay.tsx:37`, staff/admin content padding in `src/app/staff/(portal)/layout.tsx:57` and `src/app/admin/layout.tsx:63`.

### Containers and Shells

| Pattern | Definition | Usage | Source |
|---|---|---|---|
| `.mnl-container` | `mx-auto w-full max-w-[88rem] px-5 sm:px-8 lg:px-12` | Public manual sheets/header/footer | `src/app/globals.css:414`, `src/components/sheet/ManualHeader.tsx:48`, `src/components/sheet/Sheet.tsx:30` |
| Staff portal content | `max-w-6xl px-4 py-8 sm:px-6 lg:px-8` | Staff authenticated pages | `src/app/staff/(portal)/layout.tsx:57` |
| Admin content | `px-4 py-6 sm:px-6 lg:px-10 lg:py-8` | Admin authenticated pages | `src/app/admin/layout.tsx:63` |
| `.container-page` | `max-w-6xl px-4 sm:px-6 lg:px-8` | Legacy/staff alias, currently low direct usage | `src/app/globals.css:46` |
| Legacy `.site-container` | `max-w-6xl px-5 sm:px-6 lg:px-8` | Older public pages/components | `src/app/globals.css:97`, `src/components/public/ContactSection.tsx:14` |
| Legacy `.site-container-wide` | `max-w-7xl px-5 sm:px-6 lg:px-8` | Older public page bands | `src/app/globals.css:100`, `src/components/public/ServicesGrid.tsx:26` |

### Breakpoints

Tailwind default breakpoints are in use because `tailwind.config.ts` extends the theme without redefining screens (`tailwind.config.ts:6`). The source uses `sm`, `md`, `lg`, `xl`, and print variants: mobile menu switches at `xl` (`src/components/sheet/ManualHeader.tsx:84`, `src/components/sheet/ManualHeader.tsx:134`), index rail appears at `xl` (`src/components/sheet/IndexRail.tsx:39`), staff sidebar expands at `sm` (`src/app/staff/(portal)/layout.tsx:23`), admin sidebar locks at `lg` (`src/app/admin/layout.tsx:31`).

### Grid Patterns

- Manual sheets commonly use `lg:grid-cols-12` with four/eight column splits (`src/components/sheet/HeroBay.tsx:37`, `src/components/sheet/CircuitSheet.tsx:16`, `src/components/sheet/FieldNotes.tsx:11`).
- Repeated card grids use `md:grid-cols-2`, `xl:grid-cols-3`, or `xl:grid-cols-4` depending on density (`src/components/sheet/QcLog.tsx:71`, `src/components/sheet/Procedure.tsx:50`).
- Staff/admin tables use horizontal overflow plus minimum table widths (`src/components/staff/PartCatalogTable.tsx:37`, `src/components/admin/diagnoses-table.tsx:87`).

## 5. Components

Only patterns present in source are listed. Components used at least twice are documented as reusable; unique patterns are marked unique.

### Manual Page Shell

- **Structure**: `MotionProvider` wraps `.mnl-page`, skip link, `ManualHeader`, `IndexRail`, `main`, and `ManualFooter`.
- **Variants**: Public shell only.
- **Spacing**: `.mnl-container` and full-height flex column.
- **States**: Skip link reveals on focus.
- **Accessibility**: Skip link targets `#main`; `main` has `tabIndex={-1}`.
- **Motion**: Public shell uses reduced-motion gate.
- **Usage**: Unique layout shell at `src/app/(public)/layout.tsx:17`, `src/app/(public)/layout.tsx:21`; header/footer/index are distinct children.

### Sheet Section

- **Structure**: `<section>` with sheet header rule, `.mnl-reg`, sheet number, title, optional footer strip.
- **Variants**: `tone="paper"` default, `tone="recessed"` adds `bg-bone-200`.
- **Spacing**: `.mnl-container`, `py-3`, `scroll-mt-24`.
- **States**: Static.
- **Accessibility**: Section IDs come from the shared `SECTIONS` table.
- **Motion**: Child sections may use `Reveal`/`RevealGroup`.
- **Usage**: Reusable `Sheet` component at `src/components/sheet/Sheet.tsx:10`; sheet registry at `src/components/sheet/sections.ts:11`; home imports several sheet components at `src/app/(public)/page.tsx:7`.

### Manifold Buttons

- **Structure**: `.mnl-btn`, `.mnl-btn-ghost`, `.mnl-btn-bone`, optional `.mnl-btn-sm`.
- **Variants**: Signal fill, ghost outline, inverse bone on stamp plates, small size.
- **Spacing**: `px-6 py-3.5`, small `px-4 py-2.5`.
- **States**: Hover shifts `translate(-1px, -1px)` and active shifts `translate(2px, 2px)` with hard-shadow changes.
- **Accessibility**: Focus-visible rings; icon buttons include labels where used.
- **Motion**: `transition-all duration-150 ease-out`.
- **Usage**: Definition at `src/app/globals.css:478`, `src/app/globals.css:495`, `src/app/globals.css:512`, `src/app/globals.css:521`; used by header, depot, interactive board, and pricing workbench (`src/components/sheet/ManualHeader.tsx:111`, `src/components/sheet/Depot.tsx:52`, `src/components/bay/IcDetailPanel.tsx:139`, `src/components/staff/pricing-workbench/ResultPanel.tsx:98`).

### Manifold Chips

- **Structure**: `.mnl-chip` inline-flex bordered control.
- **Variants**: Default, hover, `data-active="true"`.
- **Spacing**: `px-3.5 py-2`, frequent local overrides such as `px-2 py-1`.
- **States**: Hover paper fill; active carbon fill with signal hard offset.
- **Accessibility**: Used for real buttons and links with labels/ARIA where needed.
- **Motion**: Color transition `duration-150`.
- **Usage**: Definition at `src/app/globals.css:526`; used by theme toggle, mobile menu, reset, and board controls (`src/components/sheet/ThemeToggle.tsx:107`, `src/components/sheet/ManualHeader.tsx:105`, `src/components/staff/pricing-workbench/WorkbenchControls.tsx:28`, `src/components/bay/IcDetailPanel.tsx:52`).

### Plates and Stamps

- **Structure**: `.mnl-plate`, `.mnl-plate-flat`, `.mnl-plate-recessed`, `.mnl-stamp`.
- **Variants**: Raised plate with hard shadow, flat plate, recessed plate, inverted carbon stamp.
- **Spacing**: Local padding, commonly `p-5`/`p-6`.
- **States**: Static; hover effects added by consumers when needed.
- **Accessibility**: Structural containers only.
- **Motion**: None in base classes.
- **Usage**: Definitions at `src/app/globals.css:462`, `src/app/globals.css:466`, `src/app/globals.css:469`, `src/app/globals.css:473`; used across sheets and board detail (`src/components/sheet/Depot.tsx:16`, `src/components/sheet/Procedure.tsx:63`, `src/components/sheet/CircuitSheet.tsx:45`, `src/components/bay/IcDetailPanel.tsx:40`).

### Drafting Furniture

- **Structure**: `.mnl-reg` crosshair, `.mnl-hatch`, `.mnl-hatch-signal`, `.mnl-dimrow`, `.mnl-outline`, `.mnl-ticker`.
- **Variants**: Carbon hatch and signal hatch; outline display on stamp plates.
- **Spacing**: Decorative dimensions fixed in CSS.
- **States**: Static except ticker animation.
- **Accessibility**: Decorative elements use `aria-hidden` in components.
- **Motion**: Ticker uses marquee; hatch/reg are static.
- **Usage**: Definitions at `src/app/globals.css:542`, `src/app/globals.css:566`, `src/app/globals.css:575`, `src/app/globals.css:585`, `src/app/globals.css:703`, `src/app/globals.css:605`; used in header/sheets/spec strip/loading (`src/components/sheet/Sheet.tsx:33`, `src/components/sheet/SpecStrip.tsx:32`, `src/components/bay/loaders.tsx:20`, `src/components/sheet/ManualFooter.tsx:17`).

### Staff/Admin Buttons, Inputs, Labels, Cards

- **Structure**: `.btn-primary`, `.btn-secondary`, `.btn-ghost`, `.input`, `.label`, `.card`.
- **Variants**: Signal fill, carbon fill, outline ghost; field/input; flat drawn card.
- **Spacing**: Buttons `px-5 py-2.5`; inputs `px-3 py-2.5`; cards `p-6`.
- **States**: Button hover/active hard offsets for primary/secondary; inputs focus signal ring; disabled opacity.
- **Accessibility**: Labels generally pair with form controls; focus rings present in definitions.
- **Motion**: `duration-150 ease-out`.
- **Usage**: Definitions at `src/app/globals.css:50`, `src/app/globals.css:64`, `src/app/globals.css:77`, `src/app/globals.css:80`, `src/app/globals.css:83`, `src/app/globals.css:87`; used in login, quote builder, part catalog, admin forms (`src/components/staff/LoginForm.tsx:66`, `src/components/staff/LoginForm.tsx:95`, `src/components/staff/PartCatalogToolbar.tsx:40`, `src/components/admin/ai-settings-form.tsx:81`).

### Navigation Rails

- **Structure**: Dark sidebars for staff/admin and fixed sheet index rail for public.
- **Variants**: Staff compact/expanded sidebar, admin sidebar, public `xl` scrollspy rail.
- **Spacing**: Sidebars use `px-2 py-4` or `px-3 py-4`; links use `gap-3 px-3 py-2`.
- **States**: Active links use `bg-signal-500 text-carbon-950`; inactive links hover on carbon.
- **Accessibility**: `aria-label` and `aria-current` on active links.
- **Motion**: Color transitions; index rail width/opacity transitions.
- **Usage**: Staff layout/nav at `src/app/staff/(portal)/layout.tsx:23`, `src/components/staff/SidebarNav.tsx:43`; admin layout/nav at `src/app/admin/layout.tsx:31`, `src/components/admin/admin-nav.tsx:34`; public index rail at `src/components/sheet/IndexRail.tsx:37`.

### Data Tables and Dense Lists

- **Structure**: Cards with `overflow-x-auto`, table headers with carbon hairlines and uppercase tracked metadata.
- **Variants**: Staff tables, admin tables, responsive admin mobile cards.
- **Spacing**: Headers commonly `px-4 py-3`; empty states `px-6 py-8`.
- **States**: Loading/empty/error rows; action buttons hover to bone or status hues.
- **Accessibility**: Tables use table semantics; action buttons carry `aria-label` in several files.
- **Motion**: Mostly color transitions and spinner icons.
- **Usage**: Staff price/part/intake tables at `src/components/staff/PartCatalogTable.tsx:35`, `src/components/staff/IntakeTable.tsx:118`; admin diagnosis/policy tables at `src/components/admin/diagnoses-table.tsx:87`, `src/components/admin/policies-table.tsx:87`.

### Status Badges

- **Structure**: `BADGE_BASE` plus tone string.
- **Variants**: `signal`, `green`, `sky`, `violet`, `rose`, `neutral`.
- **Spacing**: `px-2 py-0.5`.
- **States**: Static.
- **Accessibility**: Text badges; semantic meaning comes from label text.
- **Motion**: None.
- **Usage**: Helpers in `src/components/staff/ui.ts:9`, `src/components/staff/ui.ts:12`; consumed by staff tables and stock/quality views through exported helper functions.

### Legacy Benchlight/Pulse Components

- **Structure**: `.btn-gold`, `.btn-ghost-dark`, `.input-dark`, `.label-dark`, `.card-dark`, `.mono-label`, `.site-container`.
- **Variants**: Dark diagnostic intake and older public pages.
- **Spacing**: Buttons `px-6 py-3.5`, cards local `p-6`/`p-8`.
- **States**: Hover glow/border and focus rings in gold/ink system.
- **Accessibility**: Quote wizard fields and older nav use labels/focus rings.
- **Motion**: Hover glow/scanline and framer-motion primitives.
- **Usage**: Definitions at `src/app/globals.css:148`, `src/app/globals.css:151`, `src/app/globals.css:168`, `src/app/globals.css:171`, `src/app/globals.css:177`, `src/app/globals.css:121`, `src/app/globals.css:97`; used by quote wizard and older public pages (`src/components/quote/QuoteWizard.tsx:348`, `src/components/public/ServicesGrid.tsx:50`, `src/components/public/ContactSection.tsx:14`).

### Unique or Low-Use Controls

- `.mnl-input` is defined once in CSS and did not appear in current source usage scans outside the definition (`src/app/globals.css:536`).
- `.mnl-range` styles range sliders and is tied to slider pseudo-elements; usage is specialized/low-frequency (`src/app/globals.css:612`).
- `container-page` appears as a compatibility container with only low direct usage in the current scan (`src/app/globals.css:46`).

## 6. Motion & Interaction

### Timing

| Type | Duration | Easing | Usage | Source |
|---|---:|---|---|---|
| Mechanical hover/press | 150ms | `ease-out` | Manifold and staff/admin buttons | `src/app/globals.css:51`, `src/app/globals.css:479` |
| Legacy hover/glow | 200ms | Tailwind default/ease | Benchlight/Pulse buttons and links | `src/app/globals.css:149`, `src/components/public/Header.tsx:70` |
| Bench glow opacity | 300ms | `--ease-precision` | `.bench-glow::before` hover glow | `src/app/globals.css:260` |
| Scroll reveal | 600ms default | `EASE_PRECISION` `[0.22,1,0.36,1]` | `Reveal` and `RevealItem` | `src/components/motion/Reveal.tsx:6`, `src/components/motion/Reveal.tsx:14`, `src/components/motion/Reveal.tsx:37` |
| Collapse | 350ms | `EASE_PRECISION` | Accordion expand/collapse | `src/components/motion/Collapse.tsx:27`, `src/components/motion/Collapse.tsx:30` |
| Scanline | 900ms | `EASE_INOUT` `[0.65,0,0.35,1]` | CSS and component scanline sweeps | `src/app/globals.css:294`, `src/components/motion/Scanline.tsx:17`, `src/components/motion/Scanline.tsx:65` |
| Marquee | 35s | linear | Ticker strips | `tailwind.config.ts:186`, `src/components/sheet/SpecStrip.tsx:33` |

### Interaction Rules Observed

- Root public motion uses `MotionConfig reducedMotion="user"` (`src/components/motion/MotionProvider.tsx:15`).
- No-JS and `scripting: none` fallbacks force `[data-motion]` visible (`src/app/globals.css:31`, `src/app/(public)/layout.tsx:19`).
- Reveal primitives are once-only viewport animations (`src/components/motion/Reveal.tsx:36`, `src/components/motion/Reveal.tsx:73`).
- The current motion vocabulary is mostly transform, opacity, color, box-shadow, and focus rings; `Collapse` intentionally animates height for auto-height accordions (`src/components/motion/Collapse.tsx:27`).
- Continuous motion exists in marquee/status-pulse/spinners; marquee has motion-reduce handling in sheet ticker (`src/components/sheet/SpecStrip.tsx:33`), and legacy ticker has motion-reduce behavior in `src/components/public/TickerBand.tsx:28`.
- Theme interaction is a persisted `.mnl-chip` toggle that writes `data-theme` and `colorScheme`; when no visitor preference is saved, dark is the default (`src/components/sheet/ThemeToggle.tsx:8`, `src/components/sheet/ThemeToggle.tsx:93`).

## 7. Depth & Surface

### Strategy

Current Manifold uses a mixed but specific strategy: squared borders and tonal shifts are the base, with hard offset shadows reserved for drawn plates, raised controls, modals, and brand stamps. Legacy Pulse/Benchlight uses rounded dark glass panels, hairline borders, blur, and glow.

### Manifold Surface Levels

| Level | Treatment | Usage | Source |
|---|---|---|---|
| Page paper | `bg-bone-100 text-carbon-950` plus subtle dot grid | Public manual canvas | `src/app/globals.css:405`, `src/app/globals.css:407` |
| Flat plate | `border border-carbon-950 bg-bone-50` | Cards/sheet panels | `src/app/globals.css:466`, `src/components/sheet/Procedure.tsx:63` |
| Raised plate | Flat plate plus `4px 4px` carbon shadow | Strong manual plates | `src/app/globals.css:462`, `src/app/globals.css:464` |
| Recessed plate | `border-carbon-200 bg-bone-200` | Recessed panels | `src/app/globals.css:469` |
| Stamp plate | `bg-carbon-950 text-bone-100` | Header strip/footer/inverted CTA plate | `src/app/globals.css:473`, `src/components/sheet/ManualHeader.tsx:47`, `src/components/sheet/ManualFooter.tsx:13` |
| Hard shadows | `hard-sm`, `hard`, `hard-lg`, `hard-xl`, `hard-signal` | Buttons, modals, CCR marks | `tailwind.config.ts:161`, `tailwind.config.ts:165`, `src/app/staff/login/page.tsx:40`, `src/components/admin/modal.tsx:25` |
| Overlay modal | `bg-carbon-950/60` with bone panel and hard shadow | Admin/staff modal overlays | `src/components/admin/modal.tsx:18`, `src/components/staff/PartFormModal.tsx:108` |

### Legacy Surface Levels

| Level | Treatment | Usage | Source |
|---|---|---|---|
| Dark glass panel | `rounded-lg border border-ink-700 bg-ink-900/70 backdrop-blur-sm` | Quote/old public cards | `src/app/globals.css:177`, `src/components/quote/QuoteWizard.tsx:348` |
| Paper card | `rounded-lg border border-line bg-white` | Legacy paper accents | `src/app/globals.css:204`, `src/app/globals.css:388` |
| Glow shadow | `shadow-gold-glow`, `shadow-volt-card` | Hover/scanline/glow effects | `tailwind.config.ts:157`, `tailwind.config.ts:158`, `src/components/motion/Scanline.tsx:56` |

### Inconsistencies to Preserve Until Refactor

- Existing root `DESIGN.md` described the retired Pulse system, but current CSS and primary public layout are Manifold. This file replaces the doc to match current source.
- Tailwind comments still call `ink-*`/`gold-*` "Pulse" while values have been retoned to warm graphite/orange (`tailwind.config.ts:10`, `tailwind.config.ts:23`, `tailwind.config.ts:39`).
- Older public route components and the quote wizard still use Benchlight/Pulse classes (`src/components/public/Header.tsx:70`, `src/components/public/ServicesGrid.tsx:50`, `src/components/quote/QuoteWizard.tsx:348`) even though the main public layout is Manifold (`src/app/(public)/layout.tsx:21`).
- Staff/admin use both global class abstractions (`.btn-primary`, `.input`, `.card`) and ad hoc Tailwind equivalents for forms/tables/modals (`src/app/globals.css:50`, `src/components/admin/policies-form.tsx:52`, `src/components/admin/modal.tsx:25`).
- Some selectors are compatibility or low-use definitions rather than active recurring components, notably `.mnl-input`, `.container-page`, and some legacy aliases (`src/app/globals.css:536`, `src/app/globals.css:46`, `src/app/globals.css:328`).
