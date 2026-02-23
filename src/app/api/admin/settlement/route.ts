import { NextRequest, NextResponse } from "next/server";
import type { Prisma } from "@prisma/client";
import { getAdminUser } from "@/lib/admin";
import { prisma } from "@/lib/prisma";

/**
 * GET /api/admin/settlement
 * 정산 대상 예약 조회 (Admin 전용)
 * Query: startDate, endDate, hostId, listingId, status (pending|completed|all), page, limit
 */
export async function GET(request: NextRequest) {
  const admin = await getAdminUser();
  if (!admin) {
    return NextResponse.json({ error: "관리자 권한이 필요합니다." }, { status: 403 });
  }

  const { searchParams } = new URL(request.url);
  const startDateStr = searchParams.get("startDate") ?? undefined;
  const endDateStr = searchParams.get("endDate") ?? undefined;
  const hostId = searchParams.get("hostId") ?? undefined;
  const listingId = searchParams.get("listingId") ?? undefined;
  const status = (searchParams.get("status") as "pending" | "completed" | "all") ?? "pending";
  const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
  const limit = Math.min(100, Math.max(1, parseInt(searchParams.get("limit") || "20", 10)));

  const baseWhere: Prisma.BookingWhereInput = {
    paymentStatus: "paid",
    status: "confirmed",
    listing: {
      ...(listingId ? { id: listingId } : {}),
      ...(hostId ? { userId: hostId } : {}),
    },
  };

  const checkInFilter: { gte?: Date; lte?: Date } = {};
  if (startDateStr) checkInFilter.gte = new Date(startDateStr + "T00:00:00.000Z");
  if (endDateStr) checkInFilter.lte = new Date(endDateStr + "T23:59:59.999Z");
  if (Object.keys(checkInFilter).length) {
    baseWhere.checkIn = checkInFilter;
  }

  if (status === "pending") {
    baseWhere.OR = [
      { settlementStatus: null },
      { settlementStatus: { not: "completed" } },
    ];
  } else if (status === "completed") {
    baseWhere.settlementStatus = "completed";
  }

  const [bookings, pendingAgg, completedAgg] = await Promise.all([
    prisma.booking.findMany({
      where: baseWhere,
      orderBy: { checkIn: "asc" },
      include: {
        listing: { select: { id: true, title: true, user: { select: { id: true, email: true, name: true } } } },
        user: { select: { id: true, email: true, name: true } },
        transactions: {
          where: { status: "paid" },
          orderBy: { verifiedAt: "desc" },
          take: 1,
          select: { verifiedAt: true },
        },
      },
    }),
    prisma.booking.aggregate({
      where: {
        paymentStatus: "paid",
        status: "confirmed",
        OR: [
          { settlementStatus: null },
          { settlementStatus: { not: "completed" } },
        ],
        listing: hostId ? { userId: hostId } : undefined,
        ...(Object.keys(checkInFilter).length ? { checkIn: checkInFilter } : {}),
      },
      _count: { id: true },
      _sum: { totalPrice: true },
    }).catch(() => ({ _count: { id: 0 }, _sum: { totalPrice: 0 } })),
    prisma.booking.aggregate({
      where: {
        paymentStatus: "paid",
        status: "confirmed",
        settlementStatus: "completed",
        listing: hostId ? { userId: hostId } : undefined,
      },
      _count: { id: true },
      _sum: { totalPrice: true },
    }).catch(() => ({ _count: { id: 0 }, _sum: { totalPrice: 0 } })),
  ]);

  const totalCount = bookings.length;
  const start = (page - 1) * limit;
  const paginated = bookings.slice(start, start + limit).map((b) => ({
    id: b.id,
    checkIn: b.checkIn.toISOString().slice(0, 10),
    checkOut: b.checkOut.toISOString().slice(0, 10),
    totalPrice: b.totalPrice,
    settlementStatus: b.settlementStatus,
    settlementAt: b.settlementAt?.toISOString() ?? null,
    settlementNote: b.settlementNote ?? null,
    listing: b.listing,
    guest: b.user,
    paymentDate: b.transactions[0]?.verifiedAt?.toISOString().slice(0, 10) ?? null,
  }));

  return NextResponse.json({
    bookings: paginated,
    totalCount,
    page,
    limit,
    summary: {
      pendingCount: pendingAgg._count.id,
      pendingAmount: pendingAgg._sum.totalPrice ?? 0,
      completedCount: completedAgg._count.id,
      completedAmount: completedAgg._sum.totalPrice ?? 0,
    },
  });
}
