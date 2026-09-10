import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        field: {
          950: "#07130c",
          900: "#0b1f13",
          800: "#0f2a19",
          700: "#15351f",
        },
        turf: {
          400: "#4ade80",
          500: "#22c55e",
          600: "#16a34a",
        },
        chalk: "#f8fafc",
      },
      fontFamily: {
        sans: ["ui-sans-serif", "system-ui", "-apple-system", "Segoe UI", "Roboto", "Helvetica", "Arial", "sans-serif"],
      },
    },
  },
  plugins: [],
};

export default config;
