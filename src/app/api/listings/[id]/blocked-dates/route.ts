import { NextResponse } from "next/server";
import { getListingBlockedDateKeys, getListingCheckoutOnlyDateKeys } from "@/lib/availability";

/**
 * GET /api/listings/[id]/blocked-dates?from=YYYY-MM-DD&to=YYYY-MM-DD
 * 캘린더 표시용: 해당 기간 내 예약 불가한 날짜 목록 (우리 예약 + 설정 + 외부 ICS)
 * + 체크아웃만 가능한 날짜 목록 (우리 예약·외부 ICS 체크아웃일)
 */
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: listingId } = await params;
  const fromStr = request.nextUrl.searchParams.get("from");
  const toStr = request.nextUrl.searchParams.get("to");
  if (!fromStr || !toStr) {
    return NextResponse.json(
      { error: "from, to 쿼리(YYYY-MM-DD)가 필요합니다." },
      { status: 400 }
    );
  }
  const fromDate = new Date(fromStr);
  const toDate = new Date(toStr);
  if (isNaN(fromDate.getTime()) || isNaN(toDate.getTime()) || fromDate >= toDate) {
    return NextResponse.json(
      { error: "from, to는 유효한 날짜이며 from < to 여야 합니다." },
      { status: 400 }
    );
  }

  try {
    const [dateKeys, checkoutOnlyRaw] = await Promise.all([
      getListingBlockedDateKeys(listingId, fromDate, toDate),
      getListingCheckoutOnlyDateKeys(listingId, fromDate, toDate),
    ]);
    // 체크인일은 blocked에 포함되므로, filter 시 제거되면 체크아웃 선택 불가.
    // blocked ∩ checkoutOnly인 날(다른 예약 체크인일)은 체크아웃으로 선택 허용.
    const checkoutOnlyDateKeys = checkoutOnlyRaw;
    return NextResponse.json(
      { dateKeys, checkoutOnlyDateKeys },
      { headers: { "Cache-Control": "private, max-age=300" } }
    );
  } catch (err) {
    console.error("GET /api/listings/[id]/blocked-dates", err);
    return NextResponse.json(
      { error: "예약 불가 날짜를 불러오지 못했습니다." },
      { status: 500 }
    );
  }
}
