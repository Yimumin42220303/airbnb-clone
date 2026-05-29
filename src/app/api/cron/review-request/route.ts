import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendEmailAsync, BASE_URL } from "@/lib/email";
import { reviewRequestGuest } from "@/lib/email-templates";
import { createNotification } from "@/lib/notifications";
import { requireCronAuth } from "@/lib/cron-auth";

/**
 * POST /api/cron/review-request
 *
 * Vercel Cron: 매일 1회 실행 권장 (예: 0 0 * * * = 0시 UTC = 9시 KST)
 *
 * 체크아웃 D+1: 어제 체크아웃한 확정 예약의 게스트 중, 해당 숙소에 아직 리뷰를 쓰지 않은 사람에게
 * 리뷰 요청 이메일 + 인앱 알림 발송.
 */
export async function POST(request: Request) {
  const authError = requireCronAuth(request);
  if (authError) return authError;

  const now = new Date();
  const startOfToday = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
  const startOfYesterday = new Date(startOfToday);
  startOfYesterday.setUTCDate(startOfYesterday.getUTCDate() - 1);

  const bookings = await prisma.booking.findMany({
    where: {
      status: "confirmed",
      paymentStatus: "paid",
      checkOut: { gte: startOfYesterday, lt: startOfToday },
    },
    include: {
      listing: { select: { id: true, title: true } },
      user: { select: { id: true, name: true, email: true } },
    },
  });

  let sent = 0;
  for (const booking of bookings) {
    if (!booking.user?.email) continue;

    const existing = await prisma.review.findFirst({
      where: {
        listingId: booking.listing.id,
        userId: booking.user.id,
      },
      select: { id: true },
    });
    if (existing) continue;

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
      type: "review_request",
      title: `${booking.listing.title} 숙박은 어떠셨나요? 리뷰를 남겨 주세요.`,
      linkPath: `/listing/${booking.listing.id}#review`,
      listingId: booking.listing.id,
    }).catch(() => {});

    sent++;
  }

  return NextResponse.json({
    ok: true,
    checkedOutYesterday: bookings.length,
    reviewRequestSent: sent,
  });
}

export { POST as GET };
