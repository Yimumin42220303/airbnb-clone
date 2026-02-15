import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { payWithBillingKey } from "@/lib/portone";
import { sendEmailAsync, BASE_URL } from "@/lib/email";
import {
  paymentConfirmationGuest,
  paymentConfirmationHost,
  deferredPaymentFailedGuest,
} from "@/lib/email-templates";

/**
 * POST /api/cron/charge-deferred
 *
 * Vercel Cron Job: 매일 자정(UTC) 실행
 * 빌링키 등록 후 결제 대기 중인 예약 중 자동 결제 예정일이 도래한 건을 처리합니다.
 */
export async function POST(request: Request) {
  // Cron Secret 검증
  const authHeader = request.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;
  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json(
      { error: "Unauthorized" },
      { status: 401 }
    );
  }

  const now = new Date();

  // 자동 결제 대상 조회: deferred + pending + scheduledPaymentDate <= now + 취소되지 않은 건
  const bookings = await prisma.booking.findMany({
    where: {
      paymentMethod: "deferred",
      paymentStatus: "pending",
      status: { not: "cancelled" },
      billingKey: { not: null },
      scheduledPaymentDate: { lte: now },
    },
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

  const results: Array<{
    bookingId: string;
    success: boolean;
    error?: string;
  }> = [];

  for (const booking of bookings) {
    const paymentId = `deferred_${booking.id}_${Date.now()}`;

    try {
      const portoneResult = await payWithBillingKey({
        billingKey: booking.billingKey!,
        paymentId,
        amount: booking.totalPrice,
        orderName: booking.listing.title.slice(0, 50),
      });

      // 결제 성공: 트랜잭션 기록 + 상태 업데이트
      await prisma.$transaction([
        prisma.paymentTransaction.create({
          data: {
            bookingId: booking.id,
            paymentId,
            transactionId: portoneResult.transactionId || null,
            amount: booking.totalPrice,
            status: "paid",
            method: portoneResult.method?.type || "CARD",
            pgProvider: portoneResult.channel?.pgProvider || null,
            rawResponse: JSON.stringify(portoneResult),
            verifiedAt: now,
          },
        }),
        prisma.booking.update({
          where: { id: booking.id },
          data: {
            paymentStatus: "paid",
            billingKey: null, // 결제 완료 후 빌링키 삭제 (보안)
          },
        }),
      ]);

      // 결제 완료 이메일 발송
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
        bookingId: booking.id,
        baseUrl: BASE_URL,
      };

      const hostEmail = booking.listing.user?.email;
      const isSameEmail =
        hostEmail &&
        booking.user?.email &&
        hostEmail === booking.user.email;

      if (booking.user?.email && !isSameEmail) {
        const guestMail = paymentConfirmationGuest(emailInfo);
        sendEmailAsync({ to: booking.user.email, ...guestMail });
      }

      if (hostEmail) {
        const hostMail = paymentConfirmationHost({
          ...emailInfo,
          hostName: booking.listing.user?.name || "Host",
        });
        sendEmailAsync({ to: hostEmail, ...hostMail });
      }

      results.push({ bookingId: booking.id, success: true });
    } catch (err) {
      console.error(
        `[Cron] Deferred payment failed for booking ${booking.id}:`,
        err
      );

      // 결제 실패 기록
      await prisma.$transaction([
        prisma.paymentTransaction.create({
          data: {
            bookingId: booking.id,
            paymentId,
            amount: booking.totalPrice,
            status: "failed",
            failReason:
              err instanceof Error ? err.message : "Unknown error",
          },
        }),
        prisma.booking.update({
          where: { id: booking.id },
          data: { paymentStatus: "failed" },
        }),
      ]);

      // 결제 실패 이메일 발송 (게스트)
      if (booking.user?.email) {
        const nights = Math.floor(
          (booking.checkOut.getTime() - booking.checkIn.getTime()) /
            (24 * 60 * 60 * 1000)
        );
        const failMail = deferredPaymentFailedGuest({
          listingTitle: booking.listing.title,
          listingLocation: booking.listing.location,
          checkIn: booking.checkIn.toISOString().slice(0, 10),
          checkOut: booking.checkOut.toISOString().slice(0, 10),
          guests: booking.guests,
          nights,
          totalPrice: booking.totalPrice,
          guestName: booking.user.name || "Guest",
          guestEmail: booking.user.email,
          bookingId: booking.id,
          baseUrl: BASE_URL,
        });
        sendEmailAsync({ to: booking.user.email, ...failMail });
      }

      results.push({
        bookingId: booking.id,
        success: false,
        error: err instanceof Error ? err.message : "Unknown error",
      });
    }
  }

  return NextResponse.json({
    ok: true,
    processed: bookings.length,
    results,
  });
}
