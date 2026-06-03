import { NextRequest, NextResponse } from "next/server";
import { getNightlyAvailability } from "@/lib/availability";
import { computeStayTotalFromNightly } from "@/lib/stay-price";

export const dynamic = "force-dynamic";

/**
 * GET /api/listings/[id]/price?checkIn=YYYY-MM-DD&checkOut=YYYY-MM-DD
 * 해당 기간의 일별 요금·가용성 및 총 금액
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: listingId } = await params;
  const checkInStr = request.nextUrl.searchParams.get("checkIn");
  const checkOutStr = request.nextUrl.searchParams.get("checkOut");
  const guestsParam = request.nextUrl.searchParams.get("guests");

  if (!checkInStr || !checkOutStr) {
    return NextResponse.json(
      { error: "checkIn, checkOut 쿼리가 필요합니다." },
      { status: 400 }
    );
  }

  const checkIn = new Date(checkInStr);
  const checkOut = new Date(checkOutStr);
  if (isNaN(checkIn.getTime()) || isNaN(checkOut.getTime())) {
    return NextResponse.json(
      { error: "날짜 형식이 올바르지 않습니다." },
      { status: 400 }
    );
  }
  if (checkIn >= checkOut) {
    return NextResponse.json(
      { error: "체크아웃은 체크인 다음 날 이후여야 합니다." },
      { status: 400 }
    );
  }

  try {
    const result = await getNightlyAvailability(listingId, checkIn, checkOut);
    const guests = guestsParam ? Math.max(1, parseInt(guestsParam, 10) || 1) : 1;
    const { totalPrice, nightsCount } = computeStayTotalFromNightly(result, guests);
    return NextResponse.json(
      {
        totalPrice,
        allAvailable: result.allAvailable,
        listingPricePerNight: result.listingPricePerNight,
        cleaningFee: result.cleaningFee ?? 0,
        nights: result.nights,
        minStayNights: result.minStayNights,
        maxStayNights: result.maxStayNights,
      },
      {
        headers: {
          "Cache-Control": "private, no-store, max-age=0",
        },
      }
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : "오류가 발생했습니다.";
    return NextResponse.json(
      { error: message },
      { status: 404 }
    );
  }
}
