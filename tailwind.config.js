/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{js,jsx,ts,tsx}"],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        brand: "#002e3c",
        secondary: "#ffd700",
        success: "#2e7d32",
        error: "#d32f2f",
        primary: "rgb(var(--color-primary) / <alpha-value>)", // "ink": text/borders
        background: "rgb(var(--color-background) / <alpha-value>)", // page background
        surface: "rgb(var(--color-surface) / <alpha-value>)", // cards (was bg-white)
        "surface-2": "rgb(var(--color-surface-2) / <alpha-value>)", // inputs/insets
      },
      fontFamily: {
        headline: ["Space Grotesk", "sans-serif"],
        body: ["Inter", "sans-serif"],
      },
    },
  },
  plugins: [],
  corePlugins: {
    preflight: false,
  },
};
