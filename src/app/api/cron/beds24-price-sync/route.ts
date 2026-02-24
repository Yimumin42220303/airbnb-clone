import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getBeds24CalendarPrices } from "@/lib/beds24";

/**
 * POST /api/cron/beds24-price-sync
 *
 * Vercel Cron Job: 6시간마다 실행
 * Beds24 API에서 beds24Enabled Listing의 일별 가격(tokyominbak 레이트)을 가져와
 * ListingAvailability.pricePerNight에 저장합니다.
 */
export async function POST(request: Request) {
  const authHeader = request.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;
  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const listings = await prisma.listing.findMany({
    where: {
      beds24PropId: { not: null },
      beds24RoomId: { not: null },
    },
    select: {
      id: true,
      beds24PropId: true,
      beds24RoomId: true,
      beds24OfferIndex: true,
    },
  });

  const results: Array<{
    listingId: string;
    success: boolean;
    updated: number;
    error?: string;
  }> = [];

  const now = new Date();
  const fromDate = new Date(now.getFullYear(), now.getMonth(), 1);
  const toDate = new Date(now.getFullYear(), now.getMonth() + 14, 0); // 약 14개월

  for (const listing of listings) {
    const propId = listing.beds24PropId?.trim();
    const roomId = listing.beds24RoomId?.trim();
    if (!propId || !roomId) {
      results.push({ listingId: listing.id, success: false, updated: 0, error: "PropId or RoomId missing" });
      continue;
    }

    try {
      const offerIndex = listing.beds24OfferIndex ?? 4;
      const prices = await getBeds24CalendarPrices(
        propId,
        roomId,
        fromDate,
        toDate,
        Math.min(16, Math.max(1, offerIndex))
      );

      let updated = 0;
      for (const [date, pricePerNight] of Array.from(prices.entries())) {
        await prisma.listingAvailability.upsert({
          where: {
            listingId_date: { listingId: listing.id, date },
          },
          create: {
            listingId: listing.id,
            date,
            pricePerNight,
            available: true,
          },
          update: { pricePerNight },
        });
        updated++;
      }

      results.push({ listingId: listing.id, success: true, updated });
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      console.error(`[Cron] Beds24 price sync failed for ${listing.id}:`, msg);
      results.push({ listingId: listing.id, success: false, updated: 0, error: msg });
    }
  }

  return NextResponse.json({
    ok: true,
    processed: listings.length,
    results,
  });
}
