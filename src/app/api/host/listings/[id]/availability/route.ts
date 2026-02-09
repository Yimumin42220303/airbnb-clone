import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

/**
 * GET /api/host/listings/[id]/availability?month=YYYY-MM
 * 해당 월의 날짜별 요금·가용성
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  const userId = (session as { userId?: string } | null)?.userId;
  if (!userId) {
    return NextResponse.json(
      { error: "로그인 후 이용할 수 있습니다." },
      { status: 401 }
    );
  }

  const { id: listingId } = await params;
  const listing = await prisma.listing.findUnique({
    where: { id: listingId },
    select: { userId: true, pricePerNight: true },
  });
  if (!listing || listing.userId !== userId) {
    return NextResponse.json(
      { error: "숙소를 찾을 수 없거나 권한이 없습니다." },
      { status: 404 }
    );
  }

  const monthParam = request.nextUrl.searchParams.get("month"); // YYYY-MM
  if (!monthParam) {
    return NextResponse.json(
      { error: "month 쿼리(YYYY-MM)가 필요합니다." },
      { status: 400 }
    );
  }
  const [y, m] = monthParam.split("-").map(Number);
  const start = new Date(y, m - 1, 1);
  const end = new Date(y, m, 0);
  const dateKeys: string[] = [];
  const cur = new Date(start);
  while (cur <= end) {
    dateKeys.push(
      `${cur.getFullYear()}-${String(cur.getMonth() + 1).padStart(2, "0")}-${String(cur.getDate()).padStart(2, "0")}`
    );
    cur.setDate(cur.getDate() + 1);
  }

  const rows = await prisma.listingAvailability.findMany({
    where: { listingId, date: { in: dateKeys } },
  });
  const byDate = new Map(rows.map((r) => [r.date, r]));

  const availability = dateKeys.map((date) => {
    const row = byDate.get(date);
    return {
      date,
      pricePerNight: row?.pricePerNight ?? null,
      available: row ? row.available : true,
    };
  });

  return NextResponse.json({
    listingId,
    pricePerNight: listing.pricePerNight,
    month: monthParam,
    availability,
  });
}

/**
 * PATCH /api/host/listings/[id]/availability
 * body: { updates: [{ date: "YYYY-MM-DD", pricePerNight?: number | null, available?: boolean }] }
 * pricePerNight null = 기본 요금 사용, available false = 예약 불가
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  const userId = (session as { userId?: string } | null)?.userId;
  if (!userId) {
    return NextResponse.json(
      { error: "로그인 후 이용할 수 있습니다." },
      { status: 401 }
    );
  }

  const { id: listingId } = await params;
  const listing = await prisma.listing.findUnique({
    where: { id: listingId },
    select: { userId: true },
  });
  if (!listing || listing.userId !== userId) {
    return NextResponse.json(
      { error: "숙소를 찾을 수 없거나 권한이 없습니다." },
      { status: 404 }
    );
  }

  const body = await request.json();
  const updates = body.updates as Array<{
    date: string;
    pricePerNight?: number | null;
    available?: boolean;
  }>;
  if (!Array.isArray(updates) || updates.length === 0) {
    return NextResponse.json(
      { error: "updates 배열이 필요합니다." },
      { status: 400 }
    );
  }

  for (const u of updates) {
    const date = typeof u.date === "string" ? u.date.trim() : "";
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) continue;

    const existing = await prisma.listingAvailability.findUnique({
      where: { listingId_date: { listingId, date } },
    });

    const available = u.available;
    const pricePerNight = u.pricePerNight;

    if (existing) {
      if (available === true && pricePerNight === null) {
        await prisma.listingAvailability.delete({
          where: { listingId_date: { listingId, date } },
        });
      } else {
        await prisma.listingAvailability.update({
          where: { listingId_date: { listingId, date } },
          data: {
            ...(available !== undefined && { available }),
            ...(pricePerNight !== undefined && { pricePerNight }),
          },
        });
      }
    } else {
      if (available === false || (pricePerNight != null && pricePerNight !== undefined)) {
        await prisma.listingAvailability.create({
          data: {
            listingId,
            date,
            available: available ?? true,
            pricePerNight: pricePerNight ?? undefined,
          },
        });
      }
    }
  }

  return NextResponse.json({ ok: true });
}
