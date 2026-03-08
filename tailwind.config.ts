import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        "primary": "#0ba6da",
        "primary-dark": "#0284c7",
        "accent-teal": "#0d9488",
        "accent-red": "#e11d48",
        "background-light": "#F8F5F5",
        "background-dark": "#101e22",
        "surface-light": "#ffffff",
        "surface-dark": "#1e293b",
        "text-main": "#0f172a",
        "text-sub": "#64748b",
      },
      fontFamily: {
        "display": ["var(--font-space-grotesk)", "sans-serif"],
        "sans": ["var(--font-inter)", "sans-serif"],
      },
      boxShadow: {
        "soft": "0 4px 20px -2px rgba(0, 0, 0, 0.05)",
        "float": "0 8px 30px -4px rgba(0, 0, 0, 0.1)",
      }
    },
  },
  plugins: [],
};
export default config;
