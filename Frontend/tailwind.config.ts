import type { Config } from "tailwindcss";

const config = {
  darkMode: "class",
  content: [
    "./client/index.html",
    "./client/src/**/*.{js,jsx,ts,tsx}",
    "./src/**/*.{js,jsx,ts,tsx}", // add this if you have a src folder
  ],
  theme: {
    extend: {
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      colors: {
        // === Main colors ===
        background: "hsl(var(--color-background) / <alpha-value>)",
        foreground: "hsl(var(--color-foreground) / <alpha-value>)",
        border: "hsl(var(--color-border) / <alpha-value>)",
        input: "hsl(var(--color-input) / <alpha-value>)",
        ring: "hsl(var(--color-ring) / <alpha-value>)",

        // === Card ===
        card: {
          DEFAULT: "hsl(var(--color-card) / <alpha-value>)",
          foreground: "hsl(var(--color-card-foreground) / <alpha-value>)",
          border: "hsl(var(--color-card-border) / <alpha-value>)",
        },

        // === Popover ===
        popover: {
          DEFAULT: "hsl(var(--color-popover) / <alpha-value>)",
          foreground: "hsl(var(--color-popover-foreground) / <alpha-value>)",
          border: "hsl(var(--color-popover-border) / <alpha-value>)",
        },

        // === Primary ===
        primary: {
          DEFAULT: "hsl(var(--color-primary) / <alpha-value>)",
          foreground: "hsl(var(--color-primary-foreground) / <alpha-value>)",
          border: "var(--color-primary-border)",
        },

        // === Secondary ===
        secondary: {
          DEFAULT: "hsl(var(--color-secondary) / <alpha-value>)",
          foreground: "hsl(var(--color-secondary-foreground) / <alpha-value>)",
          border: "var(--color-secondary-border)",
        },

        // === Muted ===
        muted: {
          DEFAULT: "hsl(var(--color-muted) / <alpha-value>)",
          foreground: "hsl(var(--color-muted-foreground) / <alpha-value>)",
          border: "var(--color-muted-border)",
        },

        // === Accent ===
        accent: {
          DEFAULT: "hsl(var(--color-accent) / <alpha-value>)",
          foreground: "hsl(var(--color-accent-foreground) / <alpha-value>)",
          border: "var(--color-accent-border)",
        },

        // === Destructive ===
        destructive: {
          DEFAULT: "hsl(var(--color-destructive) / <alpha-value>)",
          foreground: "hsl(var(--color-destructive-foreground) / <alpha-value>)",
          border: "var(--color-destructive-border)",
        },

        // === Chart ===
        chart: {
          "1": "hsl(var(--color-chart-1) / <alpha-value>)",
          "2": "hsl(var(--color-chart-2) / <alpha-value>)",
          "3": "hsl(var(--color-chart-3) / <alpha-value>)",
          "4": "hsl(var(--color-chart-4) / <alpha-value>)",
          "5": "hsl(var(--color-chart-5) / <alpha-value>)",
        },

        // === Sidebar ===
        sidebar: {
          DEFAULT: "hsl(var(--color-sidebar) / <alpha-value>)",
          foreground: "hsl(var(--color-sidebar-foreground) / <alpha-value>)",
          border: "hsl(var(--color-sidebar-border) / <alpha-value>)",
          ring: "hsl(var(--color-sidebar-ring) / <alpha-value>)",
          primary: {
            DEFAULT: "hsl(var(--color-sidebar-primary) / <alpha-value>)",
            foreground: "hsl(var(--color-sidebar-primary-foreground) / <alpha-value>)",
            border: "var(--color-sidebar-primary-border)",
          },
          accent: {
            DEFAULT: "hsl(var(--color-sidebar-accent) / <alpha-value>)",
            foreground: "hsl(var(--color-sidebar-accent-foreground) / <alpha-value>)",
            border: "var(--color-sidebar-accent-border)",
          },
        },

        // Optional: status dots (you can keep or remove)
        status: {
          online: "rgb(34 197 94)",
          away: "rgb(245 158 11)",
          busy: "rgb(239 68 68)",
          offline: "rgb(156 163 175)",
        },
      },
      fontFamily: {
        sans: ["var(--font-sans)", "sans-serif"],
        serif: ["var(--font-serif)", "serif"],
        mono: ["var(--font-mono)", "monospace"],
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
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
      },
    },
  },
  plugins: [require("tailwindcss-animate"), require("@tailwindcss/typography")],
} satisfies Config;

export default config;