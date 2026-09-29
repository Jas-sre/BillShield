import type { Config } from 'tailwindcss';

/**
 * BillShield design tokens.
 *
 * Semantic colours (canvas / surface / ink / line / status) are CSS variables so
 * the light and dark themes swap in one place — see `src/index.css`.
 * Brand colours stay fixed because they read well on both surfaces.
 */
const config: Config = {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        canvas: 'rgb(var(--bs-canvas) / <alpha-value>)',
        surface: 'rgb(var(--bs-surface) / <alpha-value>)',
        raise: 'rgb(var(--bs-raise) / <alpha-value>)',
        scrim: 'rgb(var(--bs-scrim) / <alpha-value>)',
        ink: {
          DEFAULT: 'rgb(var(--bs-ink) / <alpha-value>)',
          muted: 'rgb(var(--bs-ink-muted) / <alpha-value>)',
          soft: 'rgb(var(--bs-ink-soft) / <alpha-value>)',
        },
        line: 'rgb(var(--bs-line) / <alpha-value>)',
        primary: {
          DEFAULT: '#0F766E',
          strong: 'rgb(var(--bs-primary-strong) / <alpha-value>)',
          dark: 'rgb(var(--bs-primary-dark) / <alpha-value>)',
          light: '#14B8A6',
          soft: 'rgb(var(--bs-primary-soft) / <alpha-value>)',
          ring: '#0D9488',
        },
        accent: {
          DEFAULT: '#4F46E5',
          dark: 'rgb(var(--bs-accent-dark) / <alpha-value>)',
          soft: 'rgb(var(--bs-accent-soft) / <alpha-value>)',
        },
        success: {
          DEFAULT: 'rgb(var(--bs-success) / <alpha-value>)',
          soft: 'rgb(var(--bs-success-soft) / <alpha-value>)',
        },
        warn: {
          DEFAULT: 'rgb(var(--bs-warn) / <alpha-value>)',
          soft: 'rgb(var(--bs-warn-soft) / <alpha-value>)',
          line: 'rgb(var(--bs-warn-line) / <alpha-value>)',
        },
        danger: {
          DEFAULT: 'rgb(var(--bs-danger) / <alpha-value>)',
          soft: 'rgb(var(--bs-danger-soft) / <alpha-value>)',
        },
      },
      fontFamily: {
        sans: [
          'Inter',
          'ui-sans-serif',
          'system-ui',
          '-apple-system',
          'Segoe UI',
          'Roboto',
          'Noto Sans Tamil',
          'sans-serif',
        ],
      },
      borderRadius: {
        card: '18px',
        pill: '999px',
      },
      boxShadow: {
        card: '0 1px 2px rgba(15,42,38,0.04), 0 12px 28px -18px rgba(15,42,38,0.22)',
        lifted: '0 2px 6px rgba(15,42,38,0.06), 0 22px 45px -24px rgba(15,42,38,0.32)',
        inset: 'inset 0 1px 0 rgba(255,255,255,0.6)',
      },
      keyframes: {
        'fade-up': {
          from: { opacity: '0', transform: 'translateY(8px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
        'toast-in': {
          from: { opacity: '0', transform: 'translateY(12px) scale(0.98)' },
          to: { opacity: '1', transform: 'translateY(0) scale(1)' },
        },
      },
      animation: {
        'fade-up': 'fade-up 0.32s ease-out both',
        'toast-in': 'toast-in 0.24s ease-out both',
      },
    },
  },
  plugins: [],
};

export default config;
