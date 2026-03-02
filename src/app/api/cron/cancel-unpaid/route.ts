import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendEmailAsync, BASE_URL } from "@/lib/email";
import { getOfficialUserId } from "@/lib/official-account";
import { createNotification } from "@/lib/notifications";
import {
  unpaidAutoCancelGuest,
  unpaidAutoCancelHost,
  paymentReminderGuest,
} from "@/lib/email-templates";

const PAYMENT_DEADLINE_HOURS = 24;
const REMINDER_AFTER_HOURS = 20;

/**
 * POST /api/cron/cancel-unpaid
 *
 * Vercel Cron: 매시 실행 (0 * * * *)
 *
 * 1) 리마인더: 호스트 승인 후 20시간 경과 & 미결제 → 게스트에게 "4시간 남았습니다" 알림·이메일
 * 2) 자동 취소: 호스트 승인 후 24시간 경과 & 미결제 → 예약 취소 + 양쪽 알림·이메일
 */
export async function POST(request: Request) {
  const authHeader = request.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;
  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const now = new Date();
  const cancelCutoff = new Date(now.getTime() - PAYMENT_DEADLINE_HOURS * 60 * 60 * 1000);
  const reminderCutoff = new Date(now.getTime() - REMINDER_AFTER_HOURS * 60 * 60 * 1000);

  // ───── 1. 리마인더 대상 (20h 경과 ~ 24h 미만, 미발송) ─────
  const reminderBookings = await prisma.booking.findMany({
    where: {
      status: "confirmed",
      paymentStatus: "pending",
      confirmedAt: { not: null, lte: reminderCutoff, gt: cancelCutoff },
      paymentReminderSent: false,
      listing: { instantBooking: false },
    },
    include: {
      listing: { select: { title: true, location: true } },
      user: { select: { name: true, email: true } },
    },
  });

  let reminderCount = 0;
  for (const booking of reminderBookings) {
    const deadline = new Date(booking.confirmedAt!.getTime() + PAYMENT_DEADLINE_HOURS * 60 * 60 * 1000);
    const deadlineText = deadline.toLocaleString("ko-KR", {
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });

    const nights = Math.floor(
      (booking.checkOut.getTime() - booking.checkIn.getTime()) / (24 * 60 * 60 * 1000)
    );
    const emailInfo = {
      listingTitle: booking.listing.title,
      listingLocation: booking.listing.location || "",
      checkIn: booking.checkIn.toISOString().slice(0, 10),
      checkOut: booking.checkOut.toISOString().slice(0, 10),
      guests: booking.guests,
      nights,
      totalPrice: booking.totalPrice,
      guestName: booking.user?.name || "Guest",
      guestEmail: booking.user?.email || "",
      bookingId: booking.id,
      baseUrl: BASE_URL,
    };

    if (booking.user?.email) {
      const mail = paymentReminderGuest({ ...emailInfo, deadlineText });
      sendEmailAsync({ to: booking.user.email, ...mail });
    }

    createNotification({
      userId: booking.userId,
      type: "payment_reminder",
      title: `결제 기한이 약 4시간 남았습니다. 기한 내 결제하지 않으면 예약이 자동 취소됩니다.`,
      linkPath: `/booking/${booking.id}/pay`,
      linkLabel: "결제하기",
      bookingId: booking.id,
    }).catch(() => {});

    await prisma.booking.update({
      where: { id: booking.id },
      data: { paymentReminderSent: true },
    });

    reminderCount++;
  }

  // ───── 2. 자동 취소 대상 (24h 경과 & 미결제) ─────
  const cancelBookings = await prisma.booking.findMany({
    where: {
      status: "confirmed",
      paymentStatus: "pending",
      confirmedAt: { not: null, lte: cancelCutoff },
      listing: { instantBooking: false },
    },
    include: {
      listing: {
        select: {
          title: true,
          location: true,
          userId: true,
          user: { select: { name: true, email: true } },
        },
      },
      user: { select: { name: true, email: true } },
    },
  });

  let cancelCount = 0;
  const officialUserId = await getOfficialUserId();

  for (const booking of cancelBookings) {
    await prisma.booking.update({
      where: { id: booking.id },
      data: { status: "cancelled" },
    });

    const nights = Math.floor(
      (booking.checkOut.getTime() - booking.checkIn.getTime()) / (24 * 60 * 60 * 1000)
    );
    const emailInfo = {
      listingTitle: booking.listing.title,
      listingLocation: booking.listing.location || "",
      checkIn: booking.checkIn.toISOString().slice(0, 10),
      checkOut: booking.checkOut.toISOString().slice(0, 10),
      guests: booking.guests,
      nights,
      totalPrice: booking.totalPrice,
      guestName: booking.user?.name || "Guest",
      guestEmail: booking.user?.email || "",
      bookingId: booking.id,
      baseUrl: BASE_URL,
    };

    // 게스트 이메일 + 알림
    if (booking.user?.email) {
      const guestMail = unpaidAutoCancelGuest(emailInfo);
      sendEmailAsync({ to: booking.user.email, ...guestMail });
    }
    createNotification({
      userId: booking.userId,
      type: "unpaid_auto_cancel",
      title: "결제 기한(24시간)이 만료되어 예약이 자동 취소되었습니다.",
      linkPath: "/my-bookings",
      bookingId: booking.id,
    }).catch(() => {});

    // 호스트 이메일 + 알림
    const hostEmail = booking.listing.user?.email;
    const isSameEmail = hostEmail && booking.user?.email && hostEmail === booking.user.email;
    if (hostEmail && !isSameEmail) {
      const hostMail = unpaidAutoCancelHost({
        ...emailInfo,
        hostName: booking.listing.user?.name || "Host",
      });
      sendEmailAsync({ to: hostEmail, ...hostMail });
    }
    createNotification({
      userId: booking.listing.userId,
      type: "unpaid_auto_cancel",
      title: "ゲストが24時間以内に決済を完了しなかったため、予約が自動キャンセルされました。",
      linkPath: "/host/bookings",
      bookingId: booking.id,
    }).catch(() => {});

    // 대화방에 자동 취소 안내 메시지
    if (officialUserId) {
      try {
        const conversation = await prisma.conversation.findUnique({
          where: { bookingId: booking.id },
        });
        if (conversation) {
          await prisma.message.create({
            data: {
              conversationId: conversation.id,
              senderId: officialUserId,
              body: "결제 기한(24시간)이 만료되어 예약이 자동 취소되었습니다.",
            },
          });
        }
      } catch (err) {
        console.error("[CancelUnpaid] message:", err);
      }
    }

    cancelCount++;
  }

  return NextResponse.json({
    ok: true,
    reminders: reminderCount,
    cancelled: cancelCount,
  });
}
