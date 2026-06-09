/** GA4 측정 ID. 환경 변수로 덮어쓸 수 있음. */
export const GA_MEASUREMENT_ID =
  process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID?.trim() ??
  (process.env.NODE_ENV === "production" ? "G-CCS31R4BBT" : "");

export function isGoogleAnalyticsEnabled(): boolean {
  return /^G-[A-Z0-9]+$/i.test(GA_MEASUREMENT_ID);
}

declare global {
  interface Window {
    gtag?: (...args: unknown[]) => void;
    dataLayer?: unknown[];
  }
}

/** App Router 클라이언트 내비게이션·최초 로드 후 page_path 갱신 */
export function gaPageView(path: string) {
  try {
    if (!isGoogleAnalyticsEnabled() || typeof window === "undefined") return;
    if (typeof window.gtag !== "function") return;
    window.gtag("config", GA_MEASUREMENT_ID, {
      page_path: path,
    });
  } catch {
    // silently ignore analytics errors
  }
}
