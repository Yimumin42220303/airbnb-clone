import { prisma } from "./prisma";

const JST_OFFSET_MS = 9 * 60 * 60 * 1000;

type ShortcodeContext = {
  guestName: string;
  hostName: string;
  listingName: string;
  listingAddress: string;
  checkinDate: string;
  checkoutDate: string;
  guestsCount: number;
  nights: number;
  totalPrice: number;
  bookingId: string;
  houseRules: string;
};

export function renderShortcodes(body: string, ctx: ShortcodeContext): string {
  return body
    .replace(/\{guest_name\}/g, ctx.guestName || "Guest")
    .replace(/\{host_name\}/g, ctx.hostName || "Host")
    .replace(/\{listing_name\}/g, ctx.listingName)
    .replace(/\{listing_address\}/g, ctx.listingAddress)
    .replace(/\{checkin_date\}/g, ctx.checkinDate)
    .replace(/\{checkout_date\}/g, ctx.checkoutDate)
    .replace(/\{guests_count\}/g, String(ctx.guestsCount))
    .replace(/\{nights\}/g, String(ctx.nights))
    .replace(/\{total_price\}/g, `¥${ctx.totalPrice.toLocaleString()}`)
    .replace(/\{booking_id\}/g, ctx.bookingId)
    .replace(/\{house_rules\}/g, ctx.houseRules || "");
}

function computeScheduledAt(
  trigger: string,
  offsetDays: number,
  sendTime: string,
  checkIn: Date,
  checkOut: Date,
  bookingConfirmedAt: Date
): Date | null {
  const [hh, mm] = (sendTime || "10:00").split(":").map(Number);

  let baseDate: Date;
  switch (trigger) {
    case "booking_confirmed":
      baseDate = new Date(bookingConfirmedAt);
      baseDate.setDate(baseDate.getDate() + offsetDays);
      break;
    case "before_checkin":
      baseDate = new Date(checkIn);
      baseDate.setDate(baseDate.getDate() - offsetDays);
      break;
    case "after_checkin":
      baseDate = new Date(checkIn);
      baseDate.setDate(baseDate.getDate() + offsetDays);
      break;
    case "before_checkout":
      baseDate = new Date(checkOut);
      baseDate.setDate(baseDate.getDate() - offsetDays);
      break;
    case "after_checkout":
      baseDate = new Date(checkOut);
      baseDate.setDate(baseDate.getDate() + offsetDays);
      break;
    default:
      return null;
  }

  const jstMs =
    Date.UTC(
      baseDate.getFullYear(),
      baseDate.getMonth(),
      baseDate.getDate(),
      hh || 10,
      mm || 0,
      0
    );
  const utcMs = jstMs - JST_OFFSET_MS;
  return new Date(utcMs);
}

/**
 * 예약 확정 시 호출: 매칭되는 템플릿으로 ScheduledMessage 인스턴스 생성
 */
