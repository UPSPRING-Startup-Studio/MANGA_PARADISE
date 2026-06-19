import type { Config } from "tailwindcss";

export default {
  darkMode: ["class"],
  content: [
    "./pages/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./app/**/*.{ts,tsx}",
    "./src/**/*.{ts,tsx}",
  ],
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
        // shadcn standard
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
        success: {
          DEFAULT: "hsl(var(--success))",
          foreground: "hsl(var(--success-foreground))",
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

        // === Charte Manga Paradise "Pop Sanctuary" ===
        "mp-primary": {
          DEFAULT: "hsl(var(--mp-primary))",
          50: "hsl(var(--mp-primary-50))",
          600: "hsl(var(--mp-primary-600))",
        },
        "mp-coral": "hsl(var(--mp-coral))",
        "mp-orange": "hsl(var(--mp-orange))",
        "mp-saffron": "hsl(var(--mp-saffron))",
        "mp-paper": "hsl(var(--mp-paper))",
        "mp-cloud": "hsl(var(--mp-cloud))",
        "mp-sky": "hsl(var(--mp-sky))",
        "mp-sand": "hsl(var(--mp-sand))",
        "mp-ink": {
          DEFAULT: "hsl(var(--mp-ink))",
          soft: "hsl(var(--mp-ink-soft))",
          muted: "hsl(var(--mp-ink-muted))",
          disabled: "hsl(var(--mp-ink-disabled))",
        },
        "mp-night": {
          DEFAULT: "hsl(var(--mp-night))",
          card: "hsl(var(--mp-night-card))",
          border: "hsl(var(--mp-night-border))",
        },
        "mp-info": "hsl(var(--mp-info))",
        "mp-violet": "hsl(var(--mp-violet))",

        // ink shortcut (utilisé dans variants Button)
        ink: "hsl(var(--mp-ink))",
        paper: "hsl(var(--mp-paper))",

        // === Header ===
        "header-bg": "hsl(var(--header-bg))",
        "header-glass": "hsl(var(--header-glass))",

        // === Legacy aliases (compat sans casser les imports existants) ===
        sakura: "hsl(var(--sakura))",
        turquoise: "hsl(var(--turquoise))",
        "tokyo-night": "hsl(var(--tokyo-night))",
        "electric-yellow": "hsl(var(--electric-yellow))",
        otk: "hsl(var(--otk))",

        // === Partner Portal — disciplined night ===
        "partner-bg": "hsl(var(--partner-bg))",
        "partner-sidebar": "hsl(var(--partner-sidebar))",
        "partner-card": "hsl(var(--partner-card))",
        "partner-border": "hsl(var(--partner-border))",
        "partner-gold": "hsl(var(--partner-gold))",
        "partner-cyan": "hsl(var(--partner-cyan))",
        "partner-muted": "hsl(var(--partner-muted))",
        "partner-input": "hsl(var(--partner-input))",
        "partner-input-border": "hsl(var(--partner-input-border))",

        // === Manga Ink (legacy noir/blanc apaisé) ===
        "manga-bg": "hsl(var(--manga-bg))",
        "manga-ink": "hsl(var(--manga-ink))",
        "manga-paper": "hsl(var(--manga-paper))",
        "manga-dot": "hsl(var(--manga-dot))",
      },
      fontFamily: {
        display: ['"Barlow Condensed"', "Impact", "sans-serif"],
        sans: [
          "Poppins",
          "-apple-system",
          "BlinkMacSystemFont",
          "Segoe UI",
          "system-ui",
          "sans-serif",
        ],
        mono: ['"JetBrains Mono"', "ui-monospace", "monospace"],
      },
      fontSize: {
        "display-xl": [
          "clamp(3rem, 6vw, 5rem)",
          { lineHeight: "1", letterSpacing: "-0.02em" },
        ],
        "display-lg": ["clamp(2.25rem, 4vw, 3.5rem)", { lineHeight: "1.05" }],
        "display-md": ["clamp(1.75rem, 3vw, 2.5rem)", { lineHeight: "1.1" }],
        "display-sm": ["clamp(1.25rem, 2vw, 1.75rem)", { lineHeight: "1.15" }],
        "body-lg": ["1.125rem", { lineHeight: "1.6" }],
      },
      backgroundImage: {
        "gradient-hero": "var(--gradient-hero)",
        "gradient-sky": "var(--gradient-sky)",
        "gradient-warm": "var(--gradient-warm)",
        "gradient-cta": "var(--gradient-cta)",
        "gradient-card": "var(--gradient-card)",
        "gradient-shine": "var(--gradient-shine)",
        // legacy aliases (mappés sur charte)
        "gradient-sakura": "var(--gradient-sakura)",
        "gradient-neon": "var(--gradient-neon)",
      },
      boxShadow: {
        xs: "var(--shadow-xs)",
        sm: "var(--shadow-sm)",
        md: "var(--shadow-md)",
        lg: "var(--shadow-lg)",
        primary: "var(--shadow-primary)",
        "primary-lg": "var(--shadow-primary-lg)",
        // legacy aliases
        glow: "var(--shadow-glow)",
        "glow-yellow": "var(--shadow-glow-yellow)",
        neon: "var(--shadow-neon)",
      },
      transitionDuration: {
        fast: "150ms",
        base: "200ms",
        slow: "300ms",
      },
      borderRadius: {
        none: "0",
        sm: "0.5rem",
        md: "0.75rem",
        lg: "var(--radius)",
        xl: "1.25rem",
        "2xl": "1.5rem",
        "3xl": "2rem",
        full: "9999px",
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
        "gentle-float": {
          "0%, 100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-6px)" },
        },
        float: {
          "0%, 100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-10px)" },
        },
        "sakura-fall": {
          "0%": { transform: "translateY(-10%) rotate(0deg)", opacity: "0" },
          "10%": { opacity: "0.5" },
          "100%": {
            transform: "translateY(110vh) rotate(360deg)",
            opacity: "0",
          },
        },
        shimmer: {
          "0%": { backgroundPosition: "-200% 0" },
          "100%": { backgroundPosition: "200% 0" },
        },
        // legacy alias (no-op visuel — on garde l'animation mais sans glow agressif)
        "pulse-glow": {
          "0%, 100%": { opacity: "1" },
          "50%": { opacity: "0.85" },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
        "gentle-float": "gentle-float 4s ease-in-out infinite",
        float: "float 3s ease-in-out infinite",
        "sakura-fall": "sakura-fall 12s linear infinite",
        shimmer: "shimmer 2s linear infinite",
        "pulse-glow": "pulse-glow 2s ease-in-out infinite",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
} satisfies Config;
