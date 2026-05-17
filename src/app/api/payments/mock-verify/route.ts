import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { onPaymentVerified } from "@/lib/payment-complete";
import { sendChannelTalkNotification } from "@/lib/channel-api";
import { getJpyToKrwRate } from "@/lib/exchange-rate";
import { STORED_CURRENCY, convertJpyToKrw } from "@/lib/currency";
import { hasOverlappingPaidBooking } from "@/lib/availability";

/**
 * POST /api/payments/mock-verify
 *
 * 개발/프리뷰 전용: 실제 PG 호출 없이 결제 완료 처리.
 * ENABLE_MOCK_PAYMENT=1 일 때만 동작. 프로덕션에는 설정하지 마세요.
 * body: { bookingId }
 */
export async function POST(request: Request) {
  if (process.env.ENABLE_MOCK_PAYMENT !== "1") {
    return NextResponse.json(
      { ok: false, error: "모의 결제가 허용되지 않은 환경입니다." },
      { status: 403 }
    );
  }

  try {
    const session = await getServerSession(authOptions);
    const userId = (session as { userId?: string } | null)?.userId;
    if (!userId) {
      return NextResponse.json(
        { ok: false, error: "로그인이 필요합니다." },
        { status: 401 }
      );
    }

    let body: { bookingId?: string };
    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { ok: false, error: "잘못된 요청입니다." },
        { status: 400 }
      );
    }

    const { bookingId } = body;
    if (!bookingId) {
      return NextResponse.json(
        { ok: false, error: "bookingId가 필요합니다." },
        { status: 400 }
      );
    }

    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
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
      return NextResponse.json({ ok: true, alreadyPaid: true });
    }

    const slotConflict = await hasOverlappingPaidBooking(
      booking.listingId,
      booking.checkIn,
      booking.checkOut,
      bookingId
    );
    if (slotConflict) {
      return NextResponse.json(
        {
          ok: false,
          error:
            "해당 기간에 이미 결제가 완료된 예약이 있어 확정할 수 없습니다.",
        },
        { status: 409 }
      );
    }

    const mockPaymentId = `mock_${bookingId}_${Date.now()}`;
    const amountKrw =
      STORED_CURRENCY === "JPY"
        ? convertJpyToKrw(booking.totalPrice, await getJpyToKrwRate())
        : booking.totalPrice;

    const now = new Date();
    await prisma.$transaction([
      prisma.paymentTransaction.create({
        data: {
          bookingId,
          paymentId: mockPaymentId,
          transactionId: null,
          amount: amountKrw,
          status: "paid",
          method: "MOCK",
          pgProvider: null,
          rawResponse: JSON.stringify({ mock: true }),
          verifiedAt: now,
        },
      }),
      prisma.booking.update({
        where: { id: bookingId },
        data: { paymentStatus: "paid", status: "confirmed" },
      }),
    ]);

    let conversationId: string | null = null;
    try {
      conversationId = await onPaymentVerified(bookingId);
    } catch (postErr) {
      console.error("[MockVerify] post-complete error:", postErr);
    }

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
      mock: true,
    });
  } catch (err) {
    console.error("[POST /api/payments/mock-verify] Error:", err);
    return NextResponse.json(
      { ok: false, error: "모의 결제 처리 중 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}
