import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        // marketplace / Shopee-style palette
        brand: { DEFAULT: '#ee4d2d', dark: '#d73211', deep: '#f53d2d' },
        price: '#ee4d2d',
        page: '#f5f5f5',
        ink: '#222222',
        subtle: '#757575',
        hairline: '#e5e5e5',
        gold: '#d0011b',
      },
      fontFamily: {
        sans: ['var(--font-body)', 'ui-sans-serif', 'system-ui', 'sans-serif'],
      },
      maxWidth: { content: '75rem' },
      boxShadow: {
        card: '0 1px 4px rgba(0,0,0,.08)',
        cardhover: '0 2px 12px rgba(0,0,0,.14)',
      },
    },
  },
  plugins: [],
};

export default config;
