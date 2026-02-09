import { prisma } from "./prisma";
import { getExternalBlockedDateKeys } from "./ical";

/**
 * 날짜 문자열 YYYY-MM-DD 생성
 */
export function toDateKey(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
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
  nights: NightlyPrice[];
  totalPrice: number;
  allAvailable: boolean;
 }> {
  const listing = await prisma.listing.findUnique({
    where: { id: listingId },
    select: { pricePerNight: true },
  });
  if (!listing) {
    throw new Error("숙소를 찾을 수 없습니다.");
  }

  const dateKeys = getDateKeysBetween(checkIn, checkOut);
  if (dateKeys.length === 0) {
    return {
      listingPricePerNight: listing.pricePerNight,
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

  const nights: NightlyPrice[] = dateKeys.map((date) => {
    const row = byDate.get(date);
    const available = (row ? row.available : true) && !externalBlocked.has(date);
    const pricePerNight =
      row?.pricePerNight != null ? row.pricePerNight : listing.pricePerNight;
    return { date, pricePerNight, available };
  });

  const allAvailable = nights.every((n) => n.available);
  const totalPrice = nights.reduce((sum, n) => sum + n.pricePerNight, 0);

  return {
    listingPricePerNight: listing.pricePerNight,
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
      status: { not: "cancelled" },
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
