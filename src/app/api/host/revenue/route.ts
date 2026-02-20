import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const DEFAULT_LIMIT = 20;
const MAX_LIMIT = 100;

/**
 * GET /api/host/revenue
 * 로그인 호스트의 매출 요약 (결제 완료·미취소 예약 기준)
 * Query: startDate, endDate (ISO date), listingId, basis=checkin|payment, page, limit
 */
export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions);
  const userId = (session as { userId?: string } | null)?.userId;
  if (!userId) {
    return NextResponse.json(
      { error: "로그인 후 이용할 수 있습니다." },
      { status: 401 }
    );
  }

  const { searchParams } = new URL(request.url);
  const startDateStr = searchParams.get("startDate");
  const endDateStr = searchParams.get("endDate");
  const listingId = searchParams.get("listingId") || undefined;
  const basis = (searchParams.get("basis") === "payment" ? "payment" : "checkin") as "checkin" | "payment";
  const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
  const limit = Math.min(MAX_LIMIT, Math.max(1, parseInt(searchParams.get("limit") || String(DEFAULT_LIMIT), 10)));

  const startDate = startDateStr ? new Date(startDateStr + "T00:00:00.000Z") : null;
  const endDate = endDateStr ? new Date(endDateStr + "T23:59:59.999Z") : null;

  const baseWhere = {
    listing: { userId, ...(listingId ? { id: listingId } : {}) },
    paymentStatus: "paid",
    status: { not: "cancelled" as const },
  };

  if (basis === "payment") {
    const dateFilter =
      startDate && endDate
        ? { verifiedAt: { gte: startDate, lte: endDate } }
        : {};
    const paidBookings = await prisma.booking.findMany({
      where: {
        ...baseWhere,
        transactions: {
          some: { status: "paid", ...(Object.keys(dateFilter).length ? dateFilter : {}) },
        },
      },
      include: {
        listing: { select: { id: true, title: true } },
        transactions: {
          where: { status: "paid" },
          orderBy: { verifiedAt: "desc" },
          take: 1,
          select: { verifiedAt: true },
        },
      },
      orderBy: { checkIn: "desc" },
    });
    const withPaymentDate = paidBookings.map((b) => ({
      ...b,
      paymentDate: b.transactions[0]?.verifiedAt ?? b.updatedAt,
    }));
    const totalCount = withPaymentDate.length;
    const totalRevenue = withPaymentDate.reduce((sum, b) => sum + b.totalPrice, 0);
    const byListing = withPaymentDate.reduce<
      Record<string, { listingId: string; title: string; revenue: number; count: number }>
    >((acc, b) => {
      const id = b.listing.id;
      if (!acc[id]) acc[id] = { listingId: id, title: b.listing.title, revenue: 0, count: 0 };
      acc[id].revenue += b.totalPrice;
      acc[id].count += 1;
      return acc;
    }, {});
    const byListingList = Object.values(byListing).sort((a, b) => b.revenue - a.revenue);
    const start = (page - 1) * limit;
    const paginated = withPaymentDate.slice(start, start + limit).map((b) => ({
      id: b.id,
      totalPrice: b.totalPrice,
      checkIn: b.checkIn.toISOString().slice(0, 10),
      checkOut: b.checkOut.toISOString().slice(0, 10),
      paymentDate: b.paymentDate?.toISOString().slice(0, 10),
      listingId: b.listing.id,
      listingTitle: b.listing.title,
    }));
    const now = new Date();
    const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const thisMonthRevenue = withPaymentDate
      .filter((b) => b.checkIn >= thisMonthStart)
      .reduce((sum, b) => sum + b.totalPrice, 0);
    return NextResponse.json({
      totalRevenue,
      periodRevenue: totalRevenue,
      thisMonthRevenue,
      thisMonthStart: thisMonthStart.toISOString().slice(0, 10),
      bookingCount: totalCount,
      byListing: byListingList,
      bookings: paginated,
      totalCount,
      page,
      limit,
    });
  }

  const dateFilter =
    startDate && endDate
      ? { checkIn: { gte: startDate, lte: endDate } }
      : {};
  const paidBookings = await prisma.booking.findMany({
    where: { ...baseWhere, ...dateFilter },
    select: {
      id: true,
      totalPrice: true,
      checkIn: true,
      checkOut: true,
      listingId: true,
      listing: { select: { id: true, title: true } },
    },
    orderBy: { checkIn: "desc" },
  });

  const totalCount = paidBookings.length;
  const totalRevenue = paidBookings.reduce((sum, b) => sum + b.totalPrice, 0);
  const byListing = paidBookings.reduce<
    Record<string, { listingId: string; title: string; revenue: number; count: number }>
  >((acc, b) => {
    const id = b.listing.id;
    if (!acc[id]) acc[id] = { listingId: id, title: b.listing.title, revenue: 0, count: 0 };
    acc[id].revenue += b.totalPrice;
    acc[id].count += 1;
    return acc;
  }, {});
  const byListingList = Object.values(byListing).sort((a, b) => b.revenue - a.revenue);
  const start = (page - 1) * limit;
  const paginated = paidBookings.slice(start, start + limit).map((b) => ({
    id: b.id,
    totalPrice: b.totalPrice,
    checkIn: b.checkIn.toISOString().slice(0, 10),
    checkOut: b.checkOut.toISOString().slice(0, 10),
    paymentDate: null as string | null,
    listingId: b.listing.id,
    listingTitle: b.listing.title,
  }));

  const now = new Date();
  const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const thisMonthRevenue = paidBookings
    .filter((b) => b.checkIn >= thisMonthStart)
    .reduce((sum, b) => sum + b.totalPrice, 0);

  return NextResponse.json({
    totalRevenue,
    periodRevenue: totalRevenue,
    thisMonthRevenue,
    thisMonthStart: thisMonthStart.toISOString().slice(0, 10),
    bookingCount: totalCount,
    byListing: byListingList,
    bookings: paginated,
    totalCount,
    page,
    limit,
  });
}
