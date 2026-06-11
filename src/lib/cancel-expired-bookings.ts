import { prisma } from "./prisma";
import {
  UNPAID_DEADLINE_MS,
  UNPAID_REMINDER_STAGE1_AFTER_MS,
  UNPAID_REMINDER_STAGE2_REMAINING_MS,
  FINAL_REMINDER_NOTIFICATION_TYPE,
  getUnpaidDeadlineAt,
} from "./unpaid-deadline";
import {
  notifyUnpaidAutoCancel,
  notifyPaymentReminder,
} from "./unpaid-auto-cancel-notifier";

const unpaidNotDeferred = { paymentMethod: { not: "deferred" as const } };

/**
 * 만료된 미결제 예약을 즉시 취소 (온디맨드 호출용).
 * Vercel Hobby 플랜은 일간 크론만 허용하므로,
 * 예약 목록·결제 페이지 조회 시 이 함수를 호출하여 기한 초과 예약을 취소한다.
 * 기한은 예약별로 다를 수 있어(컷오버 이전 확정 48h / 이후 24h) DB 조회 후 개별 판정한다.
 *
 * @param bookingId  특정 예약만 확인 (선택)
 * @param userId     특정 사용자의 예약만 확인 (선택)
 */
export async function cancelExpiredBookings(opts?: {
  bookingId?: string;
  userId?: string;
}): Promise<number> {
  const now = new Date();
  // 가장 짧은 기한(24h) 기준 후보 조회 후, 예약별 실제 기한으로 재판정
  const candidateCutoff = new Date(now.getTime() - UNPAID_DEADLINE_MS);

  const where: Record<string, unknown> = {
    status: "confirmed",
    paymentStatus: "pending",
    confirmedAt: { not: null, lte: candidateCutoff },
    ...unpaidNotDeferred,
  };
  if (opts?.bookingId) where.id = opts.bookingId;
  if (opts?.userId) where.userId = opts.userId;

  const bookings = await prisma.booking.findMany({
    where: where as never,
    select: { id: true, confirmedAt: true },
  });

  let cancelledCount = 0;

  for (const b of bookings) {
    if (!b.confirmedAt) continue;
    // 컷오버 이전 확정 예약(48h 기한)은 아직 만료 전일 수 있음
    if (now.getTime() < getUnpaidDeadlineAt(b.confirmedAt).getTime()) continue;

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

/**
 * 미결제 예약 리마인더 발송 (10분 크론 + 일간 크론에서 호출).
 *
 * - 1차: confirmedAt + 6h 경과 시 (paymentReminderSent 플래그로 1회 보장 — 원자적 클레임)
 * - 2차(최종): 만료 3h 전 (payment_reminder_final Notification 존재 여부로 중복 방지)
 *
 * 읽기 + 조건부 updateMany 만 수행하며 예약·결제 데이터를 삭제하지 않는다.
 */
export async function processUnpaidPaymentReminders(): Promise<{
  stage1: number;
  stage2: number;
}> {
  const now = new Date();
  const stage1Cutoff = new Date(now.getTime() - UNPAID_REMINDER_STAGE1_AFTER_MS);

  const candidates = await prisma.booking.findMany({
    where: {
      status: "confirmed",
      paymentStatus: "pending",
      confirmedAt: { not: null, lte: stage1Cutoff },
      ...unpaidNotDeferred,
    },
    select: {
      id: true,
      userId: true,
      confirmedAt: true,
      paymentReminderSent: true,
    },
  });

  let stage1 = 0;
  let stage2 = 0;

  for (const b of candidates) {
    if (!b.confirmedAt) continue;
    const deadline = getUnpaidDeadlineAt(b.confirmedAt).getTime();
    if (now.getTime() >= deadline) continue; // 만료 — 취소 경로에서 처리

    const isFinalWindow =
      now.getTime() >= deadline - UNPAID_REMINDER_STAGE2_REMAINING_MS;

    if (isFinalWindow) {
      // 2차(최종) 리마인더 — Notification 레코드로 중복 방지
      const already = await prisma.notification.findFirst({
        where: {
          userId: b.userId,
          type: FINAL_REMINDER_NOTIFICATION_TYPE,
          bookingId: b.id,
        },
        select: { id: true },
      });
      if (already) continue;

      // 1차를 건너뛴 경우에도 플래그를 올려 이후 1차 중복 발송 방지
      await prisma.booking.updateMany({
        where: { id: b.id, status: "confirmed", paymentStatus: "pending" },
        data: { paymentReminderSent: true },
      });

      await notifyPaymentReminder(b.id, { final: true }).catch((err) => {
        console.error("[UnpaidReminders] final notify:", err);
      });
      stage2++;
    } else if (!b.paymentReminderSent) {
      // 1차 리마인더 — 원자적 클레임으로 1회 보장
      const { count } = await prisma.booking.updateMany({
        where: {
          id: b.id,
          status: "confirmed",
          paymentStatus: "pending",
          paymentReminderSent: false,
          ...unpaidNotDeferred,
        },
        data: { paymentReminderSent: true },
      });
      if (count !== 1) continue;

      await notifyPaymentReminder(b.id, { final: false }).catch((err) => {
        console.error("[UnpaidReminders] notify:", err);
      });
      stage1++;
    }
  }

  return { stage1, stage2 };
}

/** 리마인더 발송 + 만료 취소를 한 번에 처리 (크론 공용 진입점) */
export async function processUnpaidBookings(): Promise<{
  stage1: number;
  stage2: number;
  cancelled: number;
}> {
  const { stage1, stage2 } = await processUnpaidPaymentReminders();
  const cancelled = await cancelExpiredBookings();
  return { stage1, stage2, cancelled };
}
