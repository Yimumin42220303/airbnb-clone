import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { invalidateIcalCacheForUrls } from "@/lib/ical";

/**
 * GET /api/listings/[id]/ical/status
 * iCal 연동 상태 확인. 디버깅용.
 */
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: listingId } = await params;
  const listing = await prisma.listing.findUnique({
    where: { id: listingId },
    select: { icalImportUrls: true, title: true },
  });
  if (!listing) {
    return NextResponse.json({ error: "숙소를 찾을 수 없습니다." }, { status: 404 });
  }

  let urls: string[] = [];
  try {
    const arr = JSON.parse(listing.icalImportUrls ?? "[]");
    urls = Array.isArray(arr) ? arr.filter((u): u is string => typeof u === "string" && u.trim().length > 0) : [];
  } catch {
    // ignore
  }

  if (urls.length === 0) {
    return NextResponse.json({
      configured: false,
      message: "iCal Import URL이 등록되지 않았습니다. 숙소 수정에서 '외부 캘린더 가져오기'에 Airbnb iCal URL을 입력하고 저장하세요.",
      urls: [],
    });
  }

  return NextResponse.json({
    configured: true,
    urlCount: urls.length,
    urls: urls.map((u) => (u.length > 50 ? u.slice(0, 50) + "..." : u)),
    message: "iCal URL이 등록되어 있습니다. 캘린더에서 예약된 날이 회색으로 표시되어야 합니다. 표시되지 않으면 서버 로그에서 [iCal] 오류를 확인하세요.",
  });
}

/**
 * POST /api/listings/[id]/ical/status?action=invalidate
 * iCal 캐시 무효화 (테스트용)
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: listingId } = await params;
  const action = request.nextUrl.searchParams.get("action");
  if (action === "invalidate") {
    const listing = await prisma.listing.findUnique({
      where: { id: listingId },
      select: { icalImportUrls: true },
    });
    if (!listing?.icalImportUrls) {
      return NextResponse.json({ ok: false, message: "iCal URL 없음" });
    }
    let urls: string[] = [];
    try {
      const arr = JSON.parse(listing.icalImportUrls);
      urls = Array.isArray(arr) ? arr.filter((u): u is string => typeof u === "string" && u.trim().length > 0) : [];
    } catch {
      // ignore
    }
    invalidateIcalCacheForUrls(urls);
    return NextResponse.json({ ok: true, message: "캐시를 무효화했습니다. 다음 요청 시 최신 데이터를 가져옵니다." });
  }
  return NextResponse.json({ error: "Unknown action" }, { status: 400 });
}
