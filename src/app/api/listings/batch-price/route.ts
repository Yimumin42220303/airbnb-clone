import { NextRequest, NextResponse } from "next/server";
import { getNightlyAvailabilityForListings } from "@/lib/availability";
import {
  buildFetchErrorPriceSummary,
  buildListingPriceSummary,
  type ListingPriceSummary,
} from "@/lib/stay-price";

export const dynamic = "force-dynamic";

/** 추천 카드(3건) + 여유 — 과다 요청 방지 */
const MAX_BATCH_LISTING_IDS = 20;

type BatchPriceBody = {
  listingIds?: string[];
  checkIn?: string;
  checkOut?: string;
  guests?: number;
};

function parseIsoDateRange(
  checkInStr: string,
  checkOutStr: string
): { checkIn: Date; checkOut: Date } | { error: string } {
  const checkIn = new Date(checkInStr);
  const checkOut = new Date(checkOutStr);
  if (isNaN(checkIn.getTime()) || isNaN(checkOut.getTime())) {
    return { error: "날짜 형식이 올바르지 않습니다." };
  }
  if (checkIn >= checkOut) {
    return { error: "체크아웃은 체크인 다음 날 이후여야 합니다." };
  }
  return { checkIn, checkOut };
}

/**
 * POST /api/listings/batch-price
 * 여러 숙소의 숙박 총액을 한 번에 계산 (상세 price API와 동일 공식)
 */
export async function POST(request: NextRequest) {
  let body: BatchPriceBody;
  try {
    body = (await request.json()) as BatchPriceBody;
  } catch {
    return NextResponse.json({ error: "요청 본문이 올바르지 않습니다." }, { status: 400 });
  }

  const listingIds = Array.isArray(body.listingIds)
    ? Array.from(
        new Set(
          body.listingIds
            .filter((id) => typeof id === "string" && id.trim())
            .map((id) => id.trim())
        )
      )
    : [];
  const checkInStr = body.checkIn?.trim();
  const checkOutStr = body.checkOut?.trim();

  if (!checkInStr || !checkOutStr) {
    return NextResponse.json(
      { error: "checkIn, checkOut이 필요합니다." },
      { status: 400 }
    );
  }

  if (listingIds.length === 0) {
    return NextResponse.json({ prices: {} as Record<string, ListingPriceSummary> });
  }

  if (listingIds.length > MAX_BATCH_LISTING_IDS) {
    return NextResponse.json(
      {
        error: `listingIds는 최대 ${MAX_BATCH_LISTING_IDS}개까지 요청할 수 있습니다.`,
      },
      { status: 400 }
    );
  }

  const parsed = parseIsoDateRange(checkInStr, checkOutStr);
  if ("error" in parsed) {
    return NextResponse.json({ error: parsed.error }, { status: 400 });
  }

  const rawGuests = body.guests;
  const guestCount =
    typeof rawGuests === "number" &&
    Number.isFinite(rawGuests) &&
    rawGuests >= 1
      ? Math.floor(rawGuests)
      : 1;

  const prices: Record<string, ListingPriceSummary> = {};

  try {
    const availabilityMap = await getNightlyAvailabilityForListings(
      listingIds,
      parsed.checkIn,
      parsed.checkOut
    );

    for (const listingId of listingIds) {
      const result = availabilityMap.get(listingId);
      if (!result) {
        prices[listingId] = buildFetchErrorPriceSummary(listingId, guestCount);
        continue;
      }
      prices[listingId] = buildListingPriceSummary(listingId, result, guestCount);
    }
  } catch (err) {
    console.error("POST /api/listings/batch-price", err);
    for (const listingId of listingIds) {
      if (!prices[listingId]) {
        prices[listingId] = buildFetchErrorPriceSummary(listingId, guestCount);
      }
    }
  }

  return NextResponse.json(
    { prices },
    {
      headers: {
        "Cache-Control": "private, no-store, max-age=0",
      },
    }
  );
}
