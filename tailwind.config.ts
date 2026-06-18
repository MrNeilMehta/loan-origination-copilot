import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        ink: "#0e1b22",
        slatebg: "#f4f6f7",
        accent: "#0f6e6e",
        accentdark: "#0a5252",
        warn: "#b45309",
        danger: "#b91c1c",
      },
      fontFamily: {
        sans: ["var(--font-sans)", "ui-sans-serif", "system-ui", "sans-serif"],
        mono: ["ui-monospace", "SFMono-Regular", "Menlo", "monospace"],
      },
      fontVariantNumeric: ["tabular-nums"],
    },
  },
  plugins: [],
};
export default config;
