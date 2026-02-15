/**
 * 도쿄민박 디자인 토큰
 * tailwind.config.ts 와 동기화 — 코드에서 직접 참조하거나 문서용으로 사용
 */

export const colors = {
  primary: "#D74132",
  primaryHover: "#c0392b",
  black: "#1a1a1a",
  gray: "#525252",
  darkGray: "#374151",
  lightGray: "#e5e5e5",
  bg: "#fafafa",
  pillBg: "#f4f4f5",
  white: "#FFFFFF",
} as const;

export const borderRadius = {
  sm: "8px",
  md: "12px",
  lg: "24px",
  xl: "32px",
  full: "9999px",
} as const;

export const spacing = {
  section: "80px",
  card: "16px",
  input: "12px 16px",
} as const;

export const typography = {
  caption: { fontSize: "13px", lineHeight: 1.45 },
  body: { fontSize: "15px", lineHeight: 1.55 },
  bodyLg: { fontSize: "16px", lineHeight: 1.6 },
  title: { fontSize: "18px", lineHeight: 1.4 },
  h3: { fontSize: "22px", lineHeight: 1.35 },
  h2: { fontSize: "26px", lineHeight: 1.3 },
  h1: { fontSize: "32px", lineHeight: 1.25 },
} as const;
