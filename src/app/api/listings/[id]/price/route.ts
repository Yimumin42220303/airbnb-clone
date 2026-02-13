import { NextRequest, NextResponse } from "next/server";
import { getNightlyAvailability } from "@/lib/availability";

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
    const nightsCount = result.nights.length;
    const nightsTotal = result.nights.reduce(
      (sum, n) => sum + n.pricePerNight,
      0
    );
    const cleaningFee = result.cleaningFee ?? 0;
    const baseGuests = result.baseGuests ?? 2;
    const extraGuestFee = result.extraGuestFee ?? 0;
    const guests = guestsParam ? Math.max(1, parseInt(guestsParam, 10) || 1) : 1;
    const extraGuests = Math.max(0, guests - baseGuests);
    const extraTotal =
      nightsCount > 0 ? extraGuests * extraGuestFee * nightsCount : 0;
    const totalPrice = nightsTotal + cleaningFee + extraTotal;
    return NextResponse.json({
      totalPrice,
      allAvailable: result.allAvailable,
      listingPricePerNight: result.listingPricePerNight,
      cleaningFee: result.cleaningFee ?? 0,
      nights: result.nights,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "오류가 발생했습니다.";
    return NextResponse.json(
      { error: message },
      { status: 404 }
    );
  }
}
