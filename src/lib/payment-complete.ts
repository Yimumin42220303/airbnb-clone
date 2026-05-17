/**
 * 결제 검증 완료 후 공통 처리 (대화방·메시지·이메일·알림·Beds24·스케줄 메시지)
 * /api/payments/verify 와 /api/payments/mock-verify 에서 사용
 */
import { prisma } from "@/lib/prisma";
import { sendEmailAsync, BASE_URL } from "@/lib/email";
import {
  paymentConfirmationGuest,
  paymentConfirmationHost,
} from "@/lib/email-templates";
import { createNotification } from "@/lib/notifications";
import { sendPushToUser } from "@/lib/web-push";
import { sendDiscordMessage } from "@/lib/discord";
import { ensureOfficialUserId } from "@/lib/official-account";

/** 즉시예약 + 결제 완료 시 도쿄민박 공식 계정 자동 발송 문구 */
export const INSTANT_BOOKING_PAYMENT_WELCOME_BODY =
  "결제가 정상적으로 완료되었으며, 예약이 확정되었습니다. 3일내에 호스트가 체크인 안내를 전달드릴 예정입니다. 호스트로부터의 메시지를 기다려 주세요.😊(여기서 언제든지 호스트에게 메시지를 보낼수 있어요)";
import { syncBookingToBeds24 } from "@/lib/bookings";
import { createScheduledMessagesForBooking } from "@/lib/scheduled-messages";

/**
 * 즉시예약·결제완료인데 환영 메시지가 없는 경우 보완 (웹훅/verify 레이스·구버그 대비).
 */
export async function ensureInstantBookingWelcomeMessage(
  bookingId: string
): Promise<void> {
  const row = await prisma.booking.findUnique({
    where: { id: bookingId },
    select: {
      paymentStatus: true,
      status: true,
      listing: { select: { instantBooking: true } },
    },
  });
  if (!row?.listing.instantBooking) return;
  if (row.paymentStatus !== "paid") return;
  if (row.status === "cancelled") return;

  let conversation = await prisma.conversation.findUnique({
    where: { bookingId },
    include: { _count: { select: { messages: true } } },
  });
  if (!conversation) {
    conversation = await prisma.conversation.create({
      data: { bookingId },
      include: { _count: { select: { messages: true } } },
    });
  }
  if (conversation._count.messages > 0) return;

  const officialUserId = await ensureOfficialUserId();
  await prisma.message.create({
    data: {
      conversationId: conversation.id,
      senderId: officialUserId,
      body: INSTANT_BOOKING_PAYMENT_WELCOME_BODY,
    },
  });
}

export async function onPaymentVerified(bookingId: string): Promise<string | null> {
  let conversationId: string | null = null;

  const fullBooking = await prisma.booking.findUnique({
    where: { id: bookingId },
    include: {
      listing: {
        select: {
          id: true,
          title: true,
          location: true,
          userId: true,
          instantBooking: true,
          user: { select: { name: true, email: true } },
        },
      },
      user: { select: { name: true, email: true } },
    },
  });

  if (!fullBooking) return null;

  try {
    let conversation = await prisma.conversation.findUnique({
      where: { bookingId },
      include: { _count: { select: { messages: true } } },
    });
    if (!conversation) {
      conversation = await prisma.conversation.create({
        data: { bookingId },
        include: { _count: { select: { messages: true } } },
      });
    }
    conversationId = conversation.id;

    // 웹훅·verify 동시 도착 시 중복 방지: 이미 메시지가 있으면 건너뜀
    if (conversation._count.messages === 0) {
      const isInstantBooking = fullBooking.listing.instantBooking === true;
      if (!isInstantBooking) {
        await prisma.message.create({
          data: {
            conversationId: conversation.id,
            senderId: fullBooking.listing.userId,
            body: "예약감사합니다. 3일내에 체크인방법에대해 안내드릴예정이니 조금 기다려주세요.",
          },
        });
      } else {
        await ensureInstantBookingWelcomeMessage(bookingId);
      }
    }
  } catch (err) {
    console.error("[PaymentComplete] 자동 메시지 전송 오류:", err);
  }

  if (fullBooking.user?.email) {
    const nights = Math.floor(
      (fullBooking.checkOut.getTime() - fullBooking.checkIn.getTime()) / (24 * 60 * 60 * 1000)
    );
    const emailInfo = {
      listingTitle: fullBooking.listing.title,
      listingLocation: fullBooking.listing.location,
      checkIn: fullBooking.checkIn.toISOString().slice(0, 10),
      checkOut: fullBooking.checkOut.toISOString().slice(0, 10),
      guests: fullBooking.guests,
      nights,
      totalPrice: fullBooking.totalPrice,
      guestName: fullBooking.user.name || "Guest",
      guestEmail: fullBooking.user.email,
      bookingId,
      baseUrl: BASE_URL,
    };
    const hostEmail = fullBooking.listing.user?.email;
    const isSameEmail = hostEmail && hostEmail === fullBooking.user.email;
    if (!isSameEmail) {
      const guestMail = paymentConfirmationGuest(emailInfo);
      sendEmailAsync({ to: fullBooking.user.email, ...guestMail });
    }
    if (hostEmail) {
      const hostMail = paymentConfirmationHost({
        ...emailInfo,
        hostName: fullBooking.listing.user?.name || "Host",
      });
      sendEmailAsync({ to: hostEmail, ...hostMail });
    }
    createNotification({
      userId: fullBooking.listing.userId,
      type: "guest_payment_completed",
      title: `${fullBooking.user?.name || "게스트"}님이 결제를 완료했어요. 예약이 확정되었습니다.`,
      linkPath: "/host/bookings",
      bookingId,
      listingId: fullBooking.listing.id,
    }).catch(() => {});

    try {
      await sendPushToUser(fullBooking.listing.userId, {
        title: "결제 완료",
        body: `${fullBooking.user?.name || "게스트"}님이 결제를 완료했어요. 예약이 확정되었습니다.`,
        url: "/host/bookings",
        tag: "guest_payment_completed",
      });
    } catch {
      // 푸시 실패해도 결제·이메일·앱 내 알림에는 영향 없음
    }
  }

  // Discord 알림 (DISCORD_WEBHOOK_URL 설정 시 해당 채널로 메시지 전송)
  const guestName = fullBooking.user?.name || "게스트";
  const listingTitle = fullBooking.listing.title;
  const checkIn = fullBooking.checkIn.toISOString().slice(0, 10);
  const checkOut = fullBooking.checkOut.toISOString().slice(0, 10);
  sendDiscordMessage(
    `💰 **결제 완료** ${guestName}님이 **${listingTitle}** 예약 확정 (체크인 ${checkIn} ~ ${checkOut})\n${BASE_URL}/host/bookings`
  ).catch(() => {});

  syncBookingToBeds24(bookingId).then((r) => {
    if (!r.ok) console.error("[Beds24] 결제 확정 동기화 실패:", r.error);
  });
  createScheduledMessagesForBooking(bookingId).catch((err) => {
    console.error("[ScheduledMsg] 스케줄 생성 실패:", err);
  });

  return conversationId;
}
