import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['var(--font-lexend)', 'sans-serif'],
        brand: ['var(--font-space)', 'sans-serif'],
      },
      colors: {
        background: 'var(--bg-primary)',
        foreground: 'var(--text-primary)',
        // Match Stitch custom colors
        brand: {
          green: '#0df259',
          greenDark: '#11d452',
          violet: '#8c25f4',
        }
      },
    },
  },
  plugins: [],
};
export default config;
