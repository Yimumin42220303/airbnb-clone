import { NextRequest, NextResponse } from "next/server";
import { getAdminUser } from "@/lib/admin";
import { prisma } from "@/lib/prisma";

/**
 * POST /api/admin/settlement/batch
 * 선택 예약 일괄 정산 완료 (Admin 전용)
 * Body: { bookingIds: string[], settlementNote?: string }
 */
export async function POST(request: NextRequest) {
  const admin = await getAdminUser();
  if (!admin) {
    return NextResponse.json({ error: "관리자 권한이 필요합니다." }, { status: 403 });
  }

  const body = await request.json().catch(() => ({}));
  const bookingIds = Array.isArray(body.bookingIds)
    ? body.bookingIds.filter((id: unknown): id is string => typeof id === "string" && id.length > 0)
    : [];
  const settlementNote = typeof body.settlementNote === "string" ? body.settlementNote.trim() : undefined;

  if (bookingIds.length === 0) {
    return NextResponse.json({ error: "정산할 예약을 선택해 주세요." }, { status: 400 });
  }
  if (bookingIds.length > 100) {
    return NextResponse.json({ error: "한 번에 100건까지 처리할 수 있습니다." }, { status: 400 });
  }

  const validBookings = await prisma.booking.findMany({
    where: {
      id: { in: bookingIds },
      paymentStatus: "paid",
      status: "confirmed",
    },
    select: { id: true },
  });
  const validIds = validBookings.map((b) => b.id);

  await prisma.booking.updateMany({
    where: { id: { in: validIds } },
    data: {
      settlementStatus: "completed",
      settlementAt: new Date(),
      ...(settlementNote ? { settlementNote } : {}),
    },
  });

  return NextResponse.json({
    ok: true,
    count: validIds.length,
    message: `${validIds.length}건 정산 완료 처리했습니다.`,
  });
}
