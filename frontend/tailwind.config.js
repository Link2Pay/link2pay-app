/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
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
        },
        neon: {
          DEFAULT: 'hsl(var(--neon-glow))',
          subtle: 'hsl(var(--neon-glow-subtle))',
        },
        'surface-elevated': 'hsl(var(--surface-elevated))',

        // Backward-compatible aliases mapped to dark values
        stellar: {
          50: 'hsl(190 70% 55% / 0.08)',
          100: 'hsl(190 70% 55% / 0.14)',
          200: 'hsl(190 70% 55% / 0.24)',
          300: 'hsl(190 70% 55% / 0.38)',
          400: 'hsl(188 67% 66%)',
          500: 'hsl(190 70% 55%)',
          600: 'hsl(199 65% 50%)',
          700: 'hsl(204 64% 51%)',
          800: 'hsl(204 64% 43%)',
          900: 'hsl(219 23% 15%)',
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
        },
        warning: {
          DEFAULT: 'hsl(var(--warning))',
          foreground: 'hsl(var(--warning-foreground))',
        },
        danger: 'hsl(var(--destructive))',

        // Sidebar tokens
        sidebar: {
          DEFAULT: 'hsl(var(--sidebar-background))',
          foreground: 'hsl(var(--sidebar-foreground))',
          primary: 'hsl(var(--sidebar-primary))',
          border: 'hsl(var(--sidebar-border))',
          accent: 'hsl(var(--sidebar-accent))',
          'accent-foreground': 'hsl(var(--sidebar-accent-foreground))',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        display: ['"Space Grotesk"', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'monospace'],
      },
      borderRadius: {
        lg: 'var(--radius)',
        md: 'calc(var(--radius) - 2px)',
        sm: 'calc(var(--radius) - 4px)',
      },
      boxShadow: {
        card: '0 1px 3px rgba(0,0,0,0.2), 0 1px 2px rgba(0,0,0,0.3)',
        elevated: '0 4px 6px rgba(0,0,0,0.3), 0 2px 4px rgba(0,0,0,0.2)',
        modal: '0 20px 25px -5px rgba(0,0,0,0.4), 0 8px 10px -6px rgba(0,0,0,0.3)',
      },
      animation: {
        'fade-in': 'fadeIn 0.3s ease-out',
        'slide-up': 'slideUp 0.4s ease-out',
        'pulse-slow': 'pulse 3s ease-in-out infinite',
        'glow-pulse': 'glowPulse 3s ease-in-out infinite',
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
        glowPulse: {
          '0%, 100%': { opacity: '0.4' },
          '50%': { opacity: '0.8' },
        },
      },
    },
  },
  plugins: [],
};
