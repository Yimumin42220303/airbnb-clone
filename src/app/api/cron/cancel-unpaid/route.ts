import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendEmailAsync, BASE_URL } from "@/lib/email";
import { getOfficialUserId } from "@/lib/official-account";
import { createNotification } from "@/lib/notifications";
import {
  unpaidAutoCancelGuest,
  unpaidAutoCancelHost,
  paymentReminderGuest,
  instantPaymentReminderGuest,
} from "@/lib/email-templates";

const APPROVAL_DEADLINE_HOURS = 24;
const APPROVAL_REMINDER_HOURS = 20;
const INSTANT_DEADLINE_MINUTES = 60;
const INSTANT_REMINDER_MINUTES = 45;

/**
 * POST /api/cron/cancel-unpaid
 *
 * Vercel Cron: 10분마다 실행
 *
 * A) 즉시 예약: confirmedAt 기준 45분 경과 리마인더, 60분 경과 자동 취소
 * B) 승인제 예약: confirmedAt 기준 20시간 경과 리마인더, 24시간 경과 자동 취소
 */
export async function POST(request: Request) {
  const authHeader = request.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;
  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const now = new Date();
  let reminderCount = 0;
  let cancelCount = 0;

  const officialUserId = await getOfficialUserId();

  // ===== A. 즉시 예약 (instantBooking = true) =====
  const instantCancelCutoff = new Date(now.getTime() - INSTANT_DEADLINE_MINUTES * 60 * 1000);
  const instantReminderCutoff = new Date(now.getTime() - INSTANT_REMINDER_MINUTES * 60 * 1000);

  // A-1. 즉시 예약 리마인더 (45분 ~ 60분)
  const instantReminderBookings = await prisma.booking.findMany({
    where: {
      status: "confirmed",
      paymentStatus: "pending",
      confirmedAt: { not: null, lte: instantReminderCutoff, gt: instantCancelCutoff },
      paymentReminderSent: false,
      listing: { instantBooking: true },
    },
    include: {
      listing: { select: { title: true, location: true } },
      user: { select: { name: true, email: true } },
    },
  });

  for (const booking of instantReminderBookings) {
    const deadline = new Date(booking.confirmedAt!.getTime() + INSTANT_DEADLINE_MINUTES * 60 * 1000);
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
      const mail = instantPaymentReminderGuest({ ...emailInfo, deadlineText });
      sendEmailAsync({ to: booking.user.email, ...mail });
    }

    createNotification({
      userId: booking.userId,
      type: "payment_reminder",
      title: "결제 기한이 약 15분 남았습니다. 기한 내 결제하지 않으면 예약이 자동 취소됩니다.",
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

  // A-2. 즉시 예약 자동 취소 (60분 경과)
  const instantCancelBookings = await prisma.booking.findMany({
    where: {
      status: "confirmed",
      paymentStatus: "pending",
      confirmedAt: { not: null, lte: instantCancelCutoff },
      listing: { instantBooking: true },
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

  for (const booking of instantCancelBookings) {
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

    if (booking.user?.email) {
      const guestMail = unpaidAutoCancelGuest({ ...emailInfo, deadlineLabel: "1시간" });
      sendEmailAsync({ to: booking.user.email, ...guestMail });
    }
    createNotification({
      userId: booking.userId,
      type: "unpaid_auto_cancel",
      title: "결제 기한(1시간)이 만료되어 예약이 자동 취소되었습니다.",
      linkPath: "/my-bookings",
      bookingId: booking.id,
    }).catch(() => {});

    const hostEmail = booking.listing.user?.email;
    const isSameEmail = hostEmail && booking.user?.email && hostEmail === booking.user.email;
    if (hostEmail && !isSameEmail) {
      const hostMail = unpaidAutoCancelHost({
        ...emailInfo,
        hostName: booking.listing.user?.name || "Host",
        deadlineLabel: "1시간",
      });
      sendEmailAsync({ to: hostEmail, ...hostMail });
    }
    createNotification({
      userId: booking.listing.userId,
      type: "unpaid_auto_cancel",
      title: "ゲストが1時間以内に決済を完了しなかったため、予約が自動キャンセルされました。",
      linkPath: "/host/bookings",
      bookingId: booking.id,
    }).catch(() => {});

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
              body: "결제 기한(1시간)이 만료되어 예약이 자동 취소되었습니다.",
            },
          });
        }
      } catch (err) {
        console.error("[CancelUnpaid] instant message:", err);
      }
    }

    cancelCount++;
  }

  // ===== B. 승인제 예약 (instantBooking = false) =====
  const approvalCancelCutoff = new Date(now.getTime() - APPROVAL_DEADLINE_HOURS * 60 * 60 * 1000);
  const approvalReminderCutoff = new Date(now.getTime() - APPROVAL_REMINDER_HOURS * 60 * 60 * 1000);

  // B-1. 승인제 리마인더 (20h ~ 24h)
  const approvalReminderBookings = await prisma.booking.findMany({
    where: {
      status: "confirmed",
      paymentStatus: "pending",
      confirmedAt: { not: null, lte: approvalReminderCutoff, gt: approvalCancelCutoff },
      paymentReminderSent: false,
      listing: { instantBooking: false },
    },
    include: {
      listing: { select: { title: true, location: true } },
      user: { select: { name: true, email: true } },
    },
  });

  for (const booking of approvalReminderBookings) {
    const deadline = new Date(booking.confirmedAt!.getTime() + APPROVAL_DEADLINE_HOURS * 60 * 60 * 1000);
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
      title: "결제 기한이 약 4시간 남았습니다. 기한 내 결제하지 않으면 예약이 자동 취소됩니다.",
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

  // B-2. 승인제 자동 취소 (24h 경과)
  const approvalCancelBookings = await prisma.booking.findMany({
    where: {
      status: "confirmed",
      paymentStatus: "pending",
      confirmedAt: { not: null, lte: approvalCancelCutoff },
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

  for (const booking of approvalCancelBookings) {
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

    if (booking.user?.email) {
      const guestMail = unpaidAutoCancelGuest({ ...emailInfo, deadlineLabel: "24시간" });
      sendEmailAsync({ to: booking.user.email, ...guestMail });
    }
    createNotification({
      userId: booking.userId,
      type: "unpaid_auto_cancel",
      title: "결제 기한(24시간)이 만료되어 예약이 자동 취소되었습니다.",
      linkPath: "/my-bookings",
      bookingId: booking.id,
    }).catch(() => {});

    const hostEmail = booking.listing.user?.email;
    const isSameEmail = hostEmail && booking.user?.email && hostEmail === booking.user.email;
    if (hostEmail && !isSameEmail) {
      const hostMail = unpaidAutoCancelHost({
        ...emailInfo,
        hostName: booking.listing.user?.name || "Host",
        deadlineLabel: "24시간",
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
        console.error("[CancelUnpaid] approval message:", err);
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
