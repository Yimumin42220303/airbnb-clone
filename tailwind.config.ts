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
        // 도쿄민박 브랜드 컬러 (minbak.tokyo #D74132)
        "minbak-primary": "#D74132",
        "minbak-primary-hover": "#c0392b",
        "minbak-black": "#1a1a1a",
        "minbak-gray": "#525252",
        "minbak-light-gray": "#e5e5e5",
        "minbak-bg": "#fafafa",
        // 기존 클래스 호환
        "airbnb-red": "#D74132",
        "airbnb-dark": "#c0392b",
        "airbnb-black": "#1a1a1a",
        "airbnb-gray": "#525252",
        "airbnb-light-gray": "#e5e5e5",
        "airbnb-bg": "#f7f7f7",
        "minbak-dark-gray": "#374151",
        "minbak-pill-bg": "#f4f4f5",
      },
      fontFamily: {
        sans: ["var(--font-noto-sans-kr)", "Noto Sans KR", "system-ui", "sans-serif"],
      },
      borderRadius: {
        "airbnb": "12px",
        "airbnb-lg": "24px",
        "airbnb-xl": "32px",
        "airbnb-full": "9999px",
      },
      boxShadow: {
        "airbnb": "0 6px 16px rgba(0, 0, 0, 0.12)",
        "airbnb-lg": "0 6px 20px rgba(0, 0, 0, 0.16)",
        "airbnb-hover": "0 6px 20px rgba(0, 0, 0, 0.15)",
      },
      /* 글로벌 가시성 최적화: 본문·캡션 확대, 줄간격 상향 */
      fontSize: {
        "airbnb-caption": ["13px", "1.45"],
        "airbnb-body": ["15px", "1.55"],
        "airbnb-body-lg": ["16px", "1.6"],
        "airbnb-title": ["18px", "1.4"],
        "airbnb-h3": ["22px", "1.35"],
        "airbnb-h2": ["26px", "1.3"],
        "airbnb-h1": ["32px", "1.25"],
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
