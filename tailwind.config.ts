import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    screens: {
      sm: "640px",
      md: "768px",
      lg: "1024px",
      xl: "1240px",
      "2xl": "1280px",
    },
    extend: {
      colors: {
        /* ── 도쿄민박 브랜드 ── */
        "minbak-primary": "#D74132",
        "minbak-primary-hover": "#c0392b",
        "minbak-black": "#1a1a1a",
        "minbak-gray": "#525252",
        "minbak-dark-gray": "#374151",
        "minbak-light-gray": "#e5e5e5",
        "minbak-bg": "#fafafa",
        "minbak-pill-bg": "#f4f4f5",
      },
      fontFamily: {
        sans: ["var(--font-noto-sans-kr)", "Noto Sans KR", "system-ui", "sans-serif"],
      },
      borderRadius: {
        "minbak": "12px",
        "minbak-lg": "24px",
        "minbak-xl": "32px",
        "minbak-full": "9999px",
      },
      boxShadow: {
        "minbak": "0 6px 16px rgba(0, 0, 0, 0.12)",
        "minbak-lg": "0 6px 20px rgba(0, 0, 0, 0.16)",
        "minbak-hover": "0 6px 20px rgba(0, 0, 0, 0.15)",
      },
      /* 글로벌 가시성 최적화: 본문·캡션 확대, 줄간격 상향 */
      fontSize: {
        "minbak-caption": ["13px", "1.45"],
        "minbak-body": ["15px", "1.55"],
        "minbak-body-lg": ["16px", "1.6"],
        "minbak-title": ["18px", "1.4"],
        "minbak-h3": ["22px", "1.35"],
        "minbak-h2": ["26px", "1.3"],
        "minbak-h1": ["32px", "1.25"],
        "framer-h1": ["36px", "1.25"],
        "framer-h2": ["24px", "1.3"],
      },
      spacing: {
        "navbar": "80px",
      },
    },
  },
  plugins: [],
};

export default config;
