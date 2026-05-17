import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireCronAuth } from "@/lib/cron-auth";
import { getUnpaidReminderWindow } from "@/lib/cancel-expired-bookings";
import {
  notifyUnpaidAutoCancel,
  notifyPaymentReminder,
} from "@/lib/unpaid-auto-cancel-notifier";

const unpaidNotDeferred = { paymentMethod: { not: "deferred" as const } };

/**
 * POST /api/cron/cancel-unpaid
 *
 * Vercel Cron: 현재 Hobby 플랜 제한으로 일 1회 실행.
 * 실시간 만료 처리는 cancelExpiredBookings()의 온디맨드 호출이 함께 보완합니다.
 *
 * - confirmedAt + 24h 경과 ~ 48h 미만: 결제 리마인더 1회 (paymentReminderSent)
 * - confirmedAt + 48h 경과: 자동 취소 + 이메일/알림/시스템 메시지
 */
export async function POST(request: Request) {
  const authError = requireCronAuth(request);
  if (authError) return authError;

  const now = new Date();
  const { cancelCutoff, reminderEligibleCutoff } = getUnpaidReminderWindow(now);
  let reminderCount = 0;
  let cancelCount = 0;

  // 리마인더: 남은 결제 시간 ≤ 24h (confirmedAt + 24h ≤ now < confirmedAt + 48h)
  const reminderBookings = await prisma.booking.findMany({
    where: {
      status: "confirmed",
      paymentStatus: "pending",
      paymentReminderSent: false,
      confirmedAt: {
        not: null,
        lte: reminderEligibleCutoff,
        gt: cancelCutoff,
      },
      ...unpaidNotDeferred,
    },
    select: { id: true },
  });

  for (const { id } of reminderBookings) {
    const { count } = await prisma.booking.updateMany({
      where: {
        id,
        status: "confirmed",
        paymentStatus: "pending",
        paymentReminderSent: false,
        ...unpaidNotDeferred,
      },
      data: { paymentReminderSent: true },
    });

    if (count !== 1) continue;

    await notifyPaymentReminder(id).catch((err) => {
      console.error("[CancelUnpaid] reminder notify:", err);
    });
    reminderCount++;
  }

  // 자동 취소: confirmedAt + 48h 경과
  const cancelBookings = await prisma.booking.findMany({
    where: {
      status: "confirmed",
      paymentStatus: "pending",
      confirmedAt: { not: null, lte: cancelCutoff },
      ...unpaidNotDeferred,
    },
    select: { id: true },
  });

  for (const { id } of cancelBookings) {
    const { count } = await prisma.booking.updateMany({
      where: {
        id,
        status: "confirmed",
        paymentStatus: "pending",
        ...unpaidNotDeferred,
      },
      data: { status: "cancelled" },
    });

    if (count !== 1) continue;

    await notifyUnpaidAutoCancel({ bookingId: id }).catch((err) => {
      console.error("[CancelUnpaid] cancel notify:", err);
    });
    cancelCount++;
  }

  return NextResponse.json({
    ok: true,
    reminders: reminderCount,
    cancelled: cancelCount,
  });
}
