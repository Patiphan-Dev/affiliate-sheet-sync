import type { Config } from 'tailwindcss';

/** Themeable tokens resolve from CSS vars set in globals.css (:root / :root.dark). */
const v = (name: string) => `rgb(var(${name}) / <alpha-value>)`;

const config: Config = {
  darkMode: 'class',
  content: ['./src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        // fixed across themes — the campfire orange
        brand: { DEFAULT: '#ee4d2d', dark: '#d73211', deep: '#f53d2d' },
        price: 'rgb(var(--price) / <alpha-value>)',
        gold: '#d0011b',
        // themeable
        page: v('--bg-page'),
        surface: v('--bg-surface'),
        ink: v('--ink'),
        subtle: v('--subtle'),
        hairline: v('--hairline'),
      },
      fontFamily: {
        sans: ['var(--font-body)', 'ui-sans-serif', 'system-ui', 'sans-serif'],
      },
      maxWidth: { content: '75rem' },
      boxShadow: {
        card: '0 1px 4px rgba(0,0,0,.08)',
        cardhover: '0 2px 12px rgba(0,0,0,.16)',
      },
    },
  },
  plugins: [],
};

export default config;
