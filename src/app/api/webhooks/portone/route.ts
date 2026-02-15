import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getPayment } from "@/lib/portone";

/**
 * POST /api/webhooks/portone
 *
 * Portone Webhook endpoint.
 * Set this URL in Portone console as the webhook URL.
 */
export async function POST(request: Request) {
  let body: { type?: string; data?: { paymentId?: string } };
  try {
    body = await request.json();
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
    if (portonePayment.totalAmount !== booking.totalPrice) {
      console.error(
        "Webhook: Amount mismatch paymentId=" + paymentId,
        "paid=" + portonePayment.totalAmount,
        "booking=" + booking.totalPrice
      );
      await prisma.paymentTransaction.update({
        where: { id: transaction.id },
        data: {
          status: "failed",
          failReason: "Webhook amount mismatch",
          rawResponse: JSON.stringify(portonePayment),
        },
      });
      return NextResponse.json({ ok: true, mismatch: true });
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
    return NextResponse.json({ ok: true, action: "paid" });
  }

  // Payment cancelled (CANCELLED)
  if (portonePayment.status === "CANCELLED") {
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
        data: { status: "cancelled" },
      }),
    ]);
    return NextResponse.json({ ok: true, action: "cancelled" });
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