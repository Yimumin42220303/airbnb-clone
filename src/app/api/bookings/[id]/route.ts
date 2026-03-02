import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

/**
 * GET /api/bookings/[id]
 * 본인 예약 상세 조회 (Listing, PaymentTransaction, Conversation 포함)
 */
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  const userId = (session as { userId?: string } | null)?.userId;
  if (!userId) {
    return NextResponse.json(
      { error: "로그인 후 이용할 수 있습니다." },
      { status: 401 }
    );
  }

  const { id } = await params;

  const booking = await prisma.booking.findUnique({
    where: { id },
    include: {
      listing: {
        select: {
          id: true,
          title: true,
          location: true,
          imageUrl: true,
          pricePerNight: true,
          cleaningFee: true,
          cancellationPolicy: true,
          instantBooking: true,
          user: { select: { name: true } },
        },
      },
      transactions: {
        where: { status: "paid" },
        orderBy: { createdAt: "desc" },
        take: 1,
        select: {
          paymentId: true,
          amount: true,
          method: true,
          verifiedAt: true,
        },
      },
      conversation: { select: { id: true } },
    },
  });

  if (!booking) {
    return NextResponse.json(
      { error: "예약을 찾을 수 없습니다." },
      { status: 404 }
    );
  }
  if (booking.userId !== userId) {
    return NextResponse.json(
      { error: "권한이 없습니다." },
      { status: 403 }
    );
  }

  const nights = Math.max(
    1,
    Math.round(
      (new Date(booking.checkOut).getTime() -
        new Date(booking.checkIn).getTime()) /
        (24 * 60 * 60 * 1000)
    )
  );

  const paidTx = booking.transactions[0] ?? null;

  return NextResponse.json({
    id: booking.id,
    checkIn: booking.checkIn,
    checkOut: booking.checkOut,
    guests: booking.guests,
    totalPrice: booking.totalPrice,
    status: booking.status,
    paymentStatus: booking.paymentStatus,
    createdAt: booking.createdAt,
    nights,
    listing: {
      ...booking.listing,
      hostName: booking.listing.user?.name ?? null,
    },
    payment: paidTx
      ? {
          paymentId: paidTx.paymentId,
          amount: paidTx.amount,
          method: paidTx.method,
          verifiedAt: paidTx.verifiedAt,
        }
      : null,
    conversationId: booking.conversation?.id ?? null,
  });
}

/**
 * PATCH /api/bookings/[id]
 * 예약 상태 변경 (본인 예약만)
 *
 * ⚠️ 보안: paymentStatus 변경은 이 API에서 직접 허용하지 않습니다.
 * 결제 완료 처리는 반드시 POST /api/payments/verify 를 통해
 * 서버 측에서 포트원 API로 검증한 후에만 수행됩니다.
 */
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  const userId = (session as { userId?: string } | null)?.userId;
  if (!userId) {
    return NextResponse.json(
      { error: "로그인 후 이용할 수 있습니다." },
      { status: 401 }
    );
  }

  const { id } = await params;
  const body = await request.json();
  const status = body.status;

  // ⚠️ paymentStatus를 클라이언트에서 직접 변경하는 것을 차단
  if (body.paymentStatus) {
    return NextResponse.json(
      { error: "결제 상태는 결제 검증 API(/api/payments/verify)를 통해서만 변경할 수 있습니다." },
      { status: 403 }
    );
  }

  const booking = await prisma.booking.findUnique({
    where: { id },
  });
  if (!booking) {
    return NextResponse.json(
      { error: "예약을 찾을 수 없습니다." },
      { status: 404 }
    );
  }
  if (booking.userId !== userId) {
    return NextResponse.json(
      { error: "권한이 없습니다." },
      { status: 403 }
    );
  }

  if (status === "cancelled") {
    if (booking.status === "cancelled") {
      return NextResponse.json(
        { error: "이미 취소된 예약입니다." },
        { status: 400 }
      );
    }
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (booking.checkIn < today) {
      return NextResponse.json(
        { error: "이미 지난 예약은 취소할 수 없습니다." },
        { status: 400 }
      );
    }
    await prisma.booking.update({
      where: { id },
      data: { status: "cancelled" },
    });
    return NextResponse.json({ ok: true, status: "cancelled" });
  }

  return NextResponse.json({ error: "지원하지 않는 요청입니다." }, { status: 400 });
}
