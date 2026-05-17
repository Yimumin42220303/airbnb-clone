import type { Prisma } from "@prisma/client";
import { prisma } from "./prisma";
import { getExternalBlockedDateKeys, getExternalCheckoutOnlyDateKeys } from "./ical";
import { getBeds24CalendarPrices } from "./beds24";
import { mapWithConcurrency } from "./map-with-concurrency";

/** 검색 다건: Beds24·ICS 등 외부 호출 동시성 (과도한 병렬 요청 방지) */
const NIGHTLY_EXTERNAL_CONCURRENCY = 6;

/**
 * DB 예약이 실제로 일정을 막는 조건 (캘린더·겹침·검색·일별 가용성 공통).
 * 미결제·호스트 미승인(pending) 건은 제외.
 */
export const listingSlotOccupiedWhere = {
  status: "confirmed" as const,
  paymentStatus: "paid" as const,
};

/**
 * 해당 기간에 결제 완료된 확정 예약과 겹치는지 (자기 예약은 excludeBookingId로 제외).
 */
export async function hasOverlappingPaidBooking(
  listingId: string,
  checkIn: Date,
  checkOut: Date,
  excludeBookingId?: string
): Promise<boolean> {
  const overlap = await prisma.booking.findFirst({
    where: {
      listingId,
      ...listingSlotOccupiedWhere,
      checkIn: { lt: checkOut },
      checkOut: { gt: checkIn },
      ...(excludeBookingId ? { id: { not: excludeBookingId } } : {}),
    },
  });
  return !!overlap;
}

/**
 * 날짜 문자열 YYYY-MM-DD 생성 (로컬 타임존)
 */
