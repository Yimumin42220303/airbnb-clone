import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getPayment, verifyWebhookPayload } from "@/lib/portone";
import { syncBookingToBeds24 } from "@/lib/bookings";
import { createScheduledMessagesForBooking } from "@/lib/scheduled-messages";
import { onPaymentVerified } from "@/lib/payment-complete";
import { triggerMetaPurchaseConversion } from "@/lib/meta-purchase";
import { getJpyToKrwRate } from "@/lib/exchange-rate";
import { STORED_CURRENCY, convertJpyToKrw } from "@/lib/currency";
import { hasOverlappingPaidBooking } from "@/lib/availability";

/**
 * POST /api/webhooks/portone
 *
 * Portone Webhook endpoint.
 * Set this URL in Portone console as the webhook URL.
 * 주의: PortOne 결제 금액은 KRW, Booking.totalPrice는 저장 통화(JPY)이므로
 * PAID 금액 검증 시 동일 통화로 변환 후 비교해야 함.
 */
export async function POST(request: Request) {
  const rawBody = await request.text();
  if (!rawBody) {
    return NextResponse.json({ error: "Empty body" }, { status: 400 });
  }

  if (process.env.PORTONE_WEBHOOK_SECRET?.trim()) {
    try {
      await verifyWebhookPayload(
        rawBody,
        Object.fromEntries(request.headers.entries())
      );
    } catch (err) {
      console.error("Webhook: signature verification failed:", err);
      return NextResponse.json(
        { error: "Invalid webhook signature" },
        { status: 401 }
      );
    }
  }

  let body: { type?: string; data?: { paymentId?: string } };
  try {
    body = JSON.parse(rawBody) as { type?: string; data?: { paymentId?: string } };
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const paymentId = body?.data?.paymentId;
  if (!paymentId) {
    return NextResponse.json({ error: "Missing paymentId" }, { status: 400 });
  }

  let portonePayment;
  try {
    portonePayment = await getPayment(paymentId);
  } catch (err) {
    console.error("Webhook: Portone payment lookup failed:", err);
    return NextResponse.json(
      { error: "Payment lookup failed" },
      { status: 502 }
    );
  }

  const transaction = await prisma.paymentTransaction.findUnique({
    where: { paymentId },
    include: { booking: true },
  });

  if (!transaction) {
    console.warn(
      "Webhook: No transaction found for paymentId=" + paymentId +
      " status=" + portonePayment.status
    );
    return NextResponse.json({ ok: true, skipped: true });
  }

  const booking = transaction.booking;

  // Payment completed (PAID)
  if (portonePayment.status === "PAID" && booking.paymentStatus !== "paid") {
    // PortOne totalAmount = KRW, Booking.totalPrice = 저장 통화(JPY). 동일 단위로 비교
    const expectedKrw =
      STORED_CURRENCY === "JPY"
        ? convertJpyToKrw(booking.totalPrice, await getJpyToKrwRate())
        : booking.totalPrice;
    const paidKrw = portonePayment.totalAmount ?? 0;
    if (Math.abs(paidKrw - expectedKrw) > 1) {
      console.error(
        "Webhook: Amount mismatch paymentId=" + paymentId,
        "paidKrw=" + paidKrw,
        "expectedKrw=" + expectedKrw
      );
      await prisma.paymentTransaction.update({
        where: { id: transaction.id },
        data: {
          status: "failed",
          failReason: "Webhook amount mismatch (KRW)",
          rawResponse: JSON.stringify(portonePayment),
        },
      });
      return NextResponse.json({ ok: true, mismatch: true });
    }

    const slotConflict = await hasOverlappingPaidBooking(
      booking.listingId,
      booking.checkIn,
      booking.checkOut,
      booking.id
    );
    if (slotConflict) {
      console.error(
        "Webhook: slot conflict, skip paid update bookingId=" + booking.id
      );
      await prisma.paymentTransaction.update({
        where: { id: transaction.id },
        data: {
          status: "failed",
          failReason: "Slot overlap with another paid booking (webhook)",
          rawResponse: JSON.stringify(portonePayment),
        },
      });
      return NextResponse.json({ ok: true, skipped: true, reason: "slot_conflict" });
    }

    await prisma.$transaction([
      prisma.paymentTransaction.update({
        where: { id: transaction.id },
        data: {
          status: "paid",
          transactionId: portonePayment.transactionId || null,
          verifiedAt: new Date(),
          rawResponse: JSON.stringify(portonePayment),
        },
      }),
      prisma.booking.update({
        where: { id: booking.id },
        data: { paymentStatus: "paid", status: "confirmed" },
      }),
    ]);

    // 대화방·자동 메시지·이메일·알림·Beds24·스케줄 메시지 (verify와 동일 경로)
    onPaymentVerified(booking.id).catch((err) => {
      console.error("[Webhook] onPaymentVerified error:", err);
    });

    const bookingUser = await prisma.user.findUnique({
      where: { id: booking.userId },
      select: { email: true, phone: true },
    });
    triggerMetaPurchaseConversion({
      bookingId: booking.id,
      listingId: booking.listingId,
      value: booking.totalPrice,
      request,
      userEmail: bookingUser?.email ?? null,
      userPhone: booking.guestPhone ?? bookingUser?.phone ?? null,
    });

    return NextResponse.json({ ok: true, action: "paid" });
  }

  // Payment cancelled or partially cancelled (CANCELLED / PARTIAL_CANCELLED)
  if (portonePayment.status === "CANCELLED" || portonePayment.status === "PARTIAL_CANCELLED") {
    await prisma.$transaction([
      prisma.paymentTransaction.update({
        where: { id: transaction.id },
        data: {
          status: "cancelled",
          rawResponse: JSON.stringify(portonePayment),
        },
      }),
      prisma.booking.update({
        where: { id: booking.id },
        data: { status: "cancelled", paymentStatus: "refunded" },
      }),
    ]);
    return NextResponse.json({ ok: true, action: "cancelled" });
  }

  // Virtual account issued (입금 대기)
  if (portonePayment.status === "VIRTUAL_ACCOUNT_ISSUED") {
    if (transaction.status !== "paid") {
      await prisma.paymentTransaction.update({
        where: { id: transaction.id },
        data: {
          status: "pending",
          rawResponse: JSON.stringify(portonePayment),
        },
      });
    }
    return NextResponse.json({ ok: true, action: "va_issued" });
  }

  // Payment failed (FAILED)
  if (portonePayment.status === "FAILED") {
    await prisma.paymentTransaction.update({
      where: { id: transaction.id },
      data: {
        status: "failed",
        failReason: "PG payment failed",
        rawResponse: JSON.stringify(portonePayment),
      },
    });
    return NextResponse.json({ ok: true, action: "failed" });
  }

  return NextResponse.json({ ok: true, action: "no_action" });
}