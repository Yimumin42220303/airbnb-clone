import { prisma } from "@/lib/prisma";
import { sendEmailAsync, BASE_URL } from "@/lib/email";
import { getOfficialUserId } from "@/lib/official-account";
import { createNotification } from "@/lib/notifications";
import { sendChannelTalkNotification } from "@/lib/channel-api";
import {
  unpaidAutoCancelGuest,
  unpaidAutoCancelHost,
  paymentReminderGuest,
  instantPaymentReminderGuest,
  type BookingEmailInfo,
} from "@/lib/email-templates";
import {
  HOST_UNPAID_AUTO_CANCEL_TITLE,
  FINAL_REMINDER_NOTIFICATION_TYPE,
  getUnpaidDeadlineAt,
  getUnpaidDeadlineLabel,
  getUnpaidAutoCancelTitle,
  getPaymentReminderTitle,
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
  const booking = await prisma.booking.findUnique({
    where: { id: opts.bookingId },
    include: bookingInclude,
  });
  if (!booking) return;

  // 예약별 적용 기한 라벨 (컷오버 이전 확정 예약은 "48시간")
  const deadlineLabel =
    opts.deadlineLabel ??
    (booking.confirmedAt
      ? getUnpaidDeadlineLabel(booking.confirmedAt)
      : undefined) ??
    "24시간";
  const guestCancelTitle = getUnpaidAutoCancelTitle(deadlineLabel);

  const emailInfo = buildEmailInfo(booking);

  if (booking.user?.email) {
    const guestMail = unpaidAutoCancelGuest({ ...emailInfo, deadlineLabel });
    sendEmailAsync({ to: booking.user.email, ...guestMail });
  }

  createNotification({
    userId: booking.userId,
    type: "unpaid_auto_cancel",
    title: guestCancelTitle,
    linkPath: "/my-bookings",
    bookingId: booking.id,
  }).catch(() => {});

  // 채널톡 봇 메시지 (키 미설정·실패 시 내부에서 무시)
  void sendChannelTalkNotification(
    booking.userId,
    `${guestCancelTitle}\n· ${booking.listing.title}\n다른 날짜로 다시 예약하시려면: ${BASE_URL}/my-bookings`,
    { botName: "도쿄민박" }
  );

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
          body: guestCancelTitle,
        },
      });
    }
  } catch (err) {
    console.error("[notifyUnpaidAutoCancel] message:", err);
  }
}

/**
 * 결제 리마인더 — 게스트 이메일 + 인앱 알림.
 * - 1차(final: false): 확정 후 6시간 경과. 호출 전 paymentReminderSent 가 true 로 갱신된 뒤 호출할 것.
 * - 2차(final: true): 만료 3시간 전. payment_reminder_final 알림 레코드가 중복 발송을 방지.
 */
export async function notifyPaymentReminder(
  bookingId: string,
  opts: { final: boolean } = { final: false }
): Promise<void> {
  const booking = await prisma.booking.findUnique({
    where: { id: bookingId },
    include: {
      listing: { select: { title: true, location: true, instantBooking: true } },
      user: { select: { name: true, email: true } },
    },
  });
  if (!booking?.confirmedAt) return;

  // 예약별 적용 기한 (컷오버 이전 확정 예약은 48h)
  const deadline = getUnpaidDeadlineAt(booking.confirmedAt);
  const deadlineText = deadline.toLocaleString("ko-KR", {
    timeZone: "Asia/Seoul",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });
  const title = getPaymentReminderTitle(deadline.getTime() - Date.now());

  const emailInfo = buildEmailInfo(booking);

  if (booking.user?.email) {
    const mail = booking.listing.instantBooking
      ? instantPaymentReminderGuest({ ...emailInfo, deadlineText })
      : paymentReminderGuest({ ...emailInfo, deadlineText });
    sendEmailAsync({ to: booking.user.email, ...mail });
  }

  createNotification({
    userId: booking.userId,
    type: opts.final ? FINAL_REMINDER_NOTIFICATION_TYPE : "payment_reminder",
    title,
    linkPath: `/booking/${booking.id}/pay`,
    linkLabel: "결제하기",
    bookingId: booking.id,
  }).catch(() => {});

  // 채널톡 봇 메시지 — 결제 링크 포함 (키 미설정·실패 시 내부에서 무시)
  void sendChannelTalkNotification(
    booking.userId,
    `${title}\n· ${booking.listing.title} (${deadlineText}까지)\n지금 결제하기: ${BASE_URL}/booking/${booking.id}/pay`,
    { botName: "도쿄민박" }
  );
}
