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
          soft: 'rgba(255,196,38,0.15)',
        },
        base: '#1a1a1e',
        surface: {
          DEFAULT: '#242329',
          raised: '#28272e',
        },
        raised: '#27272a',
        border: {
          subtle: 'rgba(255,255,255,0.08)',
          raised: 'rgba(255,255,255,0.12)',
        },
        ink: {
          DEFAULT: '#f5f5f1',
          muted: '#9a9aa0',
          faint: '#6b6b72',
        },
        success: {
          DEFAULT: '#34d399',
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
      borderRadius: {
        xl2: '18px',
        '2xl2': '22px',
        '3xl2': '32px',
      },
      boxShadow: {
        'accent-glow': '0 10px 24px -6px rgba(255,196,38,0.5)',
        'accent-glow-lg': '0 12px 28px -8px rgba(255,196,38,0.5)',
        'card': '0 1px 0 rgba(255,255,255,0.06) inset, 0 0 0 1px rgba(255,255,255,0.08)',
        'device': '0 30px 60px -20px rgba(0,0,0,0.6), 0 0 0 1px rgba(255,255,255,0.06)',
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'gradient-conic': 'conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))',
        'accent-fill': 'linear-gradient(155deg, #FFD866, #FFC426)',
        'surface-fill': 'linear-gradient(160deg, #242329, #1e1d23)',
      },
      fontFamily: {
        display: ['var(--font-anton)', 'sans-serif'],
        label: ['var(--font-archivo)', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
export default config;
