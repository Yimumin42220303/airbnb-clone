import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getPayment } from "@/lib/portone";
import { onPaymentVerified } from "@/lib/payment-complete";
import { sendChannelTalkNotification } from "@/lib/channel-api";
import { triggerMetaPurchaseConversion } from "@/lib/meta-purchase";
import { getJpyToKrwRate } from "@/lib/exchange-rate";
import { STORED_CURRENCY, convertJpyToKrw } from "@/lib/currency";
import { hasOverlappingPaidBooking } from "@/lib/availability";

/**
 * POST /api/payments/verify
 *
 * Client calls this after payment to verify with Portone server.
 * body: { paymentId, bookingId }
 * 항상 JSON 응답을 반환해 클라이언트가 파싱 오류 없이 에러 메시지를 표시할 수 있도록 함.
 */
export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    const userId = (session as { userId?: string } | null)?.userId;
    if (!userId) {
      return NextResponse.json(
        { ok: false, error: "로그인이 필요합니다." },
        { status: 401 }
      );
    }

    let body: { paymentId?: string; bookingId?: string };
    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { ok: false, error: "잘못된 요청입니다." },
        { status: 400 }
      );
    }

    const { paymentId, bookingId } = body;
    if (!paymentId || !bookingId) {
      return NextResponse.json(
        { ok: false, error: "paymentId와 bookingId가 필요합니다." },
        { status: 400 }
      );
    }

    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
      include: { user: { select: { email: true } } },
    });
    if (!booking) {
      return NextResponse.json(
        { ok: false, error: "예약을 찾을 수 없습니다." },
        { status: 404 }
      );
    }
    if (booking.userId !== userId) {
      return NextResponse.json(
        { ok: false, error: "권한이 없습니다." },
        { status: 403 }
      );
    }

    if (booking.paymentStatus === "paid") {
      // 웹훅이 먼저 paid를 기록한 경우: 대화방·메시지가 아직 없으면 보완 생성
      let conversationId: string | null = null;
      try {
        const existing = await prisma.conversation.findUnique({
          where: { bookingId },
          select: { id: true, _count: { select: { messages: true } } },
        });
        if (!existing || existing._count.messages === 0) {
          conversationId = await onPaymentVerified(bookingId);
        } else {
          conversationId = existing.id;
        }
      } catch (err) {
        console.error("[payments/verify] alreadyPaid补完 error:", err);
      }
      return NextResponse.json({ ok: true, alreadyPaid: true, conversationId });
    }

    let portonePayment;
    try {
      portonePayment = await getPayment(paymentId);
    } catch (err) {
      console.error("Portone payment lookup error:", err);
      return NextResponse.json(
        { ok: false, error: "결제 정보 확인에 실패했습니다. 잠시 후 다시 시도해 주세요." },
        { status: 502 }
      );
    }

    const paidAmount = portonePayment.totalAmount ?? 0;

    if (portonePayment.status !== "PAID") {
      await prisma.paymentTransaction.create({
        data: {
          bookingId,
          paymentId,
          transactionId: portonePayment.transactionId || null,
          amount: paidAmount,
          status: "failed",
          method: portonePayment.method?.type || null,
          pgProvider: portonePayment.channel?.pgProvider || null,
          failReason: "Portone status: " + portonePayment.status,
          rawResponse: JSON.stringify(portonePayment),
        },
      });
      return NextResponse.json(
        { ok: false, error: "결제가 완료되지 않았습니다. 상태: " + portonePayment.status },
        { status: 400 }
      );
    }

    // Amount verification (critical security check)
    const expectedKrw =
      STORED_CURRENCY === "JPY"
        ? convertJpyToKrw(booking.totalPrice, await getJpyToKrwRate())
        : booking.totalPrice;
    if (Math.abs(paidAmount - expectedKrw) > 1) {
      await prisma.paymentTransaction.create({
        data: {
          bookingId,
          paymentId,
          transactionId: portonePayment.transactionId || null,
          amount: paidAmount,
          status: "failed",
          method: portonePayment.method?.type || null,
          pgProvider: portonePayment.channel?.pgProvider || null,
          failReason:
            "Amount mismatch: paid=" + paidAmount + " expected=" + expectedKrw,
          rawResponse: JSON.stringify(portonePayment),
        },
      });
      console.error(
        "Payment amount mismatch! paymentId=" + paymentId,
        "paid=" + paidAmount,
        "expected=" + expectedKrw
      );
      return NextResponse.json(
        { ok: false, error: "결제 금액이 예약 금액과 일치하지 않습니다." },
        { status: 400 }
      );
    }

    const slotConflict = await hasOverlappingPaidBooking(
      booking.listingId,
      booking.checkIn,
      booking.checkOut,
      bookingId
    );
    if (slotConflict) {
      await prisma.paymentTransaction.create({
        data: {
          bookingId,
          paymentId,
          transactionId: portonePayment.transactionId || null,
          amount: paidAmount,
          status: "failed",
          method: portonePayment.method?.type || null,
          pgProvider: portonePayment.channel?.pgProvider || null,
          failReason: "Slot already occupied by another paid booking",
          rawResponse: JSON.stringify(portonePayment),
        },
      });
      console.error(
        "[payments/verify] Slot conflict after PG paid; bookingId=" + bookingId
      );
      return NextResponse.json(
        {
          ok: false,
          error:
            "해당 기간에 이미 결제가 완료된 예약이 있어 확정할 수 없습니다. 중복 결제가 의심되면 고객센터로 문의해 주세요.",
        },
        { status: 409 }
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
          amount: paidAmount,
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

    // 결제 완료 후 처리 (대화방·메시지·이메일·알림·Beds24·스케줄 메시지)
    let conversationId: string | null = null;
    try {
      conversationId = await onPaymentVerified(bookingId);
    } catch (postErr) {
      console.error("[Payment Verify] post-complete error:", postErr);
    }

    const metaPurchase = triggerMetaPurchaseConversion({
      bookingId,
      listingId: booking.listingId,
      value: booking.totalPrice,
      request,
      userEmail: booking.user?.email ?? null,
    });

    // 채널톡 봇 알림 (실패해도 결제 완료 응답은 유지)
    try {
      await sendChannelTalkNotification(
        userId,
        "예약이 확정되었습니다. 메시지창에서 자세한 내용을 확인하세요."
      );
    } catch {
      // 로그는 channel-api 내부에서 처리
    }

    return NextResponse.json({
      ok: true,
      paymentStatus: "paid",
      bookingStatus: "confirmed",
      conversationId,
      verifiedAt: now.toISOString(),
      metaPurchaseEventId: metaPurchase.eventId,
      purchaseValue: metaPurchase.value,
    });
  } catch (err) {
    console.error("[POST /api/payments/verify] Unhandled error:", err);
    return NextResponse.json(
      {
        ok: false,
        error:
          "결제 검증 중 일시적인 오류가 발생했습니다. 잠시 후 다시 시도해 주세요.",
      },
      { status: 500 }
    );
  }
}