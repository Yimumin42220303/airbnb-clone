import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getPayment } from "@/lib/portone";

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

  // Verification success
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

  return NextResponse.json({
    ok: true,
    paymentStatus: "paid",
    bookingStatus: "confirmed",
    verifiedAt: now.toISOString(),
  });
}