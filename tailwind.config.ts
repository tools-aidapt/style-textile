import type { Config } from "tailwindcss";
import tailwindcssAnimate from "tailwindcss-animate";

/**
 * Aidapt design system, expressed as Tailwind utilities.
 *
 * The palette below carries literal hexes rather than var() so the
 * opacity modifiers (`bg-teal-400/10`) keep working — Tailwind can
 * only compute an alpha channel from a value it can parse. The same
 * anchors live as CSS custom properties in src/aidapt/tokens, which
 * remains the source of truth; these are the locked mirrors.
 */
export default {
  darkMode: ["class"],
  // Gate hover: behind @media (hover: hover) so a tap on a touch device does
  // not leave the hover wash stuck on the section it opened. This is the
  // default in Tailwind v4.
  future: {
    hoverOnlyWhenSupported: true,
  },
  content: ["./pages/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}", "./app/**/*.{ts,tsx}", "./src/**/*.{ts,tsx}"],
  prefix: "",
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: {
        "2xl": "1400px",
      },
    },
    extend: {
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        sidebar: {
          DEFAULT: "hsl(var(--sidebar-background))",
          foreground: "hsl(var(--sidebar-foreground))",
          primary: "hsl(var(--sidebar-primary))",
          "primary-foreground": "hsl(var(--sidebar-primary-foreground))",
          accent: "hsl(var(--sidebar-accent))",
          "accent-foreground": "hsl(var(--sidebar-accent-foreground))",
          border: "hsl(var(--sidebar-border))",
          ring: "hsl(var(--sidebar-ring))",
        },

        /* ---- WATER 水 — the hero, always present ---- */
        teal: {
          50: "#DCFEFA",
          100: "#C0F4EF",
          200: "#94E3DC",
          300: "#65CDC5",
          400: "#11A8A0", // ANCHOR — Aidapt Teal
          500: "#009A92",
          600: "#007F78",
          700: "#00645E",
          800: "#004843",
          900: "#002F2C",
        },
        cyan: {
          50: "#D5FEFF",
          100: "#B5F4FF",
          200: "#81E2F8",
          300: "#36C5E0", // ANCHOR — Current Cyan
          400: "#00B3D2",
          500: "#0098B8",
          600: "#007D9C",
          700: "#00627E",
          800: "#00465D",
          900: "#002E40",
        },
        deepflow: {
          50: "#E8F9FF",
          100: "#D3ECFC",
          200: "#B2D8EE",
          300: "#91C0DC",
          400: "#70A6C5",
          500: "#538CAB",
          600: "#3A7290",
          700: "#245873",
          800: "#113E54",
          900: "#062A3B", // ANCHOR — Deep Flow
        },

        /* ---- WOOD 木 — growth accents, never lead ---- */
        spring: {
          100: "#BAF8DE",
          200: "#8AE8C3",
          300: "#4FD1A5", // ANCHOR — Spring
          500: "#00A06F",
          600: "#008558",
        },
        sage: {
          100: "#C8F3E5",
          200: "#9AD9C5", // ANCHOR — Sage
          600: "#007E65",
        },
        frost: {
          50: "#E9FAF6",
          100: "#D6F0E9", // ANCHOR — Frost
          200: "#B5DBD1",
        },

        /* ---- EARTH 土 — sparing warmth ---- */
        sand: {
          50: "#FDF5E3",
          100: "#F2E7CC",
          200: "#E8D8B0", // ANCHOR — Sand
        },
        warmmist: {
          50: "#F9F5EC",
          100: "#F4EEE0", // ANCHOR — Warm Mist
        },

        /* ---- FIRE 火 — the spark. CTAs only, ≤5% ---- */
        ember: {
          50: "#FFEAD9",
          100: "#FFD6BC",
          200: "#FFB691",
          300: "#FF8A5B", // ANCHOR — Ember
          400: "#F67138",
          500: "#DB5100",
        },

        /* ---- METAL 金 — neutrals, spend generously ---- */
        ink: {
          50: "#EEF7FD",
          100: "#DCEAF2",
          200: "#C1D5E0",
          400: "#87A3B3",
          700: "#3D5663",
          800: "#283C47",
          900: "#0A1A22", // ANCHOR — Ink
        },
        steel: {
          50: "#F1F7F9",
          100: "#E1EAED",
          200: "#C7D4D9",
          300: "#ACBCC3",
          500: "#75878F",
          600: "#5A6B72", // ANCHOR — Steel
          700: "#45555B",
        },
        mist: {
          50: "#EDF1F2", // ANCHOR — Mist Grey
          100: "#E3E9EB",
          200: "#CBD3D6",
          300: "#B1BBBE",
        },
      },

      fontFamily: {
        /* Manrope headlines · Inter workhorse · Source Serif 4 for
           second-level headings and pull quotes only · Plex Mono for data
           and figures.

           These point at the design-system tokens rather than restating the
           stacks: the tokens quote "Source Serif 4" correctly, and a family
           name carrying a digit must be quoted or the whole declaration is
           invalid and the browser drops it. */
        display: ["var(--font-display)"],
        sans: ["var(--font-sans)"],
        serif: ["var(--font-serif)"],
        mono: ["var(--font-mono)"],
      },

      fontSize: {
        /* The tuned ~1.2–1.25 modular ramp, size-specific tracking */
        overline: ["0.75rem", { lineHeight: "1rem", letterSpacing: "0.14em" }],
        caption: ["0.8125rem", { lineHeight: "1.125rem", letterSpacing: "0.008em" }],
        "body-sm": ["0.875rem", { lineHeight: "1.375rem" }],
        body: ["1rem", { lineHeight: "1.625rem" }],
        "body-lg": ["1.125rem", { lineHeight: "1.875rem" }],
        h6: ["1.0625rem", { lineHeight: "1.5rem", letterSpacing: "-0.006em" }],
        h5: ["1.25rem", { lineHeight: "1.75rem", letterSpacing: "-0.006em" }],
        h4: ["1.5rem", { lineHeight: "2rem", letterSpacing: "-0.006em" }],
        h3: ["1.875rem", { lineHeight: "2.375rem", letterSpacing: "-0.006em" }],
        h2: ["2.375rem", { lineHeight: "2.75rem", letterSpacing: "-0.014em" }],
        h1: ["3rem", { lineHeight: "3.375rem", letterSpacing: "-0.014em" }],
        display: ["4rem", { lineHeight: "4.25rem", letterSpacing: "-0.022em" }],
      },

      letterSpacing: {
        tighter: "-0.022em",
        tight: "-0.014em",
        snug: "-0.006em",
        plus: "0.008em",
        wide: "0.02em",
        wider: "0.14em",
      },

      borderRadius: {
        lg: "var(--radius)", // 12px — cards
        md: "calc(var(--radius) - 4px)", // 8px — buttons, inputs
        sm: "calc(var(--radius) - 8px)", // 4px
        xl: "16px", // modals, large surfaces
        "2xl": "24px", // hero panels
        pill: "999px", // chips, toggles, meters
        circle: "50%", // avatars, status dots
      },

      borderWidth: {
        hairline: "1px",
        thin: "1.5px",
        keyline: "3px", // reserved for the chevron mark
      },

      boxShadow: {
        /* Every shadow is tinted toward Deep Flow — elevation is
           on-brand, never neutral grey */
        xs: "0 1px 2px rgba(6,42,59,0.06)",
        sm: "0 1px 2px rgba(6,42,59,0.06), 0 2px 6px rgba(6,42,59,0.06)",
        md: "0 2px 4px rgba(6,42,59,0.05), 0 6px 16px rgba(6,42,59,0.09)",
        lg: "0 4px 8px rgba(6,42,59,0.06), 0 16px 32px rgba(6,42,59,0.12)",
        xl: "0 8px 16px rgba(6,42,59,0.08), 0 28px 56px rgba(6,42,59,0.16)",
        teal: "0 8px 28px rgba(17,168,160,0.28)", // hero focus only
        inset: "inset 0 1px 2px rgba(6,42,59,0.08)",
      },

      transitionTimingFunction: {
        forward: "cubic-bezier(0.16, 0.8, 0.32, 1)",
        entrance: "cubic-bezier(0.22, 1, 0.36, 1)",
        exit: "cubic-bezier(0.4, 0, 1, 1)",
        chevron: "cubic-bezier(0.34, 1.2, 0.64, 1)",
        press: "cubic-bezier(0.33, 0, 0.67, 1)",
      },

      transitionDuration: {
        instant: "80ms",
        press: "90ms",
        fast: "140ms",
        base: "220ms",
        slow: "340ms",
        spring: "500ms",
      },

      spacing: {
        13: "3.25rem", // 52px — the design system's lg control height
      },

      /* The design system's layer scale, from tokens/elevation.css. Sticky
         chrome sat at z-[100] while the shadcn overlays kept their stock
         z-50, so a dialog opened *underneath* the page header and its scrim
         stopped short of it. Named layers make that ordering impossible to
         get wrong again. */
      zIndex: {
        base: "0",
        raised: "10",
        sticky: "100",
        dropdown: "300",
        overlay: "400",
        modal: "500",
        popover: "600",
        toast: "700",
        max: "9999",
      },

      maxWidth: {
        measure: "66ch",
        "measure-wide": "78ch",
        /* The requisition column. Three fields across need more than the
           reading measure and less than the full 1200 container, which is
           what leaves it visibly centred inside the page. */
        form: "1088px",
        container: "1200px",
        "container-wide": "1400px",
      },

      keyframes: {
        "accordion-down": {
          from: { height: "0" },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: "0" },
        },
        /* Motion carries the eye forward — left to right, the
           reading and chevron direction. No infinite loops. */
        "rise-in": {
          from: { opacity: "0", transform: "translateY(8px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
        "slide-forward": {
          from: { opacity: "0", transform: "translateX(-10px)" },
          to: { opacity: "1", transform: "translateX(0)" },
        },
      },

      animation: {
        "accordion-down": "accordion-down var(--dur-slow) var(--ease-spring)",
        "accordion-up": "accordion-up var(--dur-base) var(--ease-standard)",
        "rise-in": "rise-in 340ms cubic-bezier(0.22, 1, 0.36, 1) both",
        "slide-forward": "slide-forward 340ms cubic-bezier(0.22, 1, 0.36, 1) both",
      },
    },
  },
  plugins: [tailwindcssAnimate],
} satisfies Config;
