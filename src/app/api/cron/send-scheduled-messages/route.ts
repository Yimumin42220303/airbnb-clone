import { NextResponse } from "next/server";
import { processScheduledMessages } from "@/lib/scheduled-messages";
import { processUnpaidBookings } from "@/lib/cancel-expired-bookings";
import { requireCronAuth } from "@/lib/cron-auth";

/**
 * 10분 주기 크론 (Vercel Cron 중 유일한 고빈도 잡).
 * 1) 예약 메시지 발송
 * 2) 미결제 예약 리마인더·만료 취소 (일간 cancel-unpaid 크론의 실시간 보완)
 *    — 서로 영향을 주지 않도록 개별 try/catch 로 격리
 */
export async function POST(request: Request) {
  const authError = requireCronAuth(request);
  if (authError) return authError;

  const sent = await processScheduledMessages(50);

  let unpaid: { stage1: number; stage2: number; cancelled: number } | null =
    null;
  try {
    unpaid = await processUnpaidBookings();
  } catch (err) {
    console.error("[SendScheduledMessages] processUnpaidBookings:", err);
  }

  return NextResponse.json({ ok: true, sent, unpaid });
}

export { POST as GET };
