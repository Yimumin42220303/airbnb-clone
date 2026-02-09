import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { createBooking } from "@/lib/bookings";
import { prisma } from "@/lib/prisma";

/**
 * GET /api/bookings
 * 로그인 사용자의 예약 목록 (게스트)
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

  const bookings = await prisma.booking.findMany({
    where: { userId },
    orderBy: { checkIn: "desc" },
    include: {
      listing: {
        select: {
          id: true,
          title: true,
          location: true,
          imageUrl: true,
        },
      },
    },
  });

  const list = bookings.map((b) => ({
    id: b.id,
    checkIn: b.checkIn.toISOString().slice(0, 10),
    checkOut: b.checkOut.toISOString().slice(0, 10),
    guests: b.guests,
    totalPrice: b.totalPrice,
    status: b.status,
    createdAt: b.createdAt.toISOString(),
    listing: b.listing,
  }));

  return NextResponse.json(list);
}

/**
 * POST /api/bookings
 * body: { listingId, checkIn, checkOut, guests }
 */
export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    const body = await request.json();
    const listingId = body.listingId;
    const checkIn = body.checkIn;
    const checkOut = body.checkOut;
    const guests = body.guests;

    if (!listingId || !checkIn || !checkOut || guests == null) {
      return NextResponse.json(
        { error: "listingId, checkIn, checkOut, guests는 필수입니다." },
        { status: 400 }
      );
    }

    const result = await createBooking({
      listingId: String(listingId),
      checkIn: String(checkIn),
      checkOut: String(checkOut),
      guests: Number(guests),
      userId: (session as { userId?: string } | null)?.userId,
    });

    if (!result.ok) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    return NextResponse.json(result.booking, { status: 201 });
  } catch (error) {
    console.error("POST /api/bookings", error);
    return NextResponse.json(
      { error: "예약 처리 중 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}
