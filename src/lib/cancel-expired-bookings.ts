import { prisma } from "./prisma";
import {
  UNPAID_DEADLINE_MS,
  UNPAID_REMINDER_REMAINING_MS,
} from "./unpaid-deadline";
import { notifyUnpaidAutoCancel } from "./unpaid-auto-cancel-notifier";

const unpaidNotDeferred = { paymentMethod: { not: "deferred" as const } };

/**
 * 만료된 미결제 예약을 즉시 취소 (온디맨드 호출용).
 * Vercel Hobby 플랜은 일간 크론만 허용하므로,
 * 예약 목록·결제 페이지 조회 시 이 함수를 호출하여
 * 48시간(2일) 기한 초과 예약을 취소한다.
 *
 * @param bookingId  특정 예약만 확인 (선택)
 * @param userId     특정 사용자의 예약만 확인 (선택)
 */
export async function cancelExpiredBookings(opts?: {
  bookingId?: string;
  userId?: string;
}): Promise<number> {
  const now = new Date();
  const cancelCutoff = new Date(now.getTime() - UNPAID_DEADLINE_MS);

  const where: Record<string, unknown> = {
    status: "confirmed",
    paymentStatus: "pending",
    confirmedAt: { not: null, lte: cancelCutoff },
    ...unpaidNotDeferred,
  };
  if (opts?.bookingId) where.id = opts.bookingId;
  if (opts?.userId) where.userId = opts.userId;

  const bookings = await prisma.booking.findMany({
    where: where as never,
    select: { id: true },
  });

  let cancelledCount = 0;

  for (const b of bookings) {
    const { count } = await prisma.booking.updateMany({
      where: {
        id: b.id,
        status: "confirmed",
        paymentStatus: "pending",
        ...unpaidNotDeferred,
      },
      data: { status: "cancelled" },
    });

    if (count === 1) {
      cancelledCount++;
      await notifyUnpaidAutoCancel({ bookingId: b.id }).catch((err) => {
        console.error("[cancelExpiredBookings] notify:", err);
      });
    }
  }

  return cancelledCount;
}

/** 리마인더 구간: confirmedAt + 24h ≤ now < confirmedAt + 48h */
export function getUnpaidReminderWindow(now = new Date()) {
  const cancelCutoff = new Date(now.getTime() - UNPAID_DEADLINE_MS);
  const reminderEligibleCutoff = new Date(
    now.getTime() - (UNPAID_DEADLINE_MS - UNPAID_REMINDER_REMAINING_MS)
  );
  return { cancelCutoff, reminderEligibleCutoff };
}
