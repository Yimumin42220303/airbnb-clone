import type { NightlyAvailabilityResult } from "@/lib/availability";

export type PriceUnavailableReason =
  | "dates_missing"
  | "unavailable"
  | "min_stay"
  | "fetch_error"
  | "exchange_rate_pending";

export type ListingPriceSummary = {
  listingId: string;
  currency: "JPY";
  nights: number;
  totalPrice: number;
  pricePerNight: number;
  guestCount: number;
  baseGuests: number;
  cleaningFee: number;
  extraGuestTotal: number;
  allAvailable: boolean;
  isEstimated: boolean;
  priceUnavailableReason?: PriceUnavailableReason;
  listingPricePerNight?: number;
};

/** guests NaN/0/음수 → 최소 1 (price API와 동일) */
export function normalizeGuestCount(guestCount: number): number {
  if (!Number.isFinite(guestCount) || guestCount < 1) return 1;
  return Math.floor(guestCount);
}

export type StayTotalBreakdown = {
  nightsCount: number;
  nightsTotal: number;
  cleaningFee: number;
  baseGuests: number;
  extraGuestFee: number;
  extraGuests: number;
  extraGuestTotal: number;
  totalPrice: number;
};

/**
 * GET /api/listings/[id]/price 와 동일한 총액 공식.
 * 일별 숙박 합 + cleaningFee + (초과 인원 × extraGuestFee × 박수)
 */
export function computeStayTotalFromNightly(
  result: NightlyAvailabilityResult,
  guestCount: number
): StayTotalBreakdown {
  const nightsCount = result.nights.length;
  const nightsTotal = result.nights.reduce((sum, n) => sum + n.pricePerNight, 0);
  const cleaningFee = result.cleaningFee ?? 0;
  const baseGuests = result.baseGuests ?? 2;
  const extraGuestFee = result.extraGuestFee ?? 0;
  const guests = normalizeGuestCount(guestCount);
  const extraGuests = Math.max(0, guests - baseGuests);
  const extraGuestTotal =
    nightsCount > 0 ? extraGuests * extraGuestFee * nightsCount : 0;
  const totalPrice = nightsTotal + cleaningFee + extraGuestTotal;

  return {
    nightsCount,
    nightsTotal,
    cleaningFee,
    baseGuests,
    extraGuestFee,
    extraGuests,
    extraGuestTotal,
    totalPrice,
  };
}

function resolveUnavailableReason(
  result: NightlyAvailabilityResult,
  nightsCount: number
): PriceUnavailableReason {
  if (nightsCount === 0) return "unavailable";
  const minNights = result.minStayNights ?? 1;
  if (nightsCount < minNights) return "min_stay";
  if (result.maxStayNights != null && nightsCount > result.maxStayNights) {
    return "unavailable";
  }
  if (!result.allAvailable) return "unavailable";
  return "unavailable";
}

/** listingId별 게스트-facing 요금 요약 (JPY 정수) */
export function buildListingPriceSummary(
  listingId: string,
  result: NightlyAvailabilityResult,
  guestCount: number
): ListingPriceSummary {
  const breakdown = computeStayTotalFromNightly(result, guestCount);
  const { nightsCount, totalPrice, cleaningFee, baseGuests, extraGuestTotal } =
    breakdown;

  const showable =
    nightsCount > 0 && result.allAvailable;

  if (!showable) {
    return {
      listingId,
      currency: "JPY",
      nights: nightsCount,
      totalPrice,
      pricePerNight: 0,
      guestCount: normalizeGuestCount(guestCount),
      baseGuests,
      cleaningFee,
      extraGuestTotal,
      allAvailable: false,
      isEstimated: false,
      priceUnavailableReason: resolveUnavailableReason(result, nightsCount),
      listingPricePerNight: result.listingPricePerNight,
    };
  }

  return {
    listingId,
    currency: "JPY",
    nights: nightsCount,
    totalPrice,
    pricePerNight: Math.round(totalPrice / nightsCount),
    guestCount: normalizeGuestCount(guestCount),
    baseGuests,
    cleaningFee,
    extraGuestTotal,
    allAvailable: true,
    isEstimated: false,
    listingPricePerNight: result.listingPricePerNight,
  };
}

/** batch-price API 실패 항목 */
export function buildFetchErrorPriceSummary(
  listingId: string,
  guestCount: number
): ListingPriceSummary {
  return {
    listingId,
    currency: "JPY",
    nights: 0,
    totalPrice: 0,
    pricePerNight: 0,
    guestCount: normalizeGuestCount(guestCount),
    baseGuests: 2,
    cleaningFee: 0,
    extraGuestTotal: 0,
    allAvailable: false,
    isEstimated: false,
    priceUnavailableReason: "fetch_error",
  };
}
