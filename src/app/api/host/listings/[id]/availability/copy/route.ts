import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

/**
 * POST /api/host/listings/[id]/availability/copy
 * 선택 기간의 가격·가용성을 다른 달 또는 다른 리스팅으로 복사.
 * body: { sourceDateKeys: string[], targetType: "otherMonth" | "otherListing", targetMonth?: "YYYY-MM", targetListingId?: string }
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

  const { id: sourceListingId } = await params;
  const sourceListing = await prisma.listing.findUnique({
    where: { id: sourceListingId },
    select: { userId: true },
  });
  if (!sourceListing || sourceListing.userId !== userId) {
    return NextResponse.json(
      { error: "숙소를 찾을 수 없거나 권한이 없습니다." },
      { status: 404 }
    );
  }

  const body = await request.json();
  const sourceDateKeys = body.sourceDateKeys as string[] | undefined;
  const targetType = body.targetType as string | undefined;
  const targetMonth = body.targetMonth as string | undefined;
  const targetListingId = body.targetListingId as string | undefined;

  if (!Array.isArray(sourceDateKeys) || sourceDateKeys.length === 0) {
    return NextResponse.json(
      { error: "sourceDateKeys 배열이 필요합니다." },
      { status: 400 }
    );
  }
  const validSourceKeys = sourceDateKeys.filter(
    (d) => typeof d === "string" && /^\d{4}-\d{2}-\d{2}$/.test(d.trim())
  );
  if (validSourceKeys.length === 0) {
    return NextResponse.json(
      { error: "유효한 날짜(YYYY-MM-DD)가 없습니다." },
      { status: 400 }
    );
  }

  if (targetType === "otherMonth") {
    if (!targetMonth || !/^\d{4}-\d{2}$/.test(targetMonth)) {
      return NextResponse.json(
        { error: "targetMonth(YYYY-MM)가 필요합니다." },
        { status: 400 }
      );
    }
    const [tYear, tMonth] = targetMonth.split("-").map(Number);
    const pairs: { sourceKey: string; targetKey: string }[] = [];
    for (const key of validSourceKeys) {
      const day = parseInt(key.slice(8, 10), 10);
      const d = new Date(tYear, tMonth - 1, day);
      if (d.getMonth() !== tMonth - 1) continue;
      const targetKey = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
      pairs.push({ sourceKey: key, targetKey });
    }
    const sourceRows = await prisma.listingAvailability.findMany({
      where: { listingId: sourceListingId, date: { in: validSourceKeys } },
    });
    const byDate = new Map(sourceRows.map((r) => [r.date, r]));
    const updates = pairs.map(({ sourceKey, targetKey }) => {
      const src = byDate.get(sourceKey);
      return {
        date: targetKey,
        pricePerNight: src?.pricePerNight ?? null,
        available: src?.available ?? true,
      };
    });
    for (const u of updates) {
      const existing = await prisma.listingAvailability.findUnique({
        where: { listingId_date: { listingId: sourceListingId, date: u.date } },
      });
      if (existing) {
        if (u.available === true && u.pricePerNight === null) {
          await prisma.listingAvailability.delete({
            where: { listingId_date: { listingId: sourceListingId, date: u.date } },
          });
        } else {
          await prisma.listingAvailability.update({
            where: { listingId_date: { listingId: sourceListingId, date: u.date } },
            data: { available: u.available, pricePerNight: u.pricePerNight },
          });
        }
      } else {
        if (u.available === false || (u.pricePerNight != null && u.pricePerNight !== undefined)) {
          await prisma.listingAvailability.create({
            data: {
              listingId: sourceListingId,
              date: u.date,
              available: u.available,
              pricePerNight: u.pricePerNight ?? undefined,
            },
          });
        }
      }
    }
    return NextResponse.json({ ok: true, copied: updates.length, skipped: validSourceKeys.length - pairs.length });
  }

  if (targetType === "otherListing") {
    if (!targetListingId || targetListingId === sourceListingId) {
      return NextResponse.json(
        { error: "다른 리스팅 ID(targetListingId)가 필요합니다." },
        { status: 400 }
      );
    }
    const targetListing = await prisma.listing.findUnique({
      where: { id: targetListingId },
      select: { userId: true },
    });
    if (!targetListing || targetListing.userId !== userId) {
      return NextResponse.json(
        { error: "대상 숙소를 찾을 수 없거나 권한이 없습니다." },
        { status: 404 }
      );
    }
    const sourceRows = await prisma.listingAvailability.findMany({
      where: { listingId: sourceListingId, date: { in: validSourceKeys } },
    });
    const byDate = new Map(sourceRows.map((r) => [r.date, r]));
    for (const dateKey of validSourceKeys) {
      const src = byDate.get(dateKey);
      const pricePerNight = src?.pricePerNight ?? null;
      const available = src?.available ?? true;
      const existing = await prisma.listingAvailability.findUnique({
        where: { listingId_date: { listingId: targetListingId, date: dateKey } },
      });
      if (existing) {
        if (available === true && pricePerNight === null) {
          await prisma.listingAvailability.delete({
            where: { listingId_date: { listingId: targetListingId, date: dateKey } },
          });
        } else {
          await prisma.listingAvailability.update({
            where: { listingId_date: { listingId: targetListingId, date: dateKey } },
            data: { available, pricePerNight },
          });
        }
      } else {
        if (available === false || (pricePerNight != null && pricePerNight !== undefined)) {
          await prisma.listingAvailability.create({
            data: {
              listingId: targetListingId,
              date: dateKey,
              available,
              pricePerNight: pricePerNight ?? undefined,
            },
          });
        }
      }
    }
    return NextResponse.json({ ok: true, copied: validSourceKeys.length });
  }

  return NextResponse.json(
    { error: "targetType은 otherMonth 또는 otherListing 이어야 합니다." },
    { status: 400 }
  );
}
