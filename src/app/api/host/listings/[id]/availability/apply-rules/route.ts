import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const MONTH_FACTOR_KEYS = [
  "januaryFactor", "februaryFactor", "marchFactor", "aprilFactor",
  "mayFactor", "juneFactor", "julyFactor", "augustFactor",
  "septemberFactor", "octoberFactor", "novemberFactor", "decemberFactor",
] as const;

/**
 * POST /api/host/listings/[id]/availability/apply-rules
 * 해당 월에 요일/주말 가격 규칙 적용. body의 weekendMultiplier, weekdayMultiplier 사용.
 * body: { month: "YYYY-MM", weekendMultiplier?: number, weekdayMultiplier?: number }
 */
export async function POST(
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
    select: {
      userId: true,
      pricePerNight: true,
      januaryFactor: true,
      februaryFactor: true,
      marchFactor: true,
      aprilFactor: true,
      mayFactor: true,
      juneFactor: true,
      julyFactor: true,
      augustFactor: true,
      septemberFactor: true,
      octoberFactor: true,
      novemberFactor: true,
      decemberFactor: true,
    },
  });
  if (!listing || listing.userId !== userId) {
    return NextResponse.json(
      { error: "숙소를 찾을 수 없거나 권한이 없습니다." },
      { status: 404 }
    );
  }

  const body = await request.json();
  const monthParam = body.month as string | undefined;
  if (!monthParam || !/^\d{4}-\d{2}-\d{2}$/.test(monthParam + "-01")) {
    return NextResponse.json(
      { error: "month(YYYY-MM)가 필요합니다." },
      { status: 400 }
    );
  }
  const [y, m] = monthParam.split("-").map(Number);
  const monthFactor = (listing[MONTH_FACTOR_KEYS[m - 1]] ?? 1) as number;
  const weekendMult = body.weekendMultiplier != null ? Number(body.weekendMultiplier) : 1;
  const weekdayMult = body.weekdayMultiplier != null ? Number(body.weekdayMultiplier) : 1;
  const base = listing.pricePerNight;

  const dateKeys: string[] = [];
  const start = new Date(y, m - 1, 1);
  const end = new Date(y, m, 0);
  const cur = new Date(start);
  while (cur <= end) {
    dateKeys.push(
      `${cur.getFullYear()}-${String(cur.getMonth() + 1).padStart(2, "0")}-${String(cur.getDate()).padStart(2, "0")}`
    );
    cur.setDate(cur.getDate() + 1);
  }

  let applied = 0;
  for (const dateKey of dateKeys) {
    const day = new Date(dateKey + "T12:00:00").getDay();
    const isWeekend = day === 0 || day === 6;
    const mult = isWeekend ? weekendMult : weekdayMult;
    const price = Math.round(base * monthFactor * mult);

    const existing = await prisma.listingAvailability.findUnique({
      where: { listingId_date: { listingId, date: dateKey } },
    });
    if (existing) {
      await prisma.listingAvailability.update({
        where: { listingId_date: { listingId, date: dateKey } },
        data: { pricePerNight: price, available: true },
      });
    } else {
      await prisma.listingAvailability.create({
        data: { listingId, date: dateKey, pricePerNight: price, available: true },
      });
    }
    applied++;
  }

  return NextResponse.json({ ok: true, applied });
}
