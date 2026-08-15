import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./lib/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        obsidian: {
          950: "var(--bg)",
          900: "var(--bg-2)",
          800: "var(--bg-800)",
          700: "var(--bg-700)",
        },
        gold: {
          100: "var(--accent-100)",
          200: "var(--accent-200)",
          300: "var(--accent-300)",
          400: "var(--accent-400)",
          500: "var(--accent-500)",
          600: "var(--accent-600)",
          700: "var(--accent-700)",
        },
      },
      fontFamily: {
        sans: ["var(--font-cairo)", "var(--font-tajawal)", "system-ui", "sans-serif"],
        display: ["var(--font-orbitron)", "var(--font-cairo)", "sans-serif"],
      },
      boxShadow: {
        gold: "0 0 25px rgba(var(--accent-rgb), 0.15)",
        "gold-lg": "0 0 45px rgba(var(--accent-rgb), 0.25)",
        "gold-glow": "0 4px 30px -4px rgba(var(--accent-rgb), 0.4)",
      },
      keyframes: {
        ticker: {
          "0%": { transform: "translateX(0)" },
          "100%": { transform: "translateX(-50%)" },
        },
        shimmer: {
          "0%": { transform: "translateX(-100%)" },
          "100%": { transform: "translateX(100%)" },
        },
        float: {
          "0%,100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-8px)" },
        },
        dust: {
          "0%": { transform: "translateY(0) translateX(0)", opacity: "0" },
          "20%": { opacity: "1" },
          "100%": { transform: "translateY(-100vh) translateX(40px)", opacity: "0" },
        },
      },
      animation: {
        ticker: "ticker 40s linear infinite",
        shimmer: "shimmer 2.5s infinite",
        float: "float 6s ease-in-out infinite",
        dust: "dust 12s linear infinite",
      },
    },
  },
  plugins: [],
};
export default config;
