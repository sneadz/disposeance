import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        accent: {
          DEFAULT: '#FFC426',
          fg: '#0A0A0A',
        },
        base: '#09090b',
        surface: '#18181b',
        raised: '#27272a',
        success: {
          DEFAULT: '#10b981',
          indicator: '#34d399',
          fg: '#6ee7b7',
        },
        danger: {
          DEFAULT: '#ef4444',
          solid: '#dc2626',
          fg: '#f87171',
          deep: '#2a0a0a',
          dim: '#5f1f1f',
        },
      },
      backgroundImage: {
        "gradient-radial": "radial-gradient(var(--tw-gradient-stops))",
        "gradient-conic":
          "conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))",
      },
    },
  },
  plugins: [],
};
export default config;
