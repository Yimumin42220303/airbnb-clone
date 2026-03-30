import { prisma } from "./prisma";

const INSTANT_DEADLINE_MS = 60 * 60 * 1000;
const APPROVAL_DEADLINE_MS = 24 * 60 * 60 * 1000;

/**
 * 만료된 미결제 예약을 즉시 취소 (온디맨드 호출용).
 * Vercel Hobby 플랜은 일간 크론만 허용하므로,
 * 예약 목록·결제 페이지 조회 시 이 함수를 호출하여
 * 1시간(즉시예약)/24시간(승인제) 기한 초과 예약을 취소한다.
 *
 * @param bookingId  특정 예약만 확인 (선택)
 * @param userId     특정 사용자의 예약만 확인 (선택)
 */
export async function cancelExpiredBookings(opts?: {
  bookingId?: string;
  userId?: string;
}): Promise<number> {
  const now = new Date();

  const where: Record<string, unknown> = {
    status: "confirmed",
    paymentStatus: "pending",
    confirmedAt: { not: null },
  };
  if (opts?.bookingId) where.id = opts.bookingId;
  if (opts?.userId) where.userId = opts.userId;

  const bookings = await prisma.booking.findMany({
    where: where as never,
    include: {
      listing: { select: { instantBooking: true } },
    },
  });

  let cancelledCount = 0;

  for (const b of bookings) {
    if (!b.confirmedAt) continue;
    const deadlineMs = b.listing.instantBooking ? INSTANT_DEADLINE_MS : APPROVAL_DEADLINE_MS;
    const deadline = new Date(b.confirmedAt.getTime() + deadlineMs);

    if (now > deadline) {
      await prisma.booking.update({
        where: { id: b.id },
        data: { status: "cancelled" },
      });
      cancelledCount++;
    }
  }

  return cancelledCount;
}
