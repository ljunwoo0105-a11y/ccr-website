import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        // ------------------------------------------------------------------
        // "Benchlight" public design system — the repair bench as a precision
        // lab. Warm ink neutral ramp (elevation = lightness + hairlines, never
        // shadows) with ONE accent: gold #FFB224, the bench-lamp / Google-star
        // hue. Paper tokens carry the warm light middle act of the page.
        // ------------------------------------------------------------------
        ink: {
          // Legacy compat keys (staff login / older screens).
          DEFAULT: "#0f172a",
          2: "#475569",
          3: "#94a3b8",
          // Benchlight ramp.
          950: "#0B0C0E", // page background, surface 0
          900: "#101214", // surface 1: bands, cards, header backdrop
          850: "#15181B", // surface 1.5: row hover, accordion open
          800: "#1A1E22", // surface 2: raised cards, inputs, table rows
          700: "#262B31", // hairlines, dividers, technical grid lines
          600: "#3A4148", // strong borders on hover, inactive ticks
          500: "#566069", // disabled text, placeholders (dark) / secondary text floor on paper
          400: "#828D97", // muted meta text — dark surfaces only, never on paper
          300: "#9AA5AE", // secondary text on dark
          200: "#C3CBD2", // primary body text on dark
          100: "#E4E8EC", // high-emphasis body, card titles on dark
          50: "#F4F6F8", // display headlines on dark, logo on dark
        },
        paper: "#FAF9F6", // warm light section background (middle act)
        stone: "#F0EEE8", // tint panels, image mats on paper
        line: {
          DEFAULT: "#DCDAD2", // hairlines on paper
          dark: "#2A2A30", // hairlines on ink bands (legacy alias, prefer ink-700)
        },
        gold: {
          300: "#FFC966", // accent hover tint, star gradient top
          500: "#FFB224", // THE accent: CTAs, stars, prices, counters, scanline
          600: "#E89B0C", // pressed state, active wizard tile borders
          700: "#8F5C00", // AA-safe accent TEXT twin for paper surfaces
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
      transitionTimingFunction: {
        precision: "cubic-bezier(0.22, 1, 0.36, 1)", // fast attack, exact settle
        "in-out-lab": "cubic-bezier(0.65, 0, 0.35, 1)", // sweeps, condenses
      },
      boxShadow: {
        // Legacy staff/admin shadows.
        card: "0 1px 3px rgba(0,0,0,0.08), 0 4px 12px rgba(0,0,0,0.04)",
        "card-hover": "0 4px 16px rgba(0,0,0,0.1), 0 1px 4px rgba(0,0,0,0.06)",
        elegant: "0 10px 30px -10px hsl(214 100% 35% / 0.3)",
        // Benchlight: the only glow in the system — the scanline / focus halo.
        "gold-glow": "0 0 12px 1px rgba(255, 178, 36, 0.35)",
      },
      keyframes: {
        "status-pulse": {
          "0%, 100%": { opacity: "1", transform: "scale(1)" },
          "50%": { opacity: "0.45", transform: "scale(0.82)" },
        },
        "grid-drift": {
          from: { backgroundPosition: "0px 0px" },
          to: { backgroundPosition: "48px 48px" },
        },
        scanline: {
          "0%": { top: "0%", opacity: "0" },
          "8%": { opacity: "1" },
          "92%": { opacity: "1" },
          "100%": { top: "100%", opacity: "0" },
        },
      },
      animation: {
        "status-pulse": "status-pulse 2s cubic-bezier(0.65, 0, 0.35, 1) infinite",
        "grid-drift": "grid-drift 60s linear infinite",
        scanline: "scanline 0.9s cubic-bezier(0.65, 0, 0.35, 1) 1 both",
      },
    },
  },
  plugins: [],
};

export default config;
