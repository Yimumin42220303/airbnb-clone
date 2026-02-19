/**
 * 앱 내 알림 생성 유틸
 * 기존 API(예약 승인/거절, 메시지, 예약 생성, 결제 검증, 취소)에서 호출
 */

import { prisma } from "./prisma";

export type NotificationType =
  | "booking_approved"
  | "booking_rejected"
  | "new_message"
  | "new_booking_request"
  | "guest_payment_completed"
  | "booking_cancelled";

export type CreateNotificationInput = {
  userId: string;
  type: NotificationType;
  title: string;
  linkPath?: string | null;
  linkLabel?: string | null;
  bookingId?: string | null;
  conversationId?: string | null;
  listingId?: string | null;
};

/** 동일 유형·연관 ID·짧은 시간 내 중복 생성 방지 (1분) */
const DEDUP_WINDOW_MS = 60_000;

export async function createNotification(
  input: CreateNotificationInput
): Promise<void> {
  const { userId, type, title, linkPath, linkLabel, bookingId, conversationId, listingId } =
    input;
  if (!userId || !type || !title) return;

  try {
    const since = new Date(Date.now() - DEDUP_WINDOW_MS);
    const existing = await prisma.notification.findFirst({
      where: {
        userId,
        type,
        createdAt: { gte: since },
        ...(bookingId && { bookingId }),
        ...(conversationId && { conversationId }),
      },
    });
    if (existing) return;

    await prisma.notification.create({
      data: {
        userId,
        type,
        title,
        linkPath: linkPath ?? null,
        linkLabel: linkLabel ?? null,
        bookingId: bookingId ?? null,
        conversationId: conversationId ?? null,
        listingId: listingId ?? null,
      },
    });
  } catch (err) {
    console.error("[createNotification]", err);
  }
}