export async function createScheduledMessagesForBooking(bookingId: string) {
  const booking = await prisma.booking.findUnique({
    where: { id: bookingId },
    include: {
      listing: { select: { id: true, title: true, location: true, houseRules: true, userId: true, user: { select: { name: true } } } },
      user: { select: { name: true } },
      conversation: { select: { id: true } },
    },
  });
  if (!booking?.conversation) return;

  const hostId = booking.listing.userId;
  const templates = await prisma.scheduledMessageTemplate.findMany({
    where: { hostId, enabled: true },
    include: { templateListings: { select: { listingId: true } } },
  });

  const applicableTemplates = templates.filter((t) => {
    const ids = t.templateListings.map((tl) => tl.listingId);
    return ids.length === 0 || ids.includes(booking.listing.id);
  });
  if (applicableTemplates.length === 0) return;

  const now = new Date();
  const nights = Math.max(1, Math.floor((booking.checkOut.getTime() - booking.checkIn.getTime()) / (24 * 60 * 60 * 1000)));
  const ctx: ShortcodeContext = {
    guestName: booking.user?.name || "Guest",
    hostName: booking.listing.user?.name || "Host",
    listingName: booking.listing.title,
    listingAddress: booking.listing.location,
    checkinDate: booking.checkIn.toISOString().slice(0, 10),
    checkoutDate: booking.checkOut.toISOString().slice(0, 10),
    guestsCount: booking.guests,
    nights,
    totalPrice: booking.totalPrice,
    bookingId: booking.id,
    houseRules: booking.listing.houseRules || "",
  };

  const existing = await prisma.scheduledMessage.findMany({
    where: { conversationId: booking.conversation.id },
    select: { templateId: true },
  });
  const existingTemplateIds = new Set(existing.map((e) => e.templateId));

  const records = applicableTemplates
    .filter((t) => !existingTemplateIds.has(t.id))
    .map((t) => {
      const scheduledAt = computeScheduledAt(t.trigger, t.offsetDays, t.sendTime, booking.checkIn, booking.checkOut, now);
      if (!scheduledAt || scheduledAt < now) return null;
      return {
        conversationId: booking.conversation!.id,
        templateId: t.id,
        scheduledAt,
        renderedBody: renderShortcodes(t.body, ctx),
        status: "pending" as const,
      };
    })
    .filter(Boolean) as Array<{
      conversationId: string;
      templateId: string;
      scheduledAt: Date;
      renderedBody: string;
      status: string;
    }>;

  if (records.length > 0) {
    await prisma.scheduledMessage.createMany({ data: records });
  }
}

/**
 * Cron: pending & scheduledAt <= now 인 건을 메시지로 전송
 */
export async function processScheduledMessages(limit = 50): Promise<number> {
  const now = new Date();
  const pending = await prisma.scheduledMessage.findMany({
    where: { status: "pending", scheduledAt: { lte: now } },
    take: limit,
    orderBy: { scheduledAt: "asc" },
    include: {
      conversation: {
        select: {
          id: true,
          booking: { select: { listing: { select: { userId: true } } } },
        },
      },
    },
  });

  let sent = 0;
  for (const sm of pending) {
    try {
      const hostId = sm.conversation.booking.listing.userId;
      const msg = await prisma.message.create({
        data: {
          conversationId: sm.conversationId,
          senderId: hostId,
          body: sm.renderedBody,
        },
      });
      await prisma.scheduledMessage.update({
        where: { id: sm.id },
        data: { status: "sent", sentAt: now, messageId: msg.id, sentManually: false },
      });
      sent++;
    } catch (err) {
      console.error(`[ScheduledMsg] Failed to send ${sm.id}:`, err instanceof Error ? err.message : err);
    }
  }
  return sent;
}

/**
 * 지금 보내기
 */
export async function sendScheduledMessageNow(
  scheduleId: string,
  senderId: string
): Promise<{ ok: boolean; error?: string }> {
  const sm = await prisma.scheduledMessage.findUnique({
    where: { id: scheduleId },
  });
  if (!sm) return { ok: false, error: "not found" };
  if (sm.status !== "pending") return { ok: false, error: "already processed" };

  const msg = await prisma.message.create({
    data: {
      conversationId: sm.conversationId,
      senderId,
      body: sm.renderedBody,
    },
  });
  await prisma.scheduledMessage.update({
    where: { id: scheduleId },
    data: { status: "sent", sentAt: new Date(), messageId: msg.id, sentManually: true },
  });
  return { ok: true };
}

/**
 * 건너뛰기
 */
export async function skipScheduledMessage(
  scheduleId: string
): Promise<{ ok: boolean; error?: string }> {
  const sm = await prisma.scheduledMessage.findUnique({
    where: { id: scheduleId },
  });
  if (!sm) return { ok: false, error: "not found" };
  if (sm.status !== "pending") return { ok: false, error: "already processed" };

  await prisma.scheduledMessage.update({
    where: { id: scheduleId },
    data: { status: "skipped" },
  });
  return { ok: true };
}
