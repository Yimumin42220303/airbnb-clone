import { prisma } from "./prisma";
import { getExternalBlockedDateKeys, getExternalCheckoutOnlyDateKeys } from "./ical";

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

/**
 * 기간 내 일별 요금·가용성 조회 (예약 가능 여부 및 총 금액 계산용)
 */
export async function getNightlyAvailability(
  listingId: string,
  checkIn: Date,
  checkOut: Date
): Promise<{
  listingPricePerNight: number;
  cleaningFee: number;
  baseGuests: number;
  extraGuestFee: number;
  nights: NightlyPrice[];
  totalPrice: number;
  allAvailable: boolean;
}> {
  const listing = await prisma.listing.findUnique({
    where: { id: listingId },
    select: {
      pricePerNight: true,
      cleaningFee: true,
      baseGuests: true,
      extraGuestFee: true,
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
    },
  });
  if (!listing) {
    throw new Error("숙소를 찾을 수 없습니다.");
  }
  // TypeScript narrowing doesn't propagate into nested functions
  const l = listing;
  const cleaningFee = l.cleaningFee ?? 0;
  const baseGuests = l.baseGuests ?? 2;
  const extraGuestFee = l.extraGuestFee ?? 0;

  const dateKeys = getDateKeysBetween(checkIn, checkOut);
  if (dateKeys.length === 0) {
    return {
      listingPricePerNight: l.pricePerNight,
      baseGuests,
      extraGuestFee,
      cleaningFee: l.cleaningFee ?? 0,
      nights: [],
      totalPrice: 0,
      allAvailable: true,
    };
  }

  const availabilityRows = await prisma.listingAvailability.findMany({
    where: {
      listingId,
      date: { in: dateKeys },
    },
  });
  const byDate = new Map(availabilityRows.map((r) => [r.date, r]));

  const externalBlocked = await getExternalBlockedDateKeys(listingId, checkIn, checkOut);

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

  const nights: NightlyPrice[] = dateKeys.map((date) => {
    const row = byDate.get(date);
    const available = (row ? row.available : true) && !externalBlocked.has(date);
    const factor = getMonthFactor(date);
    const basePrice = Math.round(l.pricePerNight * factor);
    const pricePerNight =
      row?.pricePerNight != null ? row.pricePerNight : basePrice;
    return { date, pricePerNight, available };
  });

  const allAvailable = nights.every((n) => n.available);
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
  };
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
      status: "confirmed",
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
 * 1) 예약 체크아웃일: 전날 게스트 퇴실 → 당일 체크인 불가, 체크아웃만 가능
 * 2) 예약 체크인일: 당일 오후에 다음 게스트 체크인 → 당일 오전에는 체크아웃 가능 (체크인은 주로 15시 이후)
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
      status: "confirmed",
      checkIn: { lt: toDate },
      checkOut: { gt: fromDate },
    },
    select: { checkIn: true, checkOut: true },
  });
  const fromKey = toDateKey(fromDate);
  const toKey = toDateKey(toDate);
  for (const b of bookings) {
    const checkOutKey = toDateKeyUTC(b.checkOut);
    if (checkOutKey >= fromKey && checkOutKey <= toKey) {
      checkoutOnly.add(checkOutKey);
    }
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
