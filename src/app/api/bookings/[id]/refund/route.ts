import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { cancelPayment, deleteBillingKey } from "@/lib/portone";
import { cancelBeds24Booking } from "@/lib/beds24";
import {
  calculateRefundAmount,
  type CancellationPolicyType,
} from "@/lib/policies";
import { sendEmailAsync, BASE_URL } from "@/lib/email";
import {
  bookingCancelledGuest,
  bookingCancelledHost,
} from "@/lib/email-templates";
import { createNotification } from "@/lib/notifications";
import { convertJpyToKrw } from "@/lib/currency";
import { getJpyToKrwRate } from "@/lib/exchange-rate";

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

  try {
    const session = await getServerSession(authOptions);
    const userId = (session as { userId?: string } | null)?.userId;
    if (!userId) {
      return NextResponse.json({ error: "Login required" }, { status: 401 });
    }

    const { id } = await params;

    const booking = await prisma.booking.findUnique({
      where: { id },
      include: {
        listing: {
          select: {
            userId: true,
            cancellationPolicy: true,
            title: true,
            location: true,
            beds24AccountKey: true,
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
      return NextResponse.json({ error: "Booking not found" }, { status: 404 });
    }
    if (booking.userId !== userId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    if (booking.status === "cancelled") {
      return NextResponse.json({ error: "Already cancelled" }, { status: 400 });
    }

    const now = new Date();
    const todayMidnight = new Date(now);
    todayMidnight.setHours(0, 0, 0, 0);
    if (booking.checkIn < todayMidnight) {
      return NextResponse.json({ error: "Cannot cancel past bookings" }, { status: 400 });
    }

    // Beds24: 취소 시 캘린더 블록 해제 (실패해도 도쿄민박 취소는 진행)
    if (booking.beds24BookId) {
      try {
        const beds24Result = await cancelBeds24Booking(
          booking.beds24BookId,
          booking.listing.beds24AccountKey ?? null
        );
        if (!beds24Result.ok) console.error("[refund] Beds24 취소 실패:", beds24Result.error);
      } catch (e) {
        console.error("[refund] Beds24 취소 예외:", e);
      }
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
      }

      await prisma.booking.update({
        where: { id },
        data: { status: "cancelled", paymentStatus: "refunded", billingKey: null },
      });

      const fxUnpaid = await getJpyToKrwRate();
      sendCancellationEmails(
        booking,
        id,
        convertJpyToKrw(booking.totalPrice, fxUnpaid),
        "카드 미결제 상태: 전액 취소 (수수료 없음)"
      );

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

    // === 결제 완료 예약: 환불 로직 ===
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
    const refundTransactionPaymentId = paidTransaction
      ? `${paidTransaction.paymentId}:refund:${Date.now()}`
      : null;

    const refundKrw =
      paidTransaction && refundRate > 0
        ? Math.round(paidTransaction.amount * refundRate)
        : 0;

    /** 게스트 이메일은 KRW 표기 — PG 실제 환불액과 동일하게 맞춤 */
    let refundAmountKrwForEmail = 0;
    if (refundRate > 0) {
      if (paidTransaction && refundKrw > 0) {
        refundAmountKrwForEmail = refundKrw;
      } else {
        const fx = await getJpyToKrwRate();
        refundAmountKrwForEmail = convertJpyToKrw(refundResult.amount, fx);
      }
    }

    if (paidTransaction && refundKrw > 0) {
      const isMockPayment = paidTransaction.paymentId.startsWith("mock_");
      if (isMockPayment) {
        await prisma.paymentTransaction.create({
          data: {
            bookingId: id,
            paymentId: refundTransactionPaymentId!,
            transactionId: null,
            amount: refundKrw,
            status: "refunded",
            method: paidTransaction.method,
            pgProvider: paidTransaction.pgProvider,
            rawResponse: JSON.stringify({ mock: true, reason: refundPolicy }),
            verifiedAt: new Date(),
          },
        });
        portoneRefundDone = true;
      } else {
        try {
          const portoneRefundResult = await cancelPayment(
            paidTransaction.paymentId,
            "Customer cancellation (" + refundPolicy + ")",
            refundKrw
          );

          await prisma.paymentTransaction.create({
            data: {
              bookingId: id,
              paymentId: refundTransactionPaymentId!,
              transactionId: portoneRefundResult.cancellation?.id || null,
              amount: refundKrw,
              status: "refunded",
              method: paidTransaction.method,
              pgProvider: paidTransaction.pgProvider,
              rawResponse: JSON.stringify(portoneRefundResult),
              verifiedAt: new Date(),
            },
          });

          portoneRefundDone = true;
        } catch (err) {
          const message = err instanceof Error ? err.message : String(err);
          console.error("[refund] Portone refund error:", message);

          const isTestMode = process.env.NEXT_PUBLIC_PORTONE_TEST_MODE === "true";
          const isNotFoundOrAlreadyCancelled =
            message.includes("404") ||
            /not found|already cancelled|취소됨|취소된/i.test(message);

          if (isTestMode || isNotFoundOrAlreadyCancelled) {
            if (isNotFoundOrAlreadyCancelled) {
              console.warn("[refund] 결제 없음/이미 취소됨: DB만 취소 처리", message);
            } else {
              console.warn("[refund] 테스트 모드: PG 환불 실패, DB만 취소 처리");
            }
            try {
              await prisma.paymentTransaction.create({
                data: {
                  bookingId: id,
                  paymentId: refundTransactionPaymentId!,
                  transactionId: null,
                  amount: refundKrw,
                  status: "refunded",
                  method: paidTransaction.method,
                  pgProvider: paidTransaction.pgProvider,
                  rawResponse: JSON.stringify({
                    testModeFallback: isTestMode,
                    pgSkipped: isNotFoundOrAlreadyCancelled,
                    error: message,
                  }),
                  verifiedAt: new Date(),
                },
              });
            } catch (dbErr) {
              console.error("[refund] DB fallback error:", dbErr);
            }
            portoneRefundDone = true;
          } else {
            const userMessage =
              message.includes("PORTONE_API_SECRET")
                ? "환불을 위해 서버에 PORTONE_API_SECRET 설정이 필요합니다."
                : "환불 처리 중 오류가 발생했습니다. 관리자에게 문의해 주세요.";
            return NextResponse.json(
              { error: userMessage, detail: message },
              { status: 500 }
            );
          }
        }
      }
    }

    const nextPaymentStatus = portoneRefundDone ? "refunded" : booking.paymentStatus;
    await prisma.booking.update({
      where: { id },
      data: {
        status: "cancelled",
        paymentStatus: nextPaymentStatus,
        ...(booking.billingKey ? { billingKey: null } : {}),
      },
    });

    sendCancellationEmails(booking, id, refundAmountKrwForEmail, refundPolicy);

    return NextResponse.json({
      ok: true,
      status: "cancelled",
      refundPolicy,
      refundRate,
      refundAmount,
      totalPrice: booking.totalPrice,
      portoneRefund: portoneRefundDone,
      paymentStatus: nextPaymentStatus,
      cancellationOutcome:
        refundRate > 0 ? "cancelled_with_refund" : "cancelled_without_refund",
    });
  } catch (fatalErr) {
    const msg = fatalErr instanceof Error ? fatalErr.message : String(fatalErr);
    console.error("[refund] Unhandled error:", msg, fatalErr);
    return NextResponse.json(
      { error: "서버 오류가 발생했습니다: " + msg },
      { status: 500 }
    );
  }
}

/** @param refundAmountKrw 게스트 메일용 실제 환불 원화(포트원 취소 금액과 동일 기준) */
function sendCancellationEmails(
  booking: { listing: { title?: string | null; location?: string | null; userId: string | null; user?: { name?: string | null; email?: string | null } | null }; user?: { name?: string | null; email?: string | null } | null; checkOut: Date; checkIn: Date; guests: number; totalPrice: number; listingId: string },
  id: string,
  refundAmountKrw: number,
  refundPolicy: string
) {
  try {
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
      const guestMail = bookingCancelledGuest({ ...emailInfo, refundAmount: refundAmountKrw, refundPolicy });
      sendEmailAsync({ to: booking.user.email, ...guestMail });
    }
    if (hostEmail) {
      const hostMail = bookingCancelledHost({
        ...emailInfo,
        hostName: booking.listing.user?.name || "Host",
      });
      sendEmailAsync({ to: hostEmail, ...hostMail });
    }

    if (booking.listing.userId) {
      createNotification({
        userId: booking.listing.userId,
        type: "booking_cancelled",
        title: `${booking.user?.name || "게스트"}님의 예약이 취소되었어요.`,
        linkPath: "/host/bookings",
        bookingId: id,
        listingId: booking.listingId,
      }).catch(() => {});
    }
  } catch (emailErr) {
    console.error("[refund] Email/notification error:", emailErr);
  }
}