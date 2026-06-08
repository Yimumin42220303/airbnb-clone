import { prisma } from "@/lib/prisma";
import { sendEmailAsync, BASE_URL } from "@/lib/email";
import { getOfficialUserId } from "@/lib/official-account";
import { createNotification } from "@/lib/notifications";
import {
  unpaidAutoCancelGuest,
  unpaidAutoCancelHost,
  paymentReminderGuest,
  type BookingEmailInfo,
} from "@/lib/email-templates";
import {
  UNPAID_DEADLINE_LABEL,
  UNPAID_DEADLINE_MS,
  GUEST_UNPAID_AUTO_CANCEL_TITLE,
  GUEST_PAYMENT_REMINDER_TITLE,
  HOST_UNPAID_AUTO_CANCEL_TITLE,
} from "@/lib/unpaid-deadline";

const bookingInclude = {
  listing: {
    select: {
      title: true,
      location: true,
      userId: true,
      user: { select: { name: true, email: true } },
    },
  },
  user: { select: { name: true, email: true } },
} as const;

function buildEmailInfo(booking: {
  id: string;
  checkIn: Date;
  checkOut: Date;
  guests: number;
  totalPrice: number;
  listing: { title: string; location: string | null };
  user: { name: string | null; email: string | null } | null;
}): BookingEmailInfo {
  const nights = Math.floor(
    (booking.checkOut.getTime() - booking.checkIn.getTime()) / (24 * 60 * 60 * 1000)
  );
  return {
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
}

/**
 * 미결제 자동 취소 후 게스트·호스트 이메일, 인앱 알림, 공식 계정 시스템 메시지 발송.
 * 호출 전 booking.status 가 cancelled 로 갱신된 뒤 호출할 것.
 */
export async function notifyUnpaidAutoCancel(opts: {
  bookingId: string;
  deadlineLabel?: string;
}): Promise<void> {
  const deadlineLabel = opts.deadlineLabel ?? UNPAID_DEADLINE_LABEL;

  const booking = await prisma.booking.findUnique({
    where: { id: opts.bookingId },
    include: bookingInclude,
  });
  if (!booking) return;

  const emailInfo = buildEmailInfo(booking);

  if (booking.user?.email) {
    const guestMail = unpaidAutoCancelGuest({ ...emailInfo, deadlineLabel });
    sendEmailAsync({ to: booking.user.email, ...guestMail });
  }

  createNotification({
    userId: booking.userId,
    type: "unpaid_auto_cancel",
    title: GUEST_UNPAID_AUTO_CANCEL_TITLE,
    linkPath: "/my-bookings",
    bookingId: booking.id,
  }).catch(() => {});

  const hostEmail = booking.listing.user?.email;
  const isSameEmail =
    hostEmail && booking.user?.email && hostEmail === booking.user.email;
  if (hostEmail && !isSameEmail) {
    const hostMail = unpaidAutoCancelHost({
      ...emailInfo,
      hostName: booking.listing.user?.name || "Host",
      deadlineLabel,
    });
    sendEmailAsync({ to: hostEmail, ...hostMail });
  }

  createNotification({
    userId: booking.listing.userId,
    type: "unpaid_auto_cancel",
    title: HOST_UNPAID_AUTO_CANCEL_TITLE,
    linkPath: "/host/bookings",
    bookingId: booking.id,
  }).catch(() => {});

  const officialUserId = await getOfficialUserId();
  if (!officialUserId) return;

  try {
    const conversation = await prisma.conversation.findUnique({
      where: { bookingId: booking.id },
    });
    if (conversation) {
      await prisma.message.create({
        data: {
          conversationId: conversation.id,
          senderId: officialUserId,
          body: GUEST_UNPAID_AUTO_CANCEL_TITLE,
        },
      });
    }
  } catch (err) {
    console.error("[notifyUnpaidAutoCancel] message:", err);
  }
}

/**
 * 결제 기한 임박(남은 24h 이내) 리마인더 — 게스트 이메일 + 인앱 알림.
 * 호출 전 paymentReminderSent 가 true 로 갱신된 뒤 호출할 것.
 */
export async function notifyPaymentReminder(bookingId: string): Promise<void> {
  const booking = await prisma.booking.findUnique({
    where: { id: bookingId },
    include: {
      listing: { select: { title: true, location: true } },
      user: { select: { name: true, email: true } },
    },
  });
  if (!booking?.confirmedAt) return;

  const deadline = new Date(booking.confirmedAt.getTime() + UNPAID_DEADLINE_MS);
  const deadlineText = deadline.toLocaleString("ko-KR", {
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });

  const emailInfo = buildEmailInfo(booking);

  if (booking.user?.email) {
    const mail = paymentReminderGuest({ ...emailInfo, deadlineText });
    sendEmailAsync({ to: booking.user.email, ...mail });
  }

  createNotification({
    userId: booking.userId,
    type: "payment_reminder",
    title: GUEST_PAYMENT_REMINDER_TITLE,
    linkPath: `/booking/${booking.id}/pay`,
    linkLabel: "결제하기",
    bookingId: booking.id,
  }).catch(() => {});
}