export function toDateKey(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

/**
 * 날짜 문자열 YYYY-MM-DD 생성 (UTC). DB에 UTC로 저장된 DateTime용.
 */
export function toDateKeyUTC(d: Date): string {
  const y = d.getUTCFullYear();
  const m = String(d.getUTCMonth() + 1).padStart(2, "0");
  const day = String(d.getUTCDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

/**
 * checkIn ~ checkOut-1 일별 날짜 키 배열
 */
export function getDateKeysBetween(checkIn: Date, checkOut: Date): string[] {
  const keys: string[] = [];
  const start = new Date(checkIn);
  start.setHours(0, 0, 0, 0);
  const end = new Date(checkOut);
  end.setHours(0, 0, 0, 0);
  const cur = new Date(start);
  while (cur < end) {
    keys.push(toDateKey(cur));
    cur.setDate(cur.getDate() + 1);
  }
  return keys;
}

export type NightlyPrice = {
  date: string;
  pricePerNight: number;
  available: boolean;
};

export type NightlyAvailabilityResult = {
  listingPricePerNight: number;
  cleaningFee: number;
  baseGuests: number;
  extraGuestFee: number;
  nights: NightlyPrice[];
  totalPrice: number;
  allAvailable: boolean;
  minStayNights: number;
  maxStayNights: number | null;
};

const nightlyListingSelect = {
  id: true,
  pricePerNight: true,
  cleaningFee: true,
  baseGuests: true,
  extraGuestFee: true,
  minStayNights: true,
  maxStayNights: true,
  januaryFactor: true,
  februaryFactor: true,
  marchFactor: true,
  aprilFactor: true,
  mayFactor: true,
  juneFactor: true,
  julyFactor: true,
  augustFactor: true,
  septemberFactor: true,
  octoberFactor: true,
  novemberFactor: true,
  decemberFactor: true,
  beds24Enabled: true,
  beds24PropId: true,
  beds24RoomId: true,
  beds24AccountKey: true,
  beds24PriceMultiplier: true,
  beds24JanuaryFactor: true,
  beds24FebruaryFactor: true,
  beds24MarchFactor: true,
  beds24AprilFactor: true,
  beds24MayFactor: true,
  beds24JuneFactor: true,
  beds24JulyFactor: true,
  beds24AugustFactor: true,
  beds24SeptemberFactor: true,
  beds24OctoberFactor: true,
  beds24NovemberFactor: true,
  beds24DecemberFactor: true,
  icalImportUrls: true,
} as const;

type NightlyListingRow = Prisma.ListingGetPayload<{
  select: typeof nightlyListingSelect;
}>;

function buildNightlyResultForListing(
  l: NightlyListingRow,
  dateKeys: string[],
  byDate: Map<string, { date: string; available: boolean; pricePerNight: number | null }>,
  externalBlocked: Set<string>,
  internalBlocked: Set<string>,
  beds24Prices: Map<string, number>
): NightlyAvailabilityResult {
  const cleaningFee = l.cleaningFee ?? 0;
  const baseGuests = l.baseGuests ?? 2;
  const extraGuestFee = l.extraGuestFee ?? 0;
  const minNights = l.minStayNights ?? 1;
  const maxNights = l.maxStayNights ?? null;

  if (dateKeys.length === 0) {
    return {
      listingPricePerNight: l.pricePerNight,
      baseGuests,
      extraGuestFee,
      cleaningFee: l.cleaningFee ?? 0,
      nights: [],
      totalPrice: 0,
      allAvailable: false,
      minStayNights: minNights,
      maxStayNights: maxNights,
    };
  }

  const useBeds24Prices =
    (l.beds24Enabled ?? false) ||
    !!(l.beds24PropId?.trim() && l.beds24RoomId?.trim());

  function getMonthFactor(dateKey: string): number {
    const month = parseInt(dateKey.slice(5, 7), 10);
    switch (month) {
      case 1:
        return l.januaryFactor ?? 1.0;
      case 2:
        return l.februaryFactor ?? 1.0;
      case 3:
        return l.marchFactor ?? 1.0;
      case 4:
        return l.aprilFactor ?? 1.0;
      case 5:
        return l.mayFactor ?? 1.0;
      case 6:
        return l.juneFactor ?? 1.0;
      case 7:
        return l.julyFactor ?? 1.0;
      case 8:
        return l.augustFactor ?? 1.0;
      case 9:
        return l.septemberFactor ?? 1.0;
      case 10:
        return l.octoberFactor ?? 1.0;
      case 11:
        return l.novemberFactor ?? 1.0;
      case 12:
        return l.decemberFactor ?? 1.0;
      default:
        return 1.0;
    }
  }

  function getBeds24MonthFactor(dateKey: string): number {
    const month = parseInt(dateKey.slice(5, 7), 10);
    const fallback =
      l.beds24PriceMultiplier != null && l.beds24PriceMultiplier > 0
        ? l.beds24PriceMultiplier
        : 1;
    switch (month) {
      case 1:
        return l.beds24JanuaryFactor != null && l.beds24JanuaryFactor > 0
          ? l.beds24JanuaryFactor
          : fallback;
      case 2:
        return l.beds24FebruaryFactor != null && l.beds24FebruaryFactor > 0
          ? l.beds24FebruaryFactor
          : fallback;
      case 3:
        return l.beds24MarchFactor != null && l.beds24MarchFactor > 0
          ? l.beds24MarchFactor
          : fallback;
      case 4:
        return l.beds24AprilFactor != null && l.beds24AprilFactor > 0
          ? l.beds24AprilFactor
          : fallback;
      case 5:
        return l.beds24MayFactor != null && l.beds24MayFactor > 0
          ? l.beds24MayFactor
          : fallback;
      case 6:
        return l.beds24JuneFactor != null && l.beds24JuneFactor > 0
          ? l.beds24JuneFactor
          : fallback;
      case 7:
        return l.beds24JulyFactor != null && l.beds24JulyFactor > 0
          ? l.beds24JulyFactor
          : fallback;
      case 8:
        return l.beds24AugustFactor != null && l.beds24AugustFactor > 0
          ? l.beds24AugustFactor
          : fallback;
      case 9:
        return l.beds24SeptemberFactor != null && l.beds24SeptemberFactor > 0
          ? l.beds24SeptemberFactor
          : fallback;
      case 10:
        return l.beds24OctoberFactor != null && l.beds24OctoberFactor > 0
          ? l.beds24OctoberFactor
          : fallback;
      case 11:
        return l.beds24NovemberFactor != null && l.beds24NovemberFactor > 0
          ? l.beds24NovemberFactor
          : fallback;
      case 12:
        return l.beds24DecemberFactor != null && l.beds24DecemberFactor > 0
          ? l.beds24DecemberFactor
          : fallback;
      default:
        return fallback;
    }
  }

  const nights: NightlyPrice[] = dateKeys.map((date) => {
    const row = byDate.get(date);
    const available =
      (row ? row.available : true) &&
      !externalBlocked.has(date) &&
      !internalBlocked.has(date);
    const factor = getMonthFactor(date);
    const basePrice = Math.round(l.pricePerNight * factor);
    const beds24Mult = getBeds24MonthFactor(date);
    let pricePerNight: number;
    if (useBeds24Prices && beds24Prices.has(date)) {
      pricePerNight = Math.round(beds24Prices.get(date)! * beds24Mult);
    } else if (useBeds24Prices && row?.pricePerNight != null) {
      pricePerNight = Math.round(row.pricePerNight * beds24Mult);
    } else if (row?.pricePerNight != null) {
      pricePerNight = row.pricePerNight;
    } else {
      pricePerNight = basePrice;
    }
    return { date, pricePerNight, available };
  });

  let allAvailable = nights.every((n) => n.available);
  const nightsCount = nights.length;
  if (nightsCount < minNights) allAvailable = false;
  if (maxNights != null && nightsCount > maxNights) allAvailable = false;
  const nightsTotal = nights.reduce((sum, n) => sum + n.pricePerNight, 0);
  const totalPrice = nightsTotal + cleaningFee;

  return {
    listingPricePerNight: l.pricePerNight,
    baseGuests,
    extraGuestFee,
    cleaningFee,
    nights,
    totalPrice,
    allAvailable,
    minStayNights: minNights,
    maxStayNights: maxNights,
  };
}

/**
 * 여러 숙소에 대해 동일 숙박 기간의 일별 요금·가용성을 한 번에 계산.
 * DB(가용성·예약)는 배치 조회, 외부(Beds24·ICS)는 동시성 제한.
 */
export async function getNightlyAvailabilityForListings(
  listingIds: string[],
  checkIn: Date,
  checkOut: Date
): Promise<Map<string, NightlyAvailabilityResult>> {
  const out = new Map<string, NightlyAvailabilityResult>();
  if (listingIds.length === 0) return out;

  const uniqueIds = Array.from(new Set(listingIds));
  const dateKeys = getDateKeysBetween(checkIn, checkOut);
  const dateKeySet = new Set(dateKeys);

  const listings = await prisma.listing.findMany({
    where: { id: { in: uniqueIds } },
    select: nightlyListingSelect,
  });
  const listingMap = new Map(listings.map((x) => [x.id, x]));

  if (dateKeys.length === 0) {
    for (const id of uniqueIds) {
      const l = listingMap.get(id);
      if (!l) continue;
      out.set(id, buildNightlyResultForListing(l, dateKeys, new Map(), new Set(), new Set(), new Map()));
    }
    return out;
  }

  const [availabilityRows, overlappingBookings] = await Promise.all([
    prisma.listingAvailability.findMany({
      where: {
        listingId: { in: uniqueIds },
        date: { in: dateKeys },
      },
    }),
    prisma.booking.findMany({
      where: {
        listingId: { in: uniqueIds },
        ...listingSlotOccupiedWhere,
        checkIn: { lt: checkOut },
        checkOut: { gt: checkIn },
      },
      select: { listingId: true, checkIn: true, checkOut: true },
    }),
  ]);

  const availByListing = new Map<string, Map<string, (typeof availabilityRows)[number]>>();
  for (const row of availabilityRows) {
    let m = availByListing.get(row.listingId);
    if (!m) {
      m = new Map();
      availByListing.set(row.listingId, m);
    }
    m.set(row.date, row);
  }

  const bookingsByListing = new Map<
    string,
    Array<{ checkIn: Date; checkOut: Date }>
  >();
  for (const b of overlappingBookings) {
    const arr = bookingsByListing.get(b.listingId) ?? [];
    arr.push({ checkIn: b.checkIn, checkOut: b.checkOut });
    bookingsByListing.set(b.listingId, arr);
  }

  const idsWithListing = uniqueIds.filter((id) => listingMap.has(id));
  const metaList = await mapWithConcurrency(
    idsWithListing,
    NIGHTLY_EXTERNAL_CONCURRENCY,
    async (id) => {
      const l = listingMap.get(id)!;
      const useBeds24Prices =
        (l.beds24Enabled ?? false) ||
        !!(l.beds24PropId?.trim() && l.beds24RoomId?.trim());
      let beds24Prices = new Map<string, number>();
      if (useBeds24Prices && l.beds24PropId?.trim() && l.beds24RoomId?.trim()) {
        try {
          beds24Prices = await getBeds24CalendarPrices(
            l.beds24PropId.trim(),
            l.beds24RoomId.trim(),
            checkIn,
            checkOut,
            l.beds24AccountKey ?? null
          );
        } catch (_) {
          /* API 실패 시 DB·도쿄민박 fallback */
        }
      }
      const externalBlocked = await getExternalBlockedDateKeys(
        {
          icalImportUrls: l.icalImportUrls,
          beds24Enabled: l.beds24Enabled,
          beds24PropId: l.beds24PropId,
          beds24RoomId: l.beds24RoomId,
          beds24AccountKey: l.beds24AccountKey ?? null,
        },
        checkIn,
        checkOut
      );
      return { id, beds24Prices, externalBlocked };
    }
  );
  const metaById = new Map(metaList.map((m) => [m.id, m]));

  for (const id of uniqueIds) {
    const l = listingMap.get(id);
    if (!l) continue;
    const meta = metaById.get(id);
    if (!meta) continue;

    const byDate = availByListing.get(id) ?? new Map();
    const internalBlocked = new Set<string>();
    for (const b of bookingsByListing.get(id) ?? []) {
      for (const k of getDateKeysBetween(b.checkIn, b.checkOut)) {
        if (dateKeySet.has(k)) internalBlocked.add(k);
      }
    }

    out.set(
      id,
      buildNightlyResultForListing(
        l,
        dateKeys,
        byDate,
        meta.externalBlocked,
        internalBlocked,
        meta.beds24Prices
      )
    );
  }

  return out;
}

/**
 * 기간 내 일별 요금·가용성 조회 (예약 가능 여부 및 총 금액 계산용)
 */
export async function getNightlyAvailability(
  listingId: string,
  checkIn: Date,
  checkOut: Date
): Promise<NightlyAvailabilityResult> {
  const map = await getNightlyAvailabilityForListings([listingId], checkIn, checkOut);
  const r = map.get(listingId);
  if (!r) {
    throw new Error("숙소를 찾을 수 없습니다.");
  }
  return r;
}

/**
 * 캘린더 표시용: 해당 기간 내 예약 불가한 날짜(YYYY-MM-DD) 목록.
 * 우리 예약 + 요금·예약불가 설정 + 외부 ICS(에어비앤비 등) 통합.
 */
export async function getListingBlockedDateKeys(
  listingId: string,
  fromDate: Date,
  toDate: Date
): Promise<string[]> {
  const blocked = new Set<string>();

  const bookings = await prisma.booking.findMany({
    where: {
      listingId,
      ...listingSlotOccupiedWhere,
      checkIn: { lt: toDate },
      checkOut: { gt: fromDate },
    },
    select: { checkIn: true, checkOut: true },
  });
  for (const b of bookings) {
    const keys = getDateKeysBetween(
      b.checkIn < fromDate ? fromDate : b.checkIn,
      b.checkOut > toDate ? toDate : b.checkOut
    );
    keys.forEach((k) => blocked.add(k));
  }

  const startKey = toDateKey(fromDate);
  const endKey = toDateKey(toDate);
  const availabilityRows = await prisma.listingAvailability.findMany({
    where: {
      listingId,
      date: { gte: startKey, lte: endKey },
      available: false,
    },
    select: { date: true },
  });
  availabilityRows.forEach((r) => blocked.add(r.date));

  // 외부(iCal)는 구간 끝을 "다음날 00:00"으로 넘겨 getDateKeysBetween에서 월 말일이 포함되도록 함
  const toDateExclusive = new Date(toDate);
  toDateExclusive.setDate(toDateExclusive.getDate() + 1);
  toDateExclusive.setHours(0, 0, 0, 0);
  const external = await getExternalBlockedDateKeys(listingId, fromDate, toDateExclusive);
  external.forEach((k) => blocked.add(k));

  return Array.from(blocked);
}

/**
 * 캘린더 표시용: 체크아웃만 가능한 날짜(YYYY-MM-DD) 목록.
 * - 예약 체크인일: 그날 밤부터 다른 게스트 점유 → 새 예약의 체크인 시작일로는 선택 불가.
 *   (당일 턴오버: 전 게스트 체크아웃일은 숙박 밤 목록에 포함되지 않으므로 여기서 제외하지 않음)
 * - 외부 ICS·Beds24에서 파생되는 값은 getExternalCheckoutOnlyDateKeys 참고
 */
export async function getListingCheckoutOnlyDateKeys(
  listingId: string,
  fromDate: Date,
  toDate: Date
): Promise<string[]> {
  const checkoutOnly = new Set<string>();

  const bookings = await prisma.booking.findMany({
    where: {
      listingId,
      ...listingSlotOccupiedWhere,
      checkIn: { lt: toDate },
      checkOut: { gt: fromDate },
    },
    select: { checkIn: true, checkOut: true },
  });
  const fromKey = toDateKey(fromDate);
  const toKey = toDateKey(toDate);
  for (const b of bookings) {
    const checkInKey = toDateKeyUTC(b.checkIn);
    if (checkInKey >= fromKey && checkInKey <= toKey) {
      checkoutOnly.add(checkInKey);
    }
  }

  const toDateExclusive = new Date(toDate);
  toDateExclusive.setDate(toDateExclusive.getDate() + 1);
  toDateExclusive.setHours(0, 0, 0, 0);
  const external = await getExternalCheckoutOnlyDateKeys(listingId, fromDate, toDateExclusive);
  external.forEach((k) => checkoutOnly.add(k));

  return Array.from(checkoutOnly);
}
