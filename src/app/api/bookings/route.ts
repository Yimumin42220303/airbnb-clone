import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { createBooking } from "@/lib/bookings";
import { prisma } from "@/lib/prisma";
import { sendEmailAsync, BASE_URL } from "@/lib/email";
import { bookingConfirmationGuest, bookingNotificationHost } from "@/lib/email-templates";

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

  const [bookings, reviewedListingIds] = await Promise.all([
    prisma.booking.findMany({
      where: { userId },
      orderBy: { checkIn: "desc" },
      include: {
        listing: {
          select: {
            id: true,
            title: true,
            location: true,
            imageUrl: true,
            cancellationPolicy: true,
          },
        },
        transactions: {
          where: { status: "refunded" },
          orderBy: { createdAt: "desc" },
          take: 1,
          select: { amount: true },
        },
      },
    }),
    prisma.review
      .findMany({
        where: { userId },
        select: { listingId: true },
      })
      .then((r) => r.map((x) => x.listingId)),
  ]);

  const list = bookings.map((b) => ({
    id: b.id,
    checkIn: b.checkIn.toISOString().slice(0, 10),
    checkOut: b.checkOut.toISOString().slice(0, 10),
    guests: b.guests,
    totalPrice: b.totalPrice,
    status: b.status,
    paymentStatus: b.paymentStatus,
    createdAt: b.createdAt.toISOString(),
    listing: b.listing,
    lastRefund: b.transactions[0] ?? null,
    reviewed: reviewedListingIds.includes(b.listingId),
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

    // Send booking notification emails (fire-and-forget)
    try {
      const booking = result.booking;
      const listing = await prisma.listing.findUnique({
        where: { id: String(listingId) },
        select: {
          title: true,
          location: true,
          user: { select: { name: true, email: true } },
        },
      });
      const guestUser = await prisma.user.findUnique({
        where: { id: (session as { userId?: string } | null)?.userId ?? "" },
        select: { name: true, email: true },
      });

      if (listing && guestUser?.email) {
        const nights = Math.floor(
          (new Date(String(checkOut)).getTime() - new Date(String(checkIn)).getTime()) /
            (24 * 60 * 60 * 1000)
        );
        const emailInfo = {
          listingTitle: listing.title,
          listingLocation: listing.location,
          checkIn: String(checkIn),
          checkOut: String(checkOut),
          guests: Number(guests),
          nights,
          totalPrice: booking.totalPrice,
          guestName: guestUser.name || "Guest",
          guestEmail: guestUser.email,
          bookingId: booking.id,
          baseUrl: BASE_URL,
        };

        const hostEmail = listing.user?.email;
        const isSameEmail = hostEmail && hostEmail === guestUser.email;

        if (!hostEmail) {
          console.warn(
            "[Booking Email] 호스트 이메일이 없어 알림을 보내지 않습니다. listingId:",
            listingId
          );
        }

        // Guest email (호스트와 같은 이메일이면 생략)
        if (!isSameEmail) {
          const guestMail = bookingConfirmationGuest(emailInfo);
          sendEmailAsync({ to: guestUser.email, ...guestMail });
        }

        // Host email: 예약 요청 알림 (일본어)
        if (hostEmail) {
          const hostMail = bookingNotificationHost({
            ...emailInfo,
            hostName: listing.user?.name || "Host",
          });
          sendEmailAsync({ to: hostEmail, ...hostMail });
        }
      }
    } catch (emailErr) {
      console.error("[Booking Email] Error:", emailErr);
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
