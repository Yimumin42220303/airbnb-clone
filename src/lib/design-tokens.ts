/**
 * Airbnb Clone - 디자인 시스템 토큰
 * 컴포넌트에서 일관된 스타일 적용 시 참조
 */

export const colors = {
  primary: "#FF5A5F",
  primaryHover: "#FF385C",
  black: "#222222",
  gray: "#717171",
  lightGray: "#EBEBEB",
  bg: "#F7F7F7",
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
  caption: { fontSize: "12px", lineHeight: 1.2 },
  body: { fontSize: "14px", lineHeight: 1.4 },
  bodyLg: { fontSize: "16px", lineHeight: 1.5 },
  title: { fontSize: "18px", lineHeight: 1.3 },
  h3: { fontSize: "22px", lineHeight: 1.3 },
  h2: { fontSize: "26px", lineHeight: 1.2 },
  h1: { fontSize: "32px", lineHeight: 1.2 },
} as const;
