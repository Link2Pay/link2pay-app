/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  // Theme is toggled by adding `.dark` to <html> (see src/lib/theme.ts), matching
  // the shadcn/ui convention so any future `dark:` utilities track the same class.
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        // CSS-variable-driven semantic tokens
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',
        border: 'hsl(var(--border))',
        input: 'hsl(var(--input))',
        ring: 'hsl(var(--ring))',
        primary: {
          DEFAULT: 'hsl(var(--primary))',
          foreground: 'hsl(var(--primary-foreground))',
        },
        secondary: {
          DEFAULT: 'hsl(var(--secondary))',
          foreground: 'hsl(var(--secondary-foreground))',
        },
        accent: {
          DEFAULT: 'hsl(var(--accent))',
          foreground: 'hsl(var(--accent-foreground))',
        },
        'accent-ink': 'hsl(var(--accent-ink))',
        popover: {
          DEFAULT: 'hsl(var(--popover))',
          foreground: 'hsl(var(--popover-foreground))',
        },
        card: {
          DEFAULT: 'hsl(var(--card))',
          foreground: 'hsl(var(--card-foreground))',
        },
        muted: {
          DEFAULT: 'hsl(var(--muted))',
          foreground: 'hsl(var(--muted-foreground))',
        },
        destructive: {
          DEFAULT: 'hsl(var(--destructive))',
          foreground: 'hsl(var(--destructive-foreground))',
          subtle: 'hsl(var(--destructive-subtle))',
          border: 'hsl(var(--destructive-border))',
        },
        info: {
          DEFAULT: 'hsl(var(--info))',
          foreground: 'hsl(var(--info-foreground))',
          subtle: 'hsl(var(--info-subtle))',
          border: 'hsl(var(--info-border))',
        },
        neon: {
          DEFAULT: 'hsl(var(--neon-glow))',
          subtle: 'hsl(var(--neon-glow-subtle))',
        },
        'surface-elevated': 'hsl(var(--surface-elevated))',

        // Legacy cyan ramp — remapped to the brand (indigo) semantic tokens so
        // existing `stellar-*` usages adopt Direction A and stay theme-aware.
        stellar: {
          50: 'hsl(var(--primary) / 0.08)',
          100: 'hsl(var(--primary) / 0.14)',
          200: 'hsl(var(--primary) / 0.24)',
          300: 'hsl(var(--primary) / 0.38)',
          400: 'hsl(var(--primary) / 0.6)',
          500: 'hsl(var(--primary))',
          600: 'hsl(var(--primary))',
          700: 'hsl(var(--accent))',
          800: 'hsl(var(--accent))',
          900: 'hsl(var(--secondary))',
        },
        surface: {
          0: 'hsl(var(--card))',
          1: 'hsl(var(--muted))',
          2: 'hsl(var(--secondary))',
          3: 'hsl(var(--border))',
          4: 'hsl(var(--surface-strong))',
        },
        ink: {
          0: 'hsl(var(--foreground))',
          1: 'hsl(var(--foreground))',
          2: 'hsl(var(--text-secondary))',
          3: 'hsl(var(--text-muted))',
          4: 'hsl(var(--text-muted) / 0.78)',
        },
        success: {
          DEFAULT: 'hsl(var(--success))',
          foreground: 'hsl(var(--success-foreground))',
          subtle: 'hsl(var(--success-subtle))',
          border: 'hsl(var(--success-border))',
        },
        warning: {
          DEFAULT: 'hsl(var(--warning))',
          foreground: 'hsl(var(--warning-foreground))',
          subtle: 'hsl(var(--warning-subtle))',
          border: 'hsl(var(--warning-border))',
        },
        danger: 'hsl(var(--destructive))',

        // Categóricos — fondos de icono/avatar (Design System)
        cat: {
          rose: 'hsl(var(--ref-cat-rose))',
          sage: 'hsl(var(--ref-cat-sage))',
          sand: 'hsl(var(--ref-cat-sand))',
          mist: 'hsl(var(--ref-cat-mist))',
        },
        // Delta de importes: crédito verde discreto / débito rojo (solo fallos reales)
        positive: 'hsl(var(--ref-positive))',
        negative: 'hsl(var(--ref-negative))',

        // Sidebar tokens
        sidebar: {
          DEFAULT: 'hsl(var(--sidebar-background))',
          foreground: 'hsl(var(--sidebar-foreground))',
          muted: 'hsl(var(--sidebar-muted))',
          primary: 'hsl(var(--sidebar-primary))',
          border: 'hsl(var(--sidebar-border))',
          accent: 'hsl(var(--sidebar-accent))',
          'accent-foreground': 'hsl(var(--sidebar-accent-foreground))',
        },
      },
      fontFamily: {
        sans: ['Satoshi', 'system-ui', 'sans-serif'],
        display: ['"Cabinet Grotesk"', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'monospace'],
      },
      letterSpacing: {
        label: '0.12em',
      },
      fontSize: {
        // Sub-xs steps to retire hardcoded text-[10px]/text-[11px]
        '3xs': ['0.625rem', { lineHeight: '0.875rem' }], // 10px
        '2xs': ['0.6875rem', { lineHeight: '1rem' }], // 11px
      },
      // Radios en escala del Design System: 8 / 12 / 16 / full.
      // rounded-sm|md → 8px, rounded-lg|xl → 12px (--radius), rounded-2xl → 16px.
      borderRadius: {
        sm: '8px',
        md: '8px',
        lg: 'var(--radius)',
        xl: '12px',
        '2xl': '16px',
        full: '9999px',
      },
      // Sombra única del sistema: overlays (toasts, modales, popovers, tooltips).
      // Las tarjetas NO llevan sombra en reposo — separan por contraste de superficie.
      boxShadow: {
        overlay: '0 8px 24px hsl(240 6% 10% / .10), 0 2px 6px hsl(240 6% 10% / .06)',
        modal: '0 8px 24px hsl(240 6% 10% / .10), 0 2px 6px hsl(240 6% 10% / .06)',
        elevated: '0 8px 24px hsl(240 6% 10% / .10), 0 2px 6px hsl(240 6% 10% / .06)',
      },
      animation: {
        'fade-in': 'fadeIn 0.3s ease-out',
        'slide-up': 'slideUp 0.4s ease-out',
        'pulse-slow': 'pulse 3s ease-in-out infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(10px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
      },
    },
  },
  plugins: [],
};
