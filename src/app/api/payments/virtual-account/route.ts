import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getPayment } from "@/lib/portone";

/**
 * POST /api/payments/virtual-account
 *
 * Record virtual account issuance after PortOne SDK returns.
 * body: { paymentId, bookingId }
 */
export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  const userId = (session as { userId?: string } | null)?.userId;
  if (!userId) {
    return NextResponse.json({ error: "Login required" }, { status: 401 });
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

  const booking = await prisma.booking.findUnique({ where: { id: bookingId } });
  if (!booking) {
    return NextResponse.json({ error: "Booking not found" }, { status: 404 });
  }
  if (booking.userId !== userId) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  let portonePayment;
  try {
    portonePayment = await getPayment(paymentId);
  } catch (err) {
    console.error("VA payment lookup error:", err);
    return NextResponse.json({ error: "Failed to lookup payment" }, { status: 502 });
  }

  const status = portonePayment.status;
  const isValid = status === "VIRTUAL_ACCOUNT_ISSUED" || status === "PAID";
  if (!isValid) {
    return NextResponse.json(
      { error: "VA not issued. Status: " + status },
      { status: 400 }
    );
  }

  const existing = await prisma.paymentTransaction.findUnique({ where: { paymentId } });
  if (!existing) {
    await prisma.paymentTransaction.create({
      data: {
        bookingId,
        paymentId,
        transactionId: portonePayment.transactionId || null,
        amount: portonePayment.totalAmount || booking.totalPrice,
        status: status === "PAID" ? "paid" : "pending",
        method: "VIRTUAL_ACCOUNT",
        pgProvider: portonePayment.channel?.pgProvider || null,
        rawResponse: JSON.stringify(portonePayment),
      },
    });
  }

  if (status === "PAID") {
    await prisma.booking.update({
      where: { id: bookingId },
      data: { paymentStatus: "paid", status: "confirmed" },
    });
  }

  return NextResponse.json({ ok: true, status });
}