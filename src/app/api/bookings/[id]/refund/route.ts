import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { cancelPayment } from "@/lib/portone";
import {
  calculateRefundAmount,
  type CancellationPolicyType,
} from "@/lib/policies";

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
        select: { cancellationPolicy: true },
      },
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

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  if (booking.checkIn < today) {
    return NextResponse.json(
      { error: "Cannot cancel past bookings" },
      { status: 400 }
    );
  }

  // Calculate refund based on listing's cancellation policy
  const policy = (booking.listing.cancellationPolicy || "flexible") as CancellationPolicyType;
  const refundResult = calculateRefundAmount({
    policy,
    totalPrice: booking.totalPrice,
    checkInDate: booking.checkIn,
    cancellationDate: today,
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
    data: { status: "cancelled" },
  });

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