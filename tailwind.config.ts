import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
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
          // Pulse space ramp.
          950: "#04070F", // page background — deep space
          900: "#090F1E", // surface 1: bands, cards, header backdrop
          850: "#0C1426", // surface 1.5: row hover, accordion open
          800: "#101A30", // surface 2: raised cards, inputs, table rows
          700: "#1B2A47", // hairlines, dividers, technical grid lines
          600: "#2B3E63", // strong borders on hover, inactive ticks
          500: "#46587E", // disabled text, placeholders
          400: "#7186AB", // muted meta text
          300: "#96A7C8", // secondary text
          200: "#C2CDE4", // primary body text
          100: "#E0E7F5", // high-emphasis body, card titles
          50: "#F1F5FD", // display headlines
        },
        gold: {
          // Volt cyan — THE accent (legacy class name, new identity).
          300: "#7DF3FF", // hover tint
          500: "#00D9FF", // CTAs, links, prices, counters, scanline
          600: "#00A9C7", // pressed state, active borders
          700: "#007A94", // deep twin (rare)
        },
        pulse: {
          500: "#7C5CFF", // violet gradient partner — gradients/beams only
        },
        star: {
          DEFAULT: "#FFC24D", // star ratings ONLY — gold is the trust hue
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
        "pulse-beam": "linear-gradient(120deg, #00D9FF 0%, #7C5CFF 100%)",
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
        "gold-glow": "0 0 16px 1px rgba(0, 217, 255, 0.35)",
        "volt-card": "0 0 28px -4px rgba(0, 217, 255, 0.18)",
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
        marquee: {
          from: { transform: "translateX(0)" },
          to: { transform: "translateX(-50%)" },
        },
      },
      animation: {
        "status-pulse": "status-pulse 2s cubic-bezier(0.65, 0, 0.35, 1) infinite",
        "grid-drift": "grid-drift 60s linear infinite",
        scanline: "scanline 0.9s cubic-bezier(0.65, 0, 0.35, 1) 1 both",
        marquee: "marquee 35s linear infinite",
      },
    },
  },
  plugins: [],
};

export default config;
