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
          950: "#060d09",
          900: "#0a1710",
          850: "#0d1e14",
          800: "#112a1b",
          700: "#183a26",
          600: "#1f4a30",
        },
        turf: {
          300: "#86efac",
          400: "#4ade80",
          500: "#22c55e",
          600: "#16a34a",
        },
        gold: {
          300: "#fcd34d",
          400: "#fbbf24",
          500: "#f59e0b",
          600: "#d97706",
        },
        ink: {
          DEFAULT: "#eaf3ec",
          muted: "#9db0a3",
          faint: "#6b7d72",
        },
      },
      fontFamily: {
        display: ["var(--font-display)", "ui-sans-serif", "system-ui", "sans-serif"],
        sans: ["var(--font-body)", "ui-sans-serif", "system-ui", "sans-serif"],
      },
      boxShadow: {
        card: "0 1px 0 0 rgba(255,255,255,0.04) inset, 0 12px 30px -12px rgba(0,0,0,0.6)",
        gold: "0 10px 40px -12px rgba(245,158,11,0.45)",
        turf: "0 10px 30px -12px rgba(34,197,94,0.4)",
      },
      keyframes: {
        shimmer: {
          "100%": { transform: "translateX(100%)" },
        },
        "fade-up": {
          "0%": { opacity: "0", transform: "translateY(6px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        "pulse-live": {
          "0%,100%": { opacity: "1" },
          "50%": { opacity: "0.35" },
        },
      },
      animation: {
        "fade-up": "fade-up 0.3s ease-out both",
        "pulse-live": "pulse-live 1.4s ease-in-out infinite",
      },
    },
  },
  plugins: [],
};

export default config;
