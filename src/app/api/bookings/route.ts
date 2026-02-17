import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { createBooking } from "@/lib/bookings";
import { prisma } from "@/lib/prisma";
import { getOfficialUserId } from "@/lib/official-account";
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
    guestPhone: b.guestPhone ?? null,
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
    const guestPhone = body.guestPhone;

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
      guestPhone: guestPhone != null ? String(guestPhone).trim() || undefined : undefined,
    });

    if (!result.ok) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    const bookingId = result.booking.id;
    let conversationId: string | undefined;

    // 예약 직후 대화방 생성 + 도쿄민박 공식 메시지 2건
    const officialUserId = await getOfficialUserId();
    if (!officialUserId) {
      console.warn(
        "[Booking] Official account not found. Run db:seed to create official@tokyominbak.com"
      );
    }
    if (officialUserId) {
      try {
        const conversation = await prisma.conversation.upsert({
          where: { bookingId },
          create: { bookingId },
          update: {},
        });
        conversationId = conversation.id;
        await prisma.message.createMany({
          data: [
            {
              conversationId: conversation.id,
              senderId: officialUserId,
              body: "예약 요청이 접수되었습니다. 호스트가 확인할 때까지 잠시만 기다려 주세요.",
            },
            {
              conversationId: conversation.id,
              senderId: officialUserId,
              body: "호스트가 승인하시면 결제 방법을 안내해 드릴게요.",
            },
          ],
        });
      } catch (err) {
        console.error("[Booking] Conversation/official messages:", err);
      }
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

      if (!listing) {
        console.warn("[Booking Email] listing not found, listingId:", listingId);
      } else {
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
          guestName: guestUser?.name || "Guest",
          guestEmail: guestUser?.email ?? "",
          bookingId: booking.id,
          baseUrl: BASE_URL,
        };

        const hostEmail = listing.user?.email ?? null;
        const isSameEmail =
          hostEmail && guestUser?.email && hostEmail === guestUser.email;

        if (!hostEmail) {
          console.warn(
            "[Booking Email] 호스트 이메일이 없어 알림을 보내지 않습니다. listingId:",
            listingId
          );
        }

        // Guest email (게스트 이메일이 있고, 호스트와 다른 경우만)
        if (guestUser?.email && !isSameEmail) {
          const guestMail = bookingConfirmationGuest(emailInfo);
          sendEmailAsync({ to: guestUser.email, ...guestMail });
        }

        // Host email: 예약 요청 알림 (listing만 있으면 발송, 게스트 이메일 유무와 무관)
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

    return NextResponse.json(
      { ...result.booking, conversationId },
      { status: 201 }
    );
  } catch (error) {
    console.error("POST /api/bookings", error);
    return NextResponse.json(
      { error: "예약 처리 중 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}
