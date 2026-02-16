import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getPayment } from "@/lib/portone";
import { sendEmailAsync, BASE_URL } from "@/lib/email";
import {
  paymentConfirmationGuest,
  paymentConfirmationHost,
} from "@/lib/email-templates";

/**
 * POST /api/payments/verify
 *
 * Client calls this after payment to verify with Portone server.
 * body: { paymentId, bookingId }
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

  let body: { paymentId?: string; bookingId?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  const { paymentId, bookingId } = body;
  if (!paymentId || !bookingId) {
    return NextResponse.json(
      { error: "paymentId and bookingId are required" },
      { status: 400 }
    );
  }

  const booking = await prisma.booking.findUnique({
    where: { id: bookingId },
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

  if (booking.paymentStatus === "paid") {
    return NextResponse.json({ ok: true, alreadyPaid: true });
  }

  let portonePayment;
  try {
    portonePayment = await getPayment(paymentId);
  } catch (err) {
    console.error("Portone payment lookup error:", err);
    return NextResponse.json(
      { error: "Failed to verify payment with Portone" },
      { status: 502 }
    );
  }

  if (portonePayment.status !== "PAID") {
    await prisma.paymentTransaction.create({
      data: {
        bookingId,
        paymentId,
        transactionId: portonePayment.transactionId || null,
        amount: portonePayment.totalAmount || 0,
        status: "failed",
        method: portonePayment.method?.type || null,
        pgProvider: portonePayment.channel?.pgProvider || null,
        failReason: "Portone status: " + portonePayment.status,
        rawResponse: JSON.stringify(portonePayment),
      },
    });
    return NextResponse.json(
      { error: "Payment not completed. Status: " + portonePayment.status },
      { status: 400 }
    );
  }

  // Amount verification (critical security check)
  if (portonePayment.totalAmount !== booking.totalPrice) {
    await prisma.paymentTransaction.create({
      data: {
        bookingId,
        paymentId,
        transactionId: portonePayment.transactionId || null,
        amount: portonePayment.totalAmount,
        status: "failed",
        method: portonePayment.method?.type || null,
        pgProvider: portonePayment.channel?.pgProvider || null,
        failReason:
          "Amount mismatch: paid=" +
          portonePayment.totalAmount +
          " booking=" +
          booking.totalPrice,
        rawResponse: JSON.stringify(portonePayment),
      },
    });
    console.error(
      "Payment amount mismatch! paymentId=" + paymentId,
      "paid=" + portonePayment.totalAmount,
      "booking=" + booking.totalPrice
    );
    return NextResponse.json(
      { error: "Payment amount does not match booking amount" },
      { status: 400 }
    );
  }

  // Verification success: 결제 완료 처리 (status는 호스트 승인 시 이미 confirmed)
  const now = new Date();
  await prisma.$transaction([
    prisma.paymentTransaction.create({
      data: {
        bookingId,
        paymentId,
        transactionId: portonePayment.transactionId || null,
        amount: portonePayment.totalAmount,
        status: "paid",
        method: portonePayment.method?.type || null,
        pgProvider: portonePayment.channel?.pgProvider || null,
        rawResponse: JSON.stringify(portonePayment),
        verifiedAt: now,
      },
    }),
    prisma.booking.update({
      where: { id: bookingId },
      data: { paymentStatus: "paid", status: "confirmed" },
    }),
  ]);

  // 결제 완료 후 대화방 생성 + 호스트 환영 메시지
  let conversationId: string | null = null;
  try {
    const fullBooking = await prisma.booking.findUnique({
      where: { id: bookingId },
      include: {
        listing: {
          select: {
            title: true,
            location: true,
            userId: true,
            user: { select: { name: true, email: true } },
          },
        },
        user: { select: { name: true, email: true } },
      },
    });

    if (fullBooking) {
      // 대화방 생성 + 환영 메시지
      try {
        let conversation = await prisma.conversation.findUnique({
          where: { bookingId },
        });
        if (!conversation) {
          conversation = await prisma.conversation.create({
            data: { bookingId },
          });
        }
        conversationId = conversation.id;

        await prisma.message.create({
          data: {
            conversationId: conversation.id,
            senderId: fullBooking.listing.userId,
            body: "예약감사합니다. 3일내에 체크인방법에대해 안내드릴예정이니 조금 기다려주세요.",
          },
        });
      } catch (err) {
        console.error("자동 메시지 전송 오류:", err);
      }

      // 이메일 발송
      if (fullBooking.user?.email) {
        const nights = Math.floor(
          (fullBooking.checkOut.getTime() - fullBooking.checkIn.getTime()) / (24 * 60 * 60 * 1000)
        );
        const emailInfo = {
          listingTitle: fullBooking.listing.title,
          listingLocation: fullBooking.listing.location,
          checkIn: fullBooking.checkIn.toISOString().slice(0, 10),
          checkOut: fullBooking.checkOut.toISOString().slice(0, 10),
          guests: fullBooking.guests,
          nights,
          totalPrice: fullBooking.totalPrice,
          guestName: fullBooking.user.name || "Guest",
          guestEmail: fullBooking.user.email,
          bookingId,
          baseUrl: BASE_URL,
        };

        const hostEmail = fullBooking.listing.user?.email;
        const isSameEmail = hostEmail && hostEmail === fullBooking.user.email;

        // 게스트 이메일
        if (!isSameEmail) {
          const guestMail = paymentConfirmationGuest(emailInfo);
          sendEmailAsync({ to: fullBooking.user.email, ...guestMail });
        }

        // 호스트 이메일 (일본어)
        if (hostEmail) {
          const hostMail = paymentConfirmationHost({
            ...emailInfo,
            hostName: fullBooking.listing.user?.name || "Host",
          });
          sendEmailAsync({ to: hostEmail, ...hostMail });
        }
      }
    }
  } catch (emailErr) {
    console.error("[Payment Email] Error:", emailErr);
  }

  return NextResponse.json({
    ok: true,
    paymentStatus: "paid",
    bookingStatus: "confirmed",
    conversationId,
    verifiedAt: now.toISOString(),
  });
}