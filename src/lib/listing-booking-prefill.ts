/**
 * 숙소 상세 BookingForm 조건 prefill — query 파싱·href 생성 (가격/예약 로직 무관)
 */

export type ListingBookingPrefillInput = {
  checkIn?: string;
  checkOut?: string;
  adults?: number;
  children?: number;
  infants?: number;
  /** analytics용 — BookingForm 로직에 사용하지 않음 */
  sourcePage?: string;
};

export type ParsedListingBookingPrefill = {
  initialCheckIn?: string;
  initialCheckOut?: string;
  initialAdults?: number;
  initialChildren?: number;
  initialInfants?: number;
  /** adults + children (유아 제외) */
  initialGuests?: number;
};

const ISO_DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

function getStringParam(
  param: string | string[] | undefined
): string | undefined {
  if (param == null) return undefined;
  const s = typeof param === "string" ? param : param[0];
  const trimmed = s?.trim();
  return trimmed ? trimmed : undefined;
}

function parseNonNegIntParam(raw: string | undefined): number | undefined {
  if (!raw) return undefined;
  const trimmed = raw.trim();
  if (!/^\d+$/.test(trimmed)) return undefined;
  const n = parseInt(trimmed, 10);
  return Number.isFinite(n) && n >= 0 ? n : undefined;
}

/** 타임존에 영향받지 않도록 UTC 달력 기준으로 검증 */
function isValidIsoDate(s: string): boolean {
  if (!ISO_DATE_RE.test(s)) return false;
  const [y, m, d] = s.split("-").map((n) => parseInt(n, 10));
  if (!y || m < 1 || m > 12 || d < 1 || d > 31) return false;
  const utc = new Date(Date.UTC(y, m - 1, d));
  return (
    utc.getUTCFullYear() === y &&
    utc.getUTCMonth() === m - 1 &&
    utc.getUTCDate() === d
  );
}

function parseValidDateRange(
  checkInRaw: string | undefined,
  checkOutRaw: string | undefined
): { checkIn?: string; checkOut?: string } {
  if (!checkInRaw || !checkOutRaw) return {};
  if (!isValidIsoDate(checkInRaw) || !isValidIsoDate(checkOutRaw)) return {};
  if (checkOutRaw <= checkInRaw) return {};
  return { checkIn: checkInRaw, checkOut: checkOutRaw };
}

type SearchParamsLike =
  | { [key: string]: string | string[] | undefined }
  | URLSearchParams;

function readParam(
  params: SearchParamsLike,
  key: string
): string | undefined {
  if (params instanceof URLSearchParams) {
    return params.get(key) ?? undefined;
  }
  return getStringParam(params[key]);
}

/** /listing/[id] query → BookingForm 초기값 (invalid 시 조용히 무시) */
export function parseListingBookingPrefill(
  params: SearchParamsLike
): ParsedListingBookingPrefill {
  const checkInRaw = readParam(params, "checkIn");
  const checkOutRaw = readParam(params, "checkOut");
  const dates = parseValidDateRange(checkInRaw, checkOutRaw);

  const adults = parseNonNegIntParam(readParam(params, "adults"));
  const children = parseNonNegIntParam(readParam(params, "children"));
  const infants = parseNonNegIntParam(readParam(params, "infants"));
  const guestsParam = parseNonNegIntParam(readParam(params, "guests"));

  const hasGuestParts = adults != null || children != null || guestsParam != null;
  let initialAdults: number | undefined;
  let initialChildren: number | undefined;
  let initialInfants: number | undefined;

  if (hasGuestParts) {
    const a = adults != null ? adults : guestsParam != null ? guestsParam : 1;
    initialAdults = a > 0 ? a : 1;
    initialChildren = children ?? 0;
    initialInfants = infants ?? 0;
  } else if (infants != null) {
    initialAdults = 1;
    initialChildren = 0;
    initialInfants = infants;
  }

  const initialGuests =
    initialAdults != null
      ? initialAdults + (initialChildren ?? 0)
      : undefined;

  return {
    ...dates,
    initialAdults,
    initialChildren,
    initialInfants,
    initialGuests: initialGuests != null && initialGuests > 0 ? initialGuests : undefined,
  };
}

/** 추천·검색 등 → 상세 페이지 query (가격 query 미포함) */
export function buildListingDetailSearchQuery(
  input: ListingBookingPrefillInput
): string {
  const sp = new URLSearchParams();
  const dates = parseValidDateRange(input.checkIn, input.checkOut);
  if (dates.checkIn) sp.set("checkIn", dates.checkIn);
  if (dates.checkOut) sp.set("checkOut", dates.checkOut);

  const adults = input.adults;
  const children = input.children ?? 0;
  const infants = input.infants ?? 0;
  const hasExplicitGuests =
    adults != null ||
    (input.children != null && input.children > 0) ||
    (input.infants != null && input.infants > 0);

  if (hasExplicitGuests) {
    const a = adults != null && adults > 0 ? adults : 1;
    sp.set("adults", String(a));
    if (children > 0) sp.set("children", String(children));
    if (infants > 0) sp.set("infants", String(infants));
    sp.set("guests", String(a + children));
  }

  if (input.sourcePage) sp.set("sourcePage", input.sourcePage);

  return sp.toString();
}

/** 서버 props와 클라이언트 URL query prefill 병합 (primary 우선, 없으면 fallback) */
export function mergeListingBookingPrefill(
  primary: ParsedListingBookingPrefill,
  fallback: ParsedListingBookingPrefill
): ParsedListingBookingPrefill {
  const initialAdults = primary.initialAdults ?? fallback.initialAdults;
  const initialChildren = primary.initialChildren ?? fallback.initialChildren;
  const initialGuests =
    primary.initialGuests ??
    fallback.initialGuests ??
    (initialAdults != null
      ? initialAdults + (initialChildren ?? 0)
      : undefined);

  return {
    initialCheckIn: primary.initialCheckIn ?? fallback.initialCheckIn,
    initialCheckOut: primary.initialCheckOut ?? fallback.initialCheckOut,
    initialAdults,
    initialChildren: primary.initialChildren ?? fallback.initialChildren,
    initialInfants: primary.initialInfants ?? fallback.initialInfants,
    initialGuests:
      initialGuests != null && initialGuests > 0 ? initialGuests : undefined,
  };
}

/** 추천·검색 등 → 숙소 상세 href (가격 query 미포함) */
export function buildListingDetailHref(
  listingId: string,
  input: ListingBookingPrefillInput
): string {
  const qs = buildListingDetailSearchQuery(input);
  return qs ? `/listing/${listingId}?${qs}` : `/listing/${listingId}`;
}
