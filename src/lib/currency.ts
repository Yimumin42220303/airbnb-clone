/**
 * 통화 유틸 - 게스트(KRW) / 호스트(JPY) 표시 분리
 * 저장 통화: KRW (기존 데이터 호환). 추후 JPY 마이그레이션 시 STORED_CURRENCY 변경
 * jpyToKrw: 1 JPY = X KRW (Frankfurter 등에서 조회, 미제공 시 fallback 사용)
 */

export type DisplayCurrency = "KRW" | "JPY";

/** 1 JPY = X KRW (환율 API 미제공 시 fallback) */
const FALLBACK_JPY_TO_KRW =
  typeof process !== "undefined" && process.env?.EXCHANGE_RATE_JPY_TO_KRW
    ? parseFloat(process.env.EXCHANGE_RATE_JPY_TO_KRW)
    : 10;

/** 현재 DB 저장 통화 (Phase 2: JPY) */
export const STORED_CURRENCY: DisplayCurrency = "JPY";

/**
 * JPY → KRW 변환
 */
export function convertJpyToKrw(amountJpy: number, jpyToKrw?: number): number {
  const rate = jpyToKrw ?? FALLBACK_JPY_TO_KRW;
  return Math.round(amountJpy * rate);
}

/**
 * KRW → JPY 변환
 */
export function convertKrwToJpy(amountKrw: number, jpyToKrw?: number): number {
  const rate = jpyToKrw ?? FALLBACK_JPY_TO_KRW;
  return Math.round(amountKrw / rate);
}

/**
 * 금액 포맷 (통화별) — Intl.NumberFormat으로 통화 기호(₩/¥) 명시
 */
export function formatPrice(amount: number, currency: DisplayCurrency): string {
  const n = Math.round(amount);
  return new Intl.NumberFormat(currency === "KRW" ? "ko-KR" : "ja-JP", {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
    minimumFractionDigits: 0,
  }).format(n);
}

/** 환율 인자 (1 JPY = X KRW). 미제공 시 env/fallback 사용 */
export type CurrencyOptions = { jpyToKrw?: number };

/**
 * 게스트용: KRW로 표시
 * (저장=KRW이면 그대로, 저장=JPY면 변환)
 */
export function formatForGuest(amountStored: number, options?: CurrencyOptions): string {
  const rate = options?.jpyToKrw;
  const amountKrw =
    STORED_CURRENCY === "JPY" ? convertJpyToKrw(amountStored, rate) : amountStored;
  return formatPrice(amountKrw, "KRW");
}

/**
 * 호스트용: JPY로 표시
 * (저장=KRW이면 변환, 저장=JPY면 그대로)
 */
export function formatForHost(amountStored: number, options?: CurrencyOptions): string {
  const rate = options?.jpyToKrw;
  const amountJpy =
    STORED_CURRENCY === "JPY" ? amountStored : convertKrwToJpy(amountStored, rate);
  return formatPrice(amountJpy, "JPY");
}

/**
 * 역할별 금액 포맷 (guest=KRW, host=JPY)
 */
export function formatPriceByRole(
  amount: number,
  role: "guest" | "host",
  options?: CurrencyOptions
): string {
  return role === "host" ? formatForHost(amount, options) : formatForGuest(amount, options);
}
