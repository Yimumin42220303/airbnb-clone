import { NextResponse } from "next/server";
import { requireCronAuth } from "@/lib/cron-auth";
import { processUnpaidBookings } from "@/lib/cancel-expired-bookings";

/**
 * GET|POST /api/cron/cancel-unpaid
 *
 * Vercel Cron은 GET으로 호출합니다. POST는 수동·Deploy Hook용.
 * Vercel Cron: 현재 Hobby 플랜 제한으로 일 1회 실행 (안전망).
 * 실시간 처리는 send-scheduled-messages 10분 크론과
 * cancelExpiredBookings()의 온디맨드 호출이 함께 보완합니다.
 *
 * - confirmedAt + 6h 경과: 1차 결제 리마인더
 * - 만료 3h 전: 2차(최종) 결제 리마인더
 * - 기한(24h, 컷오버 이전 확정 예약은 48h) 경과: 자동 취소 + 이메일/알림/시스템 메시지
 */
export async function POST(request: Request) {
  const authError = requireCronAuth(request);
  if (authError) return authError;

  const { stage1, stage2, cancelled } = await processUnpaidBookings();

  return NextResponse.json({
    ok: true,
    reminders: stage1,
    finalReminders: stage2,
    cancelled,
  });
}

export { POST as GET };
