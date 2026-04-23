import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#fff1f2',
          100: '#ffe4e6',
          500: '#f43f5e',
          600: '#e11d48',
          700: '#be123c',
          950: '#4c0519'
        }
      },
      boxShadow: {
        soft: '0 10px 40px rgba(15, 23, 42, 0.08)'
      },
      backgroundImage: {
        'hero-gradient': 'radial-gradient(circle at top, rgba(244,63,94,0.18), transparent 32%), linear-gradient(180deg, #0f172a 0%, #111827 100%)'
      }
    },
  },
  plugins: [],
};

export default config;
