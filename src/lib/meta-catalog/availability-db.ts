import { prisma } from "@/lib/prisma";
import {
  buildNightlyResultForListing,
  getDateKeysBetween,
  listingSlotOccupiedWhere,
  nightlyListingSelect,
  type NightlyAvailabilityResult,
  type NightlyListingRow,
} from "@/lib/availability";

export type CatalogAvailabilitySnapshot = {
  listings: NightlyListingRow[];
  nightlyByListingId: Map<string, NightlyAvailabilityResult>;
  dateKeys: string[];
};

function startOfLocalDay(d: Date): Date {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}

/**
 * Meta 카탈로그용 DB-only 가용·가격 스냅샷.
 * Beds24/iCal API 호출 없음 — ListingAvailability + 확정 예약만 반영.
 */
export async function getCatalogAvailabilitySnapshot(
  listingIds: string[],
  horizonDays: number
): Promise<CatalogAvailabilitySnapshot> {
  const uniqueIds = Array.from(new Set(listingIds));
  const empty: CatalogAvailabilitySnapshot = {
    listings: [],
    nightlyByListingId: new Map(),
    dateKeys: [],
  };
  if (uniqueIds.length === 0) return empty;

  const from = startOfLocalDay(new Date());
  const to = startOfLocalDay(new Date());
  to.setDate(to.getDate() + horizonDays);

  const dateKeys = getDateKeysBetween(from, to);
  const dateKeySet = new Set(dateKeys);
  const checkOut = new Date(to);
  checkOut.setDate(checkOut.getDate() + 1);

  const listings = await prisma.listing.findMany({
    where: { id: { in: uniqueIds } },
    select: nightlyListingSelect,
  });

  if (dateKeys.length === 0) {
    const nightlyByListingId = new Map<string, NightlyAvailabilityResult>();
    for (const l of listings) {
      nightlyByListingId.set(
        l.id,
        buildNightlyResultForListing(l, [], new Map(), new Set(), new Set(), new Map())
      );
    }
    return { listings, nightlyByListingId, dateKeys };
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
        checkOut: { gt: from },
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

  const bookingsByListing = new Map<string, Array<{ checkIn: Date; checkOut: Date }>>();
  for (const b of overlappingBookings) {
    const arr = bookingsByListing.get(b.listingId) ?? [];
    arr.push({ checkIn: b.checkIn, checkOut: b.checkOut });
    bookingsByListing.set(b.listingId, arr);
  }

  const nightlyByListingId = new Map<string, NightlyAvailabilityResult>();
  const emptyExternal = new Set<string>();
  const emptyBeds24 = new Map<string, number>();

  for (const l of listings) {
    const byDate = availByListing.get(l.id) ?? new Map();
    const internalBlocked = new Set<string>();
    for (const b of bookingsByListing.get(l.id) ?? []) {
      for (const k of getDateKeysBetween(b.checkIn, b.checkOut)) {
        if (dateKeySet.has(k)) internalBlocked.add(k);
      }
    }

    nightlyByListingId.set(
      l.id,
      buildNightlyResultForListing(
        l,
        dateKeys,
        byDate,
        emptyExternal,
        internalBlocked,
        emptyBeds24
      )
    );
  }

  return { listings, nightlyByListingId, dateKeys };
}
