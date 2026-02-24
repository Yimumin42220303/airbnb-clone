/**
 * Beds24 연동 디버그 (호스트/관리자 전용)
 * GET /api/listings/[id]/beds24-debug?from=YYYY-MM-DD&to=YYYY-MM-DD
 */

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  const userId = (session as { userId?: string } | null)?.userId;
  if (!userId) {
    return NextResponse.json({ error: "로그인이 필요합니다." }, { status: 401 });
  }

  const { id: listingId } = await params;
  const listing = await prisma.listing.findUnique({
    where: { id: listingId },
    select: { userId: true, beds24Enabled: true, beds24PropId: true, beds24RoomId: true, beds24OfferIndex: true },
  });
  if (!listing) {
    return NextResponse.json({ error: "숙소를 찾을 수 없습니다." }, { status: 404 });
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { role: true },
  });
  const isAdmin = user?.role === "admin";
  const isOwner = listing.userId === userId;
  if (!isAdmin && !isOwner) {
    return NextResponse.json({ error: "권한이 없습니다." }, { status: 403 });
  }

  const fromStr = request.nextUrl.searchParams.get("from") ?? new Date().toISOString().slice(0, 10);
  const toStr = request.nextUrl.searchParams.get("to") ?? (() => {
    const t = new Date();
    t.setMonth(t.getMonth() + 2);
    return t.toISOString().slice(0, 10);
  })();

  const debug: Record<string, unknown> = {
    listingId,
    beds24Enabled: listing.beds24Enabled,
    beds24PropId: listing.beds24PropId,
    beds24RoomId: listing.beds24RoomId,
    beds24OfferIndex: listing.beds24OfferIndex ?? 4,
    hasToken: !!process.env.BEDS24_REFRESH_TOKEN?.trim(),
    dateRange: { from: fromStr, to: toStr },
  };

  if (!listing.beds24Enabled || !listing.beds24PropId?.trim() || !listing.beds24RoomId?.trim()) {
    return NextResponse.json({
      ok: false,
      message: "Beds24 API 연동이 설정되지 않았거나 Prop ID/Room ID가 없습니다.",
      debug,
    });
  }

  try {
    const token = process.env.BEDS24_REFRESH_TOKEN?.trim();
    if (!token) {
      debug.error = "BEDS24_REFRESH_TOKEN 없음";
      return NextResponse.json({ ok: false, debug }, { status: 500 });
    }

    const fromDate = new Date(fromStr);
    const toDate = new Date(toStr);
    const y = fromDate.getFullYear();
    const m = String(fromDate.getMonth() + 1).padStart(2, "0");
    const d = String(fromDate.getDate()).padStart(2, "0");
    const from = `${y}${m}${d}`;
    const y2 = toDate.getFullYear();
    const m2 = String(toDate.getMonth() + 1).padStart(2, "0");
    const d2 = String(toDate.getDate()).padStart(2, "0");
    const to = `${y2}${m2}${d2}`;

    const url = `https://beds24.com/api/v2/inventory/rooms/availability?propId=${encodeURIComponent(listing.beds24PropId)}&roomId=${encodeURIComponent(listing.beds24RoomId)}&from=${from}&to=${to}`;

    const tokenRes = await fetch("https://beds24.com/api/v2/authentication/token", {
      method: "GET",
      headers: { Accept: "application/json", refreshToken: token },
      signal: AbortSignal.timeout(15000),
    });
    const tokenData = (await tokenRes.json()) as { token?: string; error?: string };
    if (!tokenRes.ok || !tokenData.token) {
      debug.tokenError = tokenRes.status;
      debug.tokenMessage = tokenData.error ?? "토큰 갱신 실패";
      return NextResponse.json({ ok: false, debug }, { status: 500 });
    }

    const availRes = await fetch(url, {
      headers: { Accept: "application/json", token: tokenData.token },
      signal: AbortSignal.timeout(15000),
    });
    const availText = await availRes.text();
    debug.availabilityStatus = availRes.status;

    if (!availRes.ok) {
      debug.availabilityError = availText.slice(0, 500);
      return NextResponse.json({ ok: false, debug }, { status: 500 });
    }

    let availJson: unknown;
    try {
      availJson = JSON.parse(availText);
    } catch {
      debug.availabilityError = "JSON 파싱 실패";
      debug.availabilityRawPreview = availText.slice(0, 300);
      return NextResponse.json({ ok: false, debug }, { status: 500 });
    }

    const { getBeds24BlockedDateKeys } = await import("@/lib/beds24");
    const blocked = await getBeds24BlockedDateKeys(
      listing.beds24PropId,
      listing.beds24RoomId,
      fromDate,
      toDate
    );
    const blockedList = Array.from(blocked).sort();
    debug.blockedCount = blockedList.length;
    debug.blockedDates = blockedList.slice(0, 50);

    const raw = availJson as Record<string, unknown>;
    const sampleKeys = Object.keys(raw).slice(0, 5);
    debug.responseSampleKeys = sampleKeys;
    debug.responseSample =
      sampleKeys.length > 0
        ? Object.fromEntries(sampleKeys.map((k) => [k, raw[k]]))
        : { _note: "empty" };

    // 가격 동기화 테스트: calendar API 호출
    try {
      const { getBeds24CalendarPrices } = await import("@/lib/beds24");
      const offerIdx = listing.beds24OfferIndex ?? 4;
      const prices = await getBeds24CalendarPrices(
        listing.beds24PropId!,
        listing.beds24RoomId!,
        fromDate,
        toDate,
        Math.min(16, Math.max(1, offerIdx))
      );
      debug.priceSync = {
        offerIndex: offerIdx,
        priceKey: `price${offerIdx}`,
        fetchedCount: prices.size,
        sampleDates: Array.from(prices.entries()).slice(0, 10),
      };
    } catch (priceErr) {
      debug.priceSyncError = priceErr instanceof Error ? priceErr.message : String(priceErr);
    }

    return NextResponse.json({
      ok: true,
      debug,
    });
  } catch (err) {
    debug.error = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ ok: false, debug }, { status: 500 });
  }
}
