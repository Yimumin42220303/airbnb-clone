import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { onPaymentVerified } from "@/lib/payment-complete";
import { sendChannelTalkNotification } from "@/lib/channel-api";
import { triggerMetaPurchaseConversionAsync } from "@/lib/meta-purchase";
import { getJpyToKrwRate } from "@/lib/exchange-rate";
import { STORED_CURRENCY, convertJpyToKrw } from "@/lib/currency";
import { hasOverlappingPaidBooking } from "@/lib/availability";

/**
 * POST /api/payments/mock-verify
 *
 * Dev/preview only: complete payment without real PG call.
 * Only active when ENABLE_MOCK_PAYMENT=1. Do not set in production.
 * body: { bookingId }
 */
export async function POST(request: Request) {
  if (process.env.ENABLE_MOCK_PAYMENT !== "1") {
    return NextResponse.json(
      { ok: false, error: "mock payment not allowed in this environment" },
      { status: 403 }
    );
  }

  try {
    const session = await getServerSession(authOptions);
    const userId = (session as { userId?: string } | null)?.userId;
    if (!userId) {
      return NextResponse.json(
        { ok: false, error: "login required" },
        { status: 401 }
      );
    }

    let body: { bookingId?: string };
    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { ok: false, error: "invalid request" },
        { status: 400 }
      );
    }

    const { bookingId } = body;
    if (!bookingId) {
      return NextResponse.json(
        { ok: false, error: "bookingId required" },
        { status: 400 }
      );
    }

    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
      include: { user: { select: { email: true, phone: true } } },
    });
    if (!booking) {
      return NextResponse.json(
        { ok: false, error: "booking not found" },
        { status: 404 }
      );
    }
    if (booking.userId !== userId) {
      return NextResponse.json(
        { ok: false, error: "forbidden" },
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
          error: "a confirmed booking already exists for this period",
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
        "booking confirmed - check the message window for details"
      );
    } catch {
      // channel-api handles logging internally
    }

    // CAPI Purchase: only fire when META_CAPI_TEST_EVENT_CODE is set (isolated via Meta test tool)
    // When not set: skip firing to avoid contaminating real GA4/Meta conversion data
    const testEventCode = process.env.META_CAPI_TEST_EVENT_CODE?.trim();
    let metaPurchaseEventId: string | undefined;
    let purchaseValue: number | undefined;
    let capiStatus: string | undefined;

    if (testEventCode) {
      const metaPurchase = await triggerMetaPurchaseConversionAsync({
        bookingId,
        listingId: booking.listingId,
        value: booking.totalPrice,
        request,
        userEmail: booking.user?.email ?? null,
        userPhone: booking.guestPhone ?? booking.user?.phone ?? null,
      });
      metaPurchaseEventId = metaPurchase.eventId;
      purchaseValue = metaPurchase.value;
      capiStatus = metaPurchase.capiStatus;
    } else {
      // No META_CAPI_TEST_EVENT_CODE → skip purchase event
      // → no metaPurchaseEventId in response → no sessionStorage stash → no GA4/Pixel purchase fired
      capiStatus = "skipped_mock";
    }

    return NextResponse.json({
      ok: true,
      paymentStatus: "paid",
      bookingStatus: "confirmed",
      conversationId,
      verifiedAt: now.toISOString(),
      listingId: booking.listingId,
      mock: true,
      ...(metaPurchaseEventId ? { metaPurchaseEventId, purchaseValue } : {}),
      capiStatus,
    });
  } catch (err) {
    console.error("[POST /api/payments/mock-verify] Error:", err);
    return NextResponse.json(
      { ok: false, error: "error processing mock payment" },
      { status: 500 }
    );
  }
}
