import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getListingBlockedDateKeys } from "@/lib/availability";

/**
 * GET /api/host/bookings?month=2026-02
 * 호스트 숙소 목록 + 해당 월에 걸친 예약 목록 (게스트명 포함)
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

  const monthParam = request.nextUrl.searchParams.get("month"); // YYYY-MM
  const statusFilter = request.nextUrl.searchParams.get("status"); // pending | confirmed | cancelled

  if (!monthParam) {
    // 전체 예약 목록 (호스트 예약 관리 페이지용)
    const bookings = await prisma.booking.findMany({
      where: {
        listing: { userId },
        ...(statusFilter && { status: statusFilter }),
      },
      orderBy: { createdAt: "desc" },
      include: {
        listing: { select: { id: true, title: true } },
        user: { select: { name: true, email: true } },
      },
    });
    return NextResponse.json({
      bookings: bookings.map((b) => ({
        id: b.id,
        checkIn: b.checkIn.toISOString(),
        checkOut: b.checkOut.toISOString(),
        totalPrice: b.totalPrice,
        status: b.status,
        paymentStatus: b.paymentStatus,
        guests: b.guests,
        guestName: b.user.name || b.user.email || "게스트",
        listingId: b.listing.id,
        listingTitle: b.listing.title,
      })),
    });
  }

  const now = new Date();
  const year = monthParam ? parseInt(monthParam.slice(0, 4), 10) : now.getFullYear();
  const month = monthParam ? parseInt(monthParam.slice(5, 7), 10) - 1 : now.getMonth();
  const start = new Date(year, month, 1);
  const end = new Date(year, month + 1, 0, 23, 59, 59);
  const monthEnd = new Date(year, month + 1, 0, 23, 59, 59); // 해당 월 마지막 날

  const listings = await prisma.listing.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      title: true,
      location: true,
      imageUrl: true,
      pricePerNight: true,
      bookings: {
        where: {
          status: { not: "cancelled" },
          checkIn: { lte: end },
          checkOut: { gte: start },
        },
        select: {
          id: true,
          checkIn: true,
          checkOut: true,
          totalPrice: true,
          status: true,
          paymentStatus: true,
          user: { select: { name: true, email: true } },
        },
        orderBy: { checkIn: "asc" },
      },
    },
  });

  const listingsWithGuestNamesAndBlocked = await Promise.all(
    listings.map(async (l) => {
      const blockedDateKeys = await getListingBlockedDateKeys(l.id, start, monthEnd);
      return {
        ...l,
        blockedDateKeys,
        bookings: l.bookings.map((b) => ({
          id: b.id,
          checkIn: b.checkIn.toISOString(),
          checkOut: b.checkOut.toISOString(),
          totalPrice: b.totalPrice,
          status: b.status,
          paymentStatus: b.paymentStatus,
          guestName: b.user.name || b.user.email || "게스트",
        })),
      };
    })
  );

  return NextResponse.json({
    month: { year, month: month + 1 },
    listings: listingsWithGuestNamesAndBlocked,
  });
}
