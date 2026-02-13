import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { invalidateIcalCacheForUrls } from "@/lib/ical";

/**
 * POST /api/listings/[id]/ical/refresh
 * 입력된 iCal URL들의 캐시를 무효화해, 다음 조회 시 최신 캘린더를 반영합니다.
 * Body에 urls 배열이 있으면 사용, 없으면 DB에 저장된 URL 사용.
 */
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: listingId } = await params;
  const session = await getServerSession(authOptions);
  const userId = (session as { userId?: string } | null)?.userId;
  if (!userId) {
    return NextResponse.json({ error: "로그인이 필요합니다." }, { status: 401 });
  }

  const listing = await prisma.listing.findFirst({
    where: { id: listingId, userId },
    select: { icalImportUrls: true },
  });
  if (!listing) {
    return NextResponse.json({ error: "숙소를 찾을 수 없습니다." }, { status: 404 });
  }

  let urls: string[] = [];
  try {
    const body = await request.json().catch(() => ({}));
    if (Array.isArray(body.urls) && body.urls.length > 0) {
      urls = body.urls.filter((u): u is string => typeof u === "string" && u.trim().length > 0);
    }
    if (urls.length === 0) {
      const arr = JSON.parse(listing.icalImportUrls ?? "[]");
      urls = Array.isArray(arr)
        ? arr.filter((u): u is string => typeof u === "string" && u.trim().length > 0)
        : [];
    }
  } catch {
    urls = [];
  }

  invalidateIcalCacheForUrls(urls);
  return NextResponse.json({ ok: true, message: "캘린더 캐시를 새로고침했습니다." });
}
