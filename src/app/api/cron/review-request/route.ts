import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendEmailAsync, BASE_URL } from "@/lib/email";
import { reviewRequestGuest } from "@/lib/email-templates";
import { createNotification } from "@/lib/notifications";
import { requireCronAuth } from "@/lib/cron-auth";

/**
 * POST /api/cron/review-request
 *
 * Vercel Cron: 매일 6시 UTC (= 15시 KST) 실행 — 체크아웃(10시) 이후 여유를 두고 발송
 *
 * 오늘 체크아웃한 확정 예약 게스트 중:
 *  1) 아직 리뷰를 작성하지 않은 사람
 *  2) 아직 리뷰 요청 이메일을 받지 않은 사람 (reviewRequestSentAt === null)
 * 에게 리뷰 요청 이메일 + 인앱 알림 발송.
 */
export async function POST(request: Request) {
  const authError = requireCronAuth(request);
  if (authError) return authError;

  const now = new Date();
  // 오늘 UTC 00:00 ~ 내일 UTC 00:00 범위로 오늘 체크아웃 예약 조회
  const startOfToday = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
  const startOfTomorrow = new Date(startOfToday);
  startOfTomorrow.setUTCDate(startOfTomorrow.getUTCDate() + 1);

  const bookings = await prisma.booking.findMany({
    where: {
      status: "confirmed",
      paymentStatus: "paid",
      checkOut: { gte: startOfToday, lt: startOfTomorrow },
      reviewRequestSentAt: null, // 아직 발송하지 않은 건만
    },
    include: {
      listing: { select: { id: true, title: true } },
      user: { select: { id: true, name: true, email: true } },
    },
  });

  let sent = 0;
  let skipped = 0;

  for (const booking of bookings) {
    if (!booking.user?.email) {
      skipped++;
      continue;
    }

    // 이미 리뷰를 작성한 경우 발송 생략
    const existing = await prisma.review.findFirst({
      where: {
        listingId: booking.listing.id,
        userId: booking.user.id,
      },
      select: { id: true },
    });
    if (existing) {
      skipped++;
      continue;
    }

    const info = {
      guestName: booking.user.name || "게스트",
      listingTitle: booking.listing.title,
      baseUrl: BASE_URL,
      listingId: booking.listing.id,
    };

    sendEmailAsync({
      to: booking.user.email,
      ...reviewRequestGuest(info),
    });

    createNotification({
      userId: booking.user.id,
      type: "review_requ