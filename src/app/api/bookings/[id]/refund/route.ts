import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { cancelPayment } from "@/lib/portone";

/**
 * POST /api/bookings/[id]/refund
 *
 * Cancel booking + Portone refund processing.
 * Refund rate calculated based on cancellation policy:
 * - 30+ days before check-in: 100% refund
 * - 8-29 days before: 50% refund
 * - 1-7 days before: 30% refund
 * - Check-in day: No refund
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

  const daysUntilCheckIn = Math.floor(
    (booking.checkIn.getTime() - today.getTime()) / (24 * 60 * 60 * 1000)
  );

  let refundRate = 0;
  let refundPolicy = "";
  if (daysUntilCheckIn >= 30) {
    refundRate = 1.0;
    refundPolicy = "30+ days before check-in: 100% refund";
  } else if (daysUntilCheckIn >= 8) {
    refundRate = 0.5;
    refundPolicy = "8-29 days before check-in: 50% refund";
  } else if (daysUntilCheckIn >= 1) {
    refundRate = 0.3;
    refundPolicy = "1-7 days before check-in: 30% refund";
  } else {
    refundRate = 0;
    refundPolicy = "Check-in day: No refund";
  }

  const refundAmount = Math.floor(booking.totalPrice * refundRate);

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