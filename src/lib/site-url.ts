/**
 * 사이트 공개 URL (canonical, OG, sitemap, JSON-LD 등).
 * - NEXT_PUBLIC_APP_URL 설정 시 그대로 사용 (운영: https://tokyominbak.net 권장).
 * - Vercel 배포 시 미설정이면 VERCEL_URL 사용 (xxx.vercel.app 또는 커스텀 도메인).
 * - 로컬은 tokyominbak.example.com fallback (실제 로컬은 .env에서 NEXT_PUBLIC_APP_URL=http://localhost:3000 권장).
 */
export const BASE_URL =
  process.env.NEXT_PUBLIC_APP_URL ||
  (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "https://tokyominbak.example.com");
