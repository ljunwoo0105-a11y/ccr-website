import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  darkMode: ["selector", '[data-theme="dark"]'],
  theme: {
    extend: {
      colors: {
        // ------------------------------------------------------------------
        // "Pulse" public design system — an electric deep-space service lab.
        // Blue-black surfaces, one electric volt-cyan accent with a violet
        // gradient partner, glass panels, glowing edges. NOTE: the ink-* and
        // gold-* class names are the site-wide semantic tokens (kept so the
        // whole site re-skins at the token layer): ink-* = space-navy ramp,
        // gold-* = volt cyan. Stars use the dedicated `star` gold — the one
        // hue that never changes (Google-star trust pattern).
        // ------------------------------------------------------------------
        ink: {
          // Legacy compat keys (staff login / older screens).
          DEFAULT: "#0f172a",
          2: "#475569",
          3: "#94a3b8",
          // Manifold warm-graphite ramp (retoned from the retired Pulse
          // space-navy so legacy dark screens read as carbon ink plates).
          950: "#161511", // page background — carbon ink
          900: "#1D1B16", // surface 1: bands, cards, header backdrop
          850: "#23211A", // surface 1.5: row hover, accordion open
          800: "#2B2822", // surface 2: raised cards, inputs, table rows
          700: "#3D3A30", // hairlines, dividers, technical grid lines
          600: "#514D40", // strong borders on hover, inactive ticks
          500: "#6E6A5C", // disabled text, placeholders
          400: "#8B8778", // muted meta text
          300: "#A5A192", // secondary text
          200: "#C6C1B2", // primary body text
          100: "#DFDACB", // high-emphasis body, card titles
          50: "#F4F1E8", // display headlines
        },
        gold: {
          // Signal safety-orange — THE accent (legacy class name).
          300: "#FF8A4D", // hover tint
          500: "#F24C00", // CTAs, links, prices, counters
          600: "#D63E00", // pressed state, active borders
          700: "#A83100", // deep twin (rare)
        },
        pulse: {
          500: "#B26E3A", // copper gradient partner — gradients/beams only
        },
        star: {
          DEFAULT: "#FFC24D", // star ratings ONLY — gold is the trust hue
        },
        // ------------------------------------------------------------------
        // "Manifold" public design system — an engineering-drawing workshop
        // manual. Bone drafting paper, carbon ink, one safety-orange signal
        // accent, copper for metallic/trace detail. Light world; the polar
        // opposite of the retired dark Pulse skin.
        // ------------------------------------------------------------------
        // Values are CSS variables (RGB triplets in globals.css) so the whole
        // public site re-inks under [data-theme="dark"] — see globals.css.
        bone: {
          50: "rgb(var(--bone-50) / <alpha-value>)", // raised plate / card face
          100: "rgb(var(--bone-100) / <alpha-value>)", // page — drafting paper
          200: "rgb(var(--bone-200) / <alpha-value>)", // recessed panel
          300: "rgb(var(--bone-300) / <alpha-value>)", // deep recess, hover fills
          400: "rgb(var(--bone-400) / <alpha-value>)", // strong paper shadow lines
        },
        carbon: {
          950: "rgb(var(--carbon-950) / <alpha-value>)", // ink — headlines, fills
          900: "rgb(var(--carbon-900) / <alpha-value>)", // stamped blocks
          700: "rgb(var(--carbon-700) / <alpha-value>)", // secondary text on paper
          500: "rgb(var(--carbon-500) / <alpha-value>)", // muted meta text
          400: "rgb(var(--carbon-400) / <alpha-value>)", // faint annotations
          200: "rgb(var(--carbon-200) / <alpha-value>)", // hairline rules (strong)
          150: "rgb(var(--carbon-150) / <alpha-value>)", // hairline rules (default)
        },
        signal: {
          600: "rgb(var(--signal-600) / <alpha-value>)", // accent text on paper
          500: "rgb(var(--signal-500) / <alpha-value>)", // THE accent
          400: "rgb(var(--signal-400) / <alpha-value>)", // hover tint
          100: "rgb(var(--signal-100) / <alpha-value>)", // accent wash fills
        },
        copper: {
          500: "rgb(var(--copper-500) / <alpha-value>)", // metallic detail
          300: "rgb(var(--copper-300) / <alpha-value>)", // light copper
        },
        paper: "#FAF9F6", // rare docket/receipt accents only
        stone: "#F0EEE8",
        line: {
          DEFAULT: "#DCDAD2",
          dark: "#1B2A47",
        },
        status: {
          green: "#34D399", // "Open now" pulse dot only
          red: "#F87171", // form validation errors only
        },

        // ------------------------------------------------------------------
        // Legacy palette — staff portal and admin console. Do not remove.
        // ------------------------------------------------------------------
        ccr: {
          primary: "hsl(214 100% 35%)",
          "primary-dark": "hsl(214 100% 28%)",
          secondary: "hsl(210 85% 45%)",
          accent: "hsl(15 90% 55%)",
          "accent-dark": "hsl(15 90% 48%)",
          glow: "hsl(190 100% 50%)",
        },
        surface: {
          DEFAULT: "#f8fafc",
          2: "#e2e8f0",
        },
        slate: {
          50: "#f8fafc",
          100: "#f1f5f9",
          200: "#e2e8f0",
          300: "#cbd5e1",
          400: "#94a3b8",
          500: "#64748b",
          600: "#475569",
          700: "#334155",
          800: "#1e293b",
          900: "#0f172a",
          950: "#020617",
        },
        amber: {
          400: "#fbbf24",
          500: "#f59e0b",
        },
      },
      fontFamily: {
        sans: ["var(--font-sans)", "system-ui", "sans-serif"],
        display: ["var(--font-display)", "var(--font-sans)", "system-ui", "sans-serif"],
        heading: ["var(--font-display)", "system-ui", "sans-serif"],
        mono: [
          "var(--font-mono)",
          "ui-monospace",
          "SFMono-Regular",
          "Menlo",
          "Consolas",
          "Liberation Mono",
          "monospace",
        ],
      },
      backgroundImage: {
        // The electric beam — volt→violet. Gradient text + the CTA inversion.
        "pulse-beam": "linear-gradient(120deg, #F24C00 0%, #B26E3A 100%)",
      },
      transitionTimingFunction: {
        precision: "cubic-bezier(0.22, 1, 0.36, 1)",
        "in-out-lab": "cubic-bezier(0.65, 0, 0.35, 1)",
      },
      boxShadow: {
        // Legacy staff/admin shadows.
        card: "0 1px 3px rgba(0,0,0,0.08), 0 4px 12px rgba(0,0,0,0.04)",
        "card-hover": "0 4px 16px rgba(0,0,0,0.1), 0 1px 4px rgba(0,0,0,0.06)",
        elegant: "0 10px 30px -10px hsl(214 100% 35% / 0.3)",
        // Pulse: the volt glow — scanline, CTA hover, focus halo.
        "gold-glow": "0 0 16px 1px rgba(242, 76, 0, 0.35)",
        "volt-card": "0 0 28px -4px rgba(242, 76, 0, 0.18)",
        // Manifold hard offsets — drawn plates. Var-based so they re-ink
        // in dark mode with the rest of the manual.
        "hard-sm": "2px 2px 0 0 rgb(var(--carbon-950))",
        hard: "3px 3px 0 0 rgb(var(--carbon-950))",
        "hard-lg": "4px 4px 0 0 rgb(var(--carbon-950))",
        "hard-xl": "6px 6px 0 0 rgb(var(--carbon-950) / 0.9)",
        "hard-signal": "3px 3px 0 0 rgb(var(--signal-500))",
      },
      keyframes: {
        "status-pulse": {
          "0%, 100%": { opacity: "1", transform: "scale(1)" },
          "50%": { opacity: "0.45", transform: "scale(0.82)" },
        },
        scanline: {
          "0%": { top: "0%", opacity: "0" },
          "8%": { opacity: "1" },
          "92%": { opacity: "1" },
          "100%": { top: "100%", opacity: "0" },
        },
        marquee: {
          from: { transform: "translateX(0)" },
          to: { transform: "translateX(-50%)" },
        },
      },
      animation: {
        "status-pulse": "status-pulse 2s cubic-bezier(0.65, 0, 0.35, 1) infinite",
        scanline: "scanline 0.9s cubic-bezier(0.65, 0, 0.35, 1) 1 both",
        marquee: "marquee 35s linear infinite",
      },
    },
  },
  plugins: [],
};

export default config;
