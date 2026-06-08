import type { ListingFilters } from "@/lib/listings";

export type SearchParamsRecord = {
  [key: string]: string | string[] | undefined;
};

function getString(param: string | string[] | undefined): string | undefined {
  if (param == null) return undefined;
  return typeof param === "string" ? param : param[0];
}

function getNumber(param: string | string[] | undefined): number | undefined {
  const s = getString(param);
  if (!s) return undefined;
  const n = parseInt(s, 10);
  return isNaN(n) ? undefined : n;
}

export type ParsedSearchParams = {
  filters: ListingFilters;
  checkIn?: string;
  checkOut?: string;
  adults?: number;
  children?: number;
  searchQueryStr: string;
  hasGuests: boolean;
  showPrice: boolean;
  guestsCount: number;
  hasActiveFilters: boolean;
};

/** URL searchParams → 필터·가격 표시 조건 (DB 조회 없음) */
export function parseSearchParams(params: SearchParamsRecord): ParsedSearchParams {
  const filters: ListingFilters = {};
  const loc = getString(params.location);
  if (loc) filters.location = loc;

  const adults = getNumber(params.adults);
  const children = getNumber(params.children);
  if (adults != null || children != null) {
    filters.guests = (adults ?? 1) + (children ?? 0);
  } else {
    const guests = getNumber(params.guests);
    if (guests != null) filters.guests = guests;
  }

  const minPrice = getNumber(params.minPrice);
  if (minPrice != null) filters.minPrice = minPrice;
  const maxPrice = getNumber(params.maxPrice);
  if (maxPrice != null) filters.maxPrice = maxPrice;

  const checkIn = getString(params.checkIn);
  if (checkIn) filters.checkIn = checkIn;
  const checkOut = getString(params.checkOut);
  if (checkOut) filters.checkOut = checkOut;

  const sort = getString(params.sort);
  if (sort) filters.sort = sort;

  const searchQuery = new URLSearchParams();
  if (checkIn) searchQuery.set("checkIn", checkIn);
  if (checkOut) searchQuery.set("checkOut", checkOut);
  if (adults != null) searchQuery.set("adults", String(adults));
  if (children != null) searchQuery.set("children", String(children));

  const hasGuests =
    adults != null || children != null || getNumber(params.guests) != null;
  const showPrice = !!(checkIn && checkOut && hasGuests);
  const guestsCount =
    adults != null || children != null
      ? (adults ?? 1) + (children ?? 0)
      : getNumber(params.guests) ?? 1;

  return {
    filters,
    checkIn,
    checkOut,
    adults,
    children,
    searchQueryStr: searchQuery.toString(),
    hasGuests,
    showPrice,
    guestsCount,
    hasActiveFilters: Object.keys(filters).length > 0,
  };
}
