import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

/**
 * GET /api/host/revenue
 * 로그인 호스트의 매출 요약 (결제 완료·미취소 예약 기준)
 */
export async function GET() {
  const session = await getServerSession(authOptions);
  const userId = (session as { userId?: string } | null)?.userId;
  if (!userId) {
    return NextResponse.json(
      { error: "로그인 후 이용할 수 있습니다." },
      { status: 401 }
    );
  }

  const paidBookings = await prisma.booking.findMany({
    where: {
      listing: { userId },
      paymentStatus: "paid",
      status: { not: "cancelled" },
    },
    select: {
      id: true,
      totalPrice: true,
      checkIn: true,
      listingId: true,
      listing: {
        select: { id: true, title: true },
      },
    },
    orderBy: { checkIn: "desc" },
  });

  const totalRevenue = paidBookings.reduce((sum, b) => sum + b.totalPrice, 0);

  const byListing = paidBookings.reduce<
    Record<string, { listingId: string; title: string; revenue: number; count: number }>
  >((acc, b) => {
    const id = b.listing.id;
    if (!acc[id]) {
      acc[id] = { listingId: id, title: b.listing.title, revenue: 0, count: 0 };
    }
    acc[id].revenue += b.totalPrice;
    acc[id].count += 1;
    return acc;
  }, {});

  const byListingList = Object.values(byListing).sort(
    (a, b) => b.revenue - a.revenue
  );

  const now = new Date();
  const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const thisMonthRevenue = paidBookings
    .filter((b) => b.checkIn >= thisMonthStart)
    .reduce((sum, b) => sum + b.totalPrice, 0);

  return NextResponse.json({
    totalRevenue,
    thisMonthRevenue,
    bookingCount: paidBookings.length,
    byListing: byListingList,
    recentBookings: paidBookings.slice(0, 10).map((b) => ({
      id: b.id,
      totalPrice: b.totalPrice,
      checkIn: b.checkIn.toISOString().slice(0, 10),
      listingTitle: b.listing.title,
    })),
  });
}
