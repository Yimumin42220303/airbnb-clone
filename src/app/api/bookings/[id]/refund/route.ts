import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { cancelPayment, deleteBillingKey } from "@/lib/portone";
import {
  calculateRefundAmount,
  type CancellationPolicyType,
} from "@/lib/policies";
import { sendEmailAsync, BASE_URL } from "@/lib/email";
import {
  bookingCancelledGuest,
  bookingCancelledHost,
} from "@/lib/email-templates";

/**
 * POST /api/bookings/[id]/refund
 *
 * Cancel booking + Portone refund processing.
 * Refund calculated based on the listing's cancellation policy (flexible/moderate/strict).
 */
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  void request;

  const session = await getServerSession(authOptions);
  const userId = (session as { userId?: string } | null)?.userId;
  if (!userId) {
    return NextResponse.json(
      { error: "Login required" },
      { status: 401 }
    );
  }

  const { id } = await params;

  const booking = await prisma.booking.findUnique({
    where: { id },
    include: {
      listing: {
        select: {
          cancellationPolicy: true,
          title: true,
          location: true,
          user: { select: { name: true, email: true } },
        },
      },
      user: { select: { name: true, email: true } },
      transactions: {
        where: { status: "paid" },
        orderBy: { createdAt: "desc" },
        take: 1,
      },
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
  if (booking.status === "cancelled") {
    return NextResponse.json(
      { error: "Already cancelled" },
      { status: 400 }
    );
  }

  const now = new Date();
  const todayMidnight = new Date(now);
  todayMidnight.setHours(0, 0, 0, 0);
  if (booking.checkIn < todayMidnight) {
    return NextResponse.json(
      { error: "Cannot cancel past bookings" },
      { status: 400 }
    );
  }

  // === 빌링키 미결제 예약: 빌링키만 삭제 (PG 수수료 0원) ===
  if (
    booking.paymentMethod === "deferred" &&
    (booking.paymentStatus === "pending" || booking.paymentStatus === "failed") &&
    booking.billingKey
  ) {
    try {
      await deleteBillingKey(booking.billingKey);
    } catch (err) {
      console.error("Billing key delete error:", err);
      // 빌링키 삭제 실패해도 취소는 진행 (이미 만료되었을 수 있음)
    }

    await prisma.booking.update({
      where: { id },
      data: {
        status: "cancelled",
        paymentStatus: "refunded",
        billingKey: null,
      },
    });

    // 취소 이메일 발송
    const nights = Math.floor(
      (booking.checkOut.getTime() - booking.checkIn.getTime()) / (24 * 60 * 60 * 1000)
    );
    const emailInfo = {
      listingTitle: booking.listing.title || "",
      listingLocation: booking.listing.location || "",
      checkIn: booking.checkIn.toISOString().slice(0, 10),
      checkOut: booking.checkOut.toISOString().slice(0, 10),
      guests: booking.guests,
      nights,
      totalPrice: booking.totalPrice,
      guestName: booking.user?.name || "Guest",
      guestEmail: booking.user?.email || "",
      bookingId: id,
      baseUrl: BASE_URL,
    };

    const hostEmail = booking.listing.user?.email;
    const isSameEmail = hostEmail && booking.user?.email && hostEmail === booking.user.email;

    if (booking.user?.email && !isSameEmail) {
      const guestMail = bookingCancelledGuest({
        ...emailInfo,
        refundAmount: booking.totalPrice,
        refundPolicy: "카드 미결제 상태: 전액 취소 (수수료 없음)",
      });
      sendEmailAsync({ to: booking.user.email, ...guestMail });
    }
    if (hostEmail) {
      const hostMail = bookingCancelledHost({
        ...emailInfo,
        hostName: booking.listing.user?.name || "Host",
      });
      sendEmailAsync({ to: hostEmail, ...hostMail });
    }

    return NextResponse.json({
      ok: true,
      status: "cancelled",
      refundPolicy: "카드 미결제 상태: 빌링키 삭제 (PG 수수료 0원)",
      refundRate: 1,
      refundAmount: booking.totalPrice,
      totalPrice: booking.totalPrice,
      portoneRefund: false,
      billingKeyCancelled: true,
    });
  }

  // === 결제 완료 예약: 기존 환불 로직 ===
  // Calculate refund based on listing's cancellation policy
  // Pass actual current time (not midnight) for accurate 48h grace period calculation
  const policy = (booking.listing.cancellationPolicy || "flexible") as CancellationPolicyType;
  const refundResult = calculateRefundAmount({
    policy,
    totalPrice: booking.totalPrice,
    checkInDate: booking.checkIn,
    cancellationDate: now,
    bookingCreatedAt: booking.createdAt,
  });

  const refundRate = refundResult.rate;
  const refundPolicy = refundResult.policyLabel + ": " + refundResult.description;
  const refundAmount = refundResult.amount;

  const paidTransaction = booking.transactions[0];
  let portoneRefundDone = false;

  if (paidTransaction && refundAmount > 0) {
    try {
      const portoneRefundResult = await cancelPayment(
        paidTransaction.paymentId,
        "Customer cancellation (" + refundPolicy + ")",
        refundAmount
      );

      await prisma.paymentTransaction.create({
        data: {
          bookingId: id,
          paymentId: paidTransaction.paymentId,
          transactionId: portoneRefundResult.cancellation?.id || null,
          amount: refundAmount,
          status: "refunded",
          method: paidTransaction.method,
          pgProvider: paidTransaction.pgProvider,
          rawResponse: JSON.stringify(portoneRefundResult),
          verifiedAt: new Date(),
        },
      });

      portoneRefundDone = true;
    } catch (err) {
      console.error("Portone refund error:", err);
      return NextResponse.json(
        { error: "Refund processing failed. Please contact support." },
        { status: 500 }
      );
    }
  }

  await prisma.booking.update({
    where: { id },
    data: {
      status: "cancelled",
      ...(portoneRefundDone ? { paymentStatus: "refunded" } : {}),
      ...(booking.billingKey ? { billingKey: null } : {}),
    },
  });

  // Send cancellation emails
  const nights = Math.floor(
    (booking.checkOut.getTime() - booking.checkIn.getTime()) / (24 * 60 * 60 * 1000)
  );
  const emailInfo = {
    listingTitle: booking.listing.title || "",
    listingLocation: booking.listing.location || "",
    checkIn: booking.checkIn.toISOString().slice(0, 10),
    checkOut: booking.checkOut.toISOString().slice(0, 10),
    guests: booking.guests,
    nights,
    totalPrice: booking.totalPrice,
    guestName: booking.user?.name || "Guest",
    guestEmail: booking.user?.email || "",
    bookingId: id,
    baseUrl: BASE_URL,
  };

  const hostEmail = booking.listing.user?.email;
  const isSameEmail = hostEmail && booking.user?.email && hostEmail === booking.user.email;

  // 게스트 이메일 (호스트와 같은 이메일이면 생략 — 호스트용 일본어 메일만 발송)
  if (booking.user?.email && !isSameEmail) {
    const guestMail = bookingCancelledGuest({
      ...emailInfo,
      refundAmount,
      refundPolicy,
    });
    sendEmailAsync({ to: booking.user.email, ...guestMail });
  }
  // 호스트 이메일 (일본어)
  if (hostEmail) {
    const hostMail = bookingCancelledHost({
      ...emailInfo,
      hostName: booking.listing.user?.name || "Host",
    });
    sendEmailAsync({ to: hostEmail, ...hostMail });
  }

  return NextResponse.json({
    ok: true,
    status: "cancelled",
    refundPolicy,
    refundRate,
    refundAmount,
    totalPrice: booking.totalPrice,
    portoneRefund: portoneRefundDone,
  });
}