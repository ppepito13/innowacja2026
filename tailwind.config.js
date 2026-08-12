/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{js,jsx,ts,tsx}"],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        cb: {
          yellow: "rgb(var(--cb-yellow) / <alpha-value>)",
          petrol: "rgb(var(--cb-petrol) / <alpha-value>)",
          sand: "rgb(var(--cb-sand) / <alpha-value>)",

          coast: "rgb(var(--cb-coast) / <alpha-value>)",
          mint: "rgb(var(--cb-mint) / <alpha-value>)",
          pistachio: "rgb(var(--cb-pistachio) / <alpha-value>)",
          harvest: "rgb(var(--cb-harvest) / <alpha-value>)",
          maple: "rgb(var(--cb-maple) / <alpha-value>)",
          clay: "rgb(var(--cb-clay) / <alpha-value>)",

          "coast-60": "rgb(var(--cb-coast-60) / <alpha-value>)",
          "mint-60": "rgb(var(--cb-mint-60) / <alpha-value>)",
          "pistachio-60": "rgb(var(--cb-pistachio-60) / <alpha-value>)",
          "harvest-60": "rgb(var(--cb-harvest-60) / <alpha-value>)",
          "maple-60": "rgb(var(--cb-maple-60) / <alpha-value>)",
          "clay-60": "rgb(var(--cb-clay-60) / <alpha-value>)",

          "grad-1": "rgb(var(--cb-grad-1) / <alpha-value>)",
          "grad-2": "rgb(var(--cb-grad-2) / <alpha-value>)",
          "grad-3": "rgb(var(--cb-grad-3) / <alpha-value>)",
          "grad-4": "rgb(var(--cb-grad-4) / <alpha-value>)",
          "grad-5": "rgb(var(--cb-grad-5) / <alpha-value>)",
          "grad-6": "rgb(var(--cb-grad-6) / <alpha-value>)",

          error: "rgb(var(--cb-error) / <alpha-value>)",
          success: "rgb(var(--cb-success) / <alpha-value>)",
          warning: "rgb(var(--cb-warning) / <alpha-value>)",

          white: "rgb(var(--cb-white) / <alpha-value>)",
          black: "rgb(var(--cb-black) / <alpha-value>)",
        },

        brand: "rgb(var(--cb-petrol) / <alpha-value>)",
        secondary: "rgb(var(--cb-yellow) / <alpha-value>)",

        primary: "rgb(var(--color-primary) / <alpha-value>)", // "ink": text/borders
        background: "rgb(var(--color-background) / <alpha-value>)", // page background
        surface: "rgb(var(--color-surface) / <alpha-value>)", // cards (was bg-white)
        "surface-2": "rgb(var(--color-surface-2) / <alpha-value>)", // inputs/insets

        success: "rgb(var(--color-success) / <alpha-value>)",
        error: "rgb(var(--color-error) / <alpha-value>)",
        warning: "rgb(var(--color-warning) / <alpha-value>)",
      },
      fontFamily: {
        headline: ["Gotham", "sans-serif"],
        body: ["Gotham", "sans-serif"],
      },
    },
    fontWeight: {
      book: "400",
      bold: "700",
    },
  },
  plugins: [],
  corePlugins: {
    preflight: false,
  },
};
