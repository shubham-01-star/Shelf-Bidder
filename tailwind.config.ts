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
        "primary": "#ff5c61",
        "primary-dark": "#e64a4f",
        "background-light": "#f8f5f5",
        "background-dark": "#230f0f",
        "surface-light": "#ffffff",
        "surface-dark": "#2d1b1b",
        "text-main": "#1e293b",
        "text-sub": "#64748b",
      },
      fontFamily: {
        "display": ["Inter", "sans-serif"],
        "sans": ["Inter", "sans-serif"],
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
