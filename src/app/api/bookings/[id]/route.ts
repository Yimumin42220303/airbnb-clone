import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

/**
 * PATCH /api/bookings/[id]
 * 예약 결제 완료 등 (본인 예약만)
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
  const paymentStatus = body.paymentStatus;
  const status = body.status;

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

  if (paymentStatus === "paid") {
    await prisma.booking.update({
      where: { id },
      data: { paymentStatus: "paid" },
    });
    return NextResponse.json({ ok: true, paymentStatus: "paid" });
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
