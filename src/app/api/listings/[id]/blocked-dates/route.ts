import { NextResponse } from "next/server";
import { getListingBlockedDateKeys } from "@/lib/availability";

/**
 * GET /api/listings/[id]/blocked-dates?from=YYYY-MM-DD&to=YYYY-MM-DD
 * 캘린더 표시용: 해당 기간 내 예약 불가한 날짜 목록 (우리 예약 + 설정 + 외부 ICS)
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
    const dateKeys = await getListingBlockedDateKeys(listingId, fromDate, toDate);
    return NextResponse.json({ dateKeys }, { headers: { "Cache-Control": "private, max-age=300" } });
  } catch (err) {
    console.error("GET /api/listings/[id]/blocked-dates", err);
    return NextResponse.json(
      { error: "예약 불가 날짜를 불러오지 못했습니다." },
      { status: 500 }
    );
  }
}
