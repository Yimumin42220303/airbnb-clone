/**
 * POST /api/listings/[id]/beds24-price-sync
 * Beds24 가격 수동 동기화 (호스트/관리자 전용)
 */

import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getBeds24CalendarPrices } from "@/lib/beds24";

export async function POST(
  _request: Request,
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
    select: {
      userId: true,
      beds24Enabled: true,
      beds24PropId: true,
      beds24RoomId: true,
    },
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

  const propId = listing.beds24PropId?.trim();
  const roomId = listing.beds24RoomId?.trim();
  const hasBeds24Config =
    (listing.beds24Enabled || (propId && roomId)) && propId && roomId;
  if (!hasBeds24Config) {
    return NextResponse.json(
      { error: "Beds24 API 연동이 설정되지 않았거나 Prop ID/Room ID가 없습니다." },
      { status: 400 }
    );
  }

  try {
    const now = new Date();
    const fromDate = new Date(now.getFullYear(), now.getMonth(), 1);
    const toDate = new Date(now.getFullYear(), now.getMonth() + 14, 0);

    const prices = await getBeds24CalendarPrices(
      propId,
      roomId,
      fromDate,
      toDate
    );

    let updated = 0;
    for (const [date, pricePerNight] of Array.from(prices.entries())) {
      await prisma.listingAvailability.upsert({
        where: { listingId_date: { listingId, date } },
        create: { listingId, date, pricePerNight, available: true },
        update: { pricePerNight },
      });
      updated++;
    }

    return NextResponse.json({
      ok: true,
      updated,
      dateCount: prices.size,
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error(`[Beds24] price sync failed for ${listingId}:`, msg);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
