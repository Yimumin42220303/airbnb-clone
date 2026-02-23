/**
 * Frankfurter API 연동 - JPY/KRW 환율
 * https://www.frankfurter.app/docs
 * 일 1회 갱신, 캐시 24시간
 */

const FRANKFURTER_URL = "https://api.frankfurter.dev/v1/latest";
const CACHE_TTL_MS = 24 * 60 * 60 * 1000; // 24시간
const FALLBACK_RATE = 10; // 1 JPY ≈ 10 KRW (API 실패 시)

let cached: { rate: number; expiresAt: number } | null = null;

/**
 * Frankfurter API에서 1 JPY = X KRW 환율 조회 (캐시 사용)
 */
export async function getJpyToKrwRate(): Promise<number> {
  if (cached && Date.now() < cached.expiresAt) {
    return cached.rate;
  }

  try {
    const res = await fetch(`${FRANKFURTER_URL}?base=JPY&symbols=KRW`);
    if (!res.ok) throw new Error(`Frankfurter ${res.status}`);

    const data = (await res.json()) as { rates?: { KRW?: number } };
    const rate = data?.rates?.KRW;
    if (typeof rate !== "number" || rate <= 0) throw new Error("Invalid rate");

    cached = { rate, expiresAt: Date.now() + CACHE_TTL_MS };
    return rate;
  } catch (e) {
    if (cached) return cached.rate;
    return FALLBACK_RATE;
  }
}
