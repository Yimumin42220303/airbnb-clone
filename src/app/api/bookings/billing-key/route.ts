import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { sendEmailAsync, BASE_URL } from "@/lib/email";
import {
  billingKeyRegisteredGuest,
  billingKeyRegisteredHost,
} from "@/lib/email-templates";

/**
 * POST /api/bookings/billing-key
 *
 * 빌링키(카드 등록) 저장 API.
 * 체크인 7일 이상 전 예약 시, 즉시 결제 대신 카드만 등록하고
 * 체크인 7일 전에 자동 결제되도록 스케줄링합니다.
 *
 * body: { bookingId, billingKey }
 */
export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  const userId = (session as { userId?: string } | null)?.userId;
  if (!userId) {
    return NextResponse.json(
      { error: "Login required" },
      { status: 401 }
    );
  }

  let body: { bookingId?: string; billingKey?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  const { bookingId, billingKey } = body;
  if (!bookingId || !billingKey) {
    return NextResponse.json(
      { error: "bookingId and billingKey are required" },
      { status: 400 }
    );
  }

  const booking = await prisma.booking.findUnique({
    where: { id: bookingId },
    include: {
      listing: {
        select: {
          title: true,
          location: true,
          user: { select: { name: true, email: true } },
        },
      },
      user: { select: { name: true, email: true } },
    },
  });

  if (!booking) {
    return NextResponse.json(
      { error: "Booking not found" },
      { status: 404 }
    );
  }
  if (booking.userId !== userId) {
    return NextResponse.json(
      { error: "Forbidden" },
      { status: 403 }
    );
  }

  // 체크인 7일 전 날짜를 자동 결제 예정일로 설정
  const scheduledPaymentDate = new Date(booking.checkIn);
  scheduledPaymentDate.setDate(scheduledPaymentDate.getDate() - 7);
  // 자정(00:00:00) 기준으로 설정
  scheduledPaymentDate.setHours(0, 0, 0, 0);

  await prisma.booking.update({
    where: { id: bookingId },
    data: {
      billingKey,
      paymentMethod: "deferred",
      scheduledPaymentDate,
      status: "confirmed",
    },
  });

  // 이메일 발송
  const nights = Math.floor(
    (booking.checkOut.getTime() - booking.checkIn.getTime()) /
      (24 * 60 * 60 * 1000)
  );
  const emailInfo = {
    listingTitle: booking.listing.title,
    listingLocation: booking.listing.location,
    checkIn: booking.checkIn.toISOString().slice(0, 10),
    checkOut: booking.checkOut.toISOString().slice(0, 10),
    guests: booking.guests,
    nights,
    totalPrice: booking.totalPrice,
    guestName: booking.user?.name || "Guest",
    guestEmail: booking.user?.email || "",
    bookingId,
    baseUrl: BASE_URL,
    scheduledPaymentDate: scheduledPaymentDate.toISOString().slice(0, 10),
  };

  const hostEmail = booking.listing.user?.email;
  const isSameEmail =
    hostEmail && booking.user?.email && hostEmail === booking.user.email;

  // 게스트 이메일 (한국어)
  if (booking.user?.email && !isSameEmail) {
    const guestMail = billingKeyRegisteredGuest(emailInfo);
    sendEmailAsync({ to: booking.user.email, ...guestMail });
  }

  // 호스트 이메일 (일본어)
  if (hostEmail) {
    const hostMail = billingKeyRegisteredHost({
      ...emailInfo,
      hostName: booking.listing.user?.name || "Host",
    });
    sendEmailAsync({ to: hostEmail, ...hostMail });
  }

  return NextResponse.json({
    ok: true,
    paymentMethod: "deferred",
    scheduledPaymentDate: scheduledPaymentDate.toISOString(),
  });
}
