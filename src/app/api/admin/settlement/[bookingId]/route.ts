import { NextRequest, NextResponse } from "next/server";
import { getAdminUser } from "@/lib/admin";
import { prisma } from "@/lib/prisma";

/**
 * PATCH /api/admin/settlement/[bookingId]
 * 해당 예약 정산 완료 처리 (Admin 전용)
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ bookingId: string }> }
) {
  const admin = await getAdminUser();
  if (!admin) {
    return NextResponse.json({ error: "관리자 권한이 필요합니다." }, { status: 403 });
  }

  const { bookingId } = await params;
  const body = await request.json().catch(() => ({}));
  const settlementNote = typeof body.settlementNote === "string" ? body.settlementNote.trim() : undefined;

  const booking = await prisma.booking.findUnique({
    where: { id: bookingId },
  });
  if (!booking) {
    return NextResponse.json({ error: "예약을 찾을 수 없습니다." }, { status: 404 });
  }
  if (booking.paymentStatus !== "paid" || booking.status !== "confirmed") {
    return NextResponse.json({ error: "결제 완료·확정된 예약만 정산할 수 있습니다." }, { status: 400 });
  }

  await prisma.booking.update({
    where: { id: bookingId },
    data: {
      settlementStatus: "completed",
      settlementAt: new Date(),
      ...(settlementNote ? { settlementNote } : {}),
    },
  });

  return NextResponse.json({ ok: true });
}
