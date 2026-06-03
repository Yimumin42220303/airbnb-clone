import { prisma } from "@/lib/prisma";

export type LastMessageLike = {
  body: string;
  imageUrl?: string | null;
  createdAt: Date;
  senderId: string;
} | null;

export function formatLastMessagePreview(
  body: string,
  imageUrl?: string | null
): string {
  const trimmed = body.trim();
  if (trimmed) return trimmed;
  if (imageUrl) return "사진을 보냈어요";
  return "";
}

export function isConversationUnread(
  userId: string,
  lastMessage: LastMessageLike,
  lastReadAt: Date | null | undefined
): boolean {
  if (!lastMessage) return false;
  if (lastMessage.senderId === userId) return false;
  if (!lastReadAt) return true;
  return lastMessage.createdAt.getTime() > lastReadAt.getTime();
}

export async function getConversationReadMap(
  userId: string,
  conversationIds: string[]
): Promise<Map<string, Date>> {
  if (conversationIds.length === 0) return new Map();
  const rows = await prisma.conversationRead.findMany({
    where: { userId, conversationId: { in: conversationIds } },
    select: { conversationId: true, lastReadAt: true },
  });
  return new Map(rows.map((r) => [r.conversationId, r.lastReadAt]));
}

export async function markConversationNotificationsRead(
  userId: string,
  conversationId: string,
  readAt: Date = new Date()
): Promise<void> {
  await prisma.notification.updateMany({
    where: {
      userId,
      conversationId,
      type: "new_message",
      readAt: null,
    },
    data: { readAt },
  });
}

/** 대화 읽음 처리. lastReadAt이 이미 최신이면 no-op */
export async function markConversationAsRead(
  userId: string,
  conversationId: string,
  readAt: Date = new Date()
): Promise<void> {
  const existing = await prisma.conversationRead.findUnique({
    where: {
      userId_conversationId: { userId, conversationId },
    },
    select: { lastReadAt: true },
  });
  if (existing && existing.lastReadAt.getTime() >= readAt.getTime()) {
    return;
  }

  await prisma.conversationRead.upsert({
    where: {
      userId_conversationId: { userId, conversationId },
    },
    create: { userId, conversationId, lastReadAt: readAt },
    update: { lastReadAt: readAt },
  });

  await markConversationNotificationsRead(userId, conversationId, readAt);
}

type ConversationWithMeta = {
  id: string;
  bookingId: string;
  createdAt: Date;
  booking: {
    user: { id: string; name: string | null; email: string };
    listing: {
      id: string;
      title: string;
      hostDisplayName?: string | null;
      user: { name: string | null; email: string };
    };
  };
  messages: Array<{
    body: string;
    imageUrl: string | null;
    createdAt: Date;
    senderId: string;
  }>;
};

export type ConversationListItem = {
  id: string;
  bookingId: string;
  listingId: string;
  listingTitle: string;
  otherName: string;
  lastPreview: string | null;
  lastAt: string;
  isFromMe: boolean;
  hasUnread: boolean;
  createdAt: string;
};

export function buildConversationListItems(
  conversations: ConversationWithMeta[],
  userId: string,
  readMap: Map<string, Date>
): ConversationListItem[] {
  const items = conversations.map((c) => {
    const guest = c.booking.user;
    const listing = c.booking.listing;
    const isGuest = userId === guest.id;
    const otherName = isGuest
      ? listing.user?.name || listing.user?.email || "호스트"
      : guest.name || guest.email || "게스트";
    const last = c.messages[0] ?? null;
    const lastReadAt = readMap.get(c.id);
    const isFromMe = last ? last.senderId === userId : false;
    const lastAt = last?.createdAt ?? c.createdAt;

    return {
      id: c.id,
      bookingId: c.bookingId,
      listingId: listing.id,
      listingTitle: listing.hostDisplayName?.trim() || listing.title,
      otherName,
      lastPreview: last
        ? formatLastMessagePreview(last.body, last.imageUrl)
        : null,
      lastAt: lastAt.toISOString(),
      isFromMe,
      hasUnread: isConversationUnread(userId, last, lastReadAt),
      createdAt: c.createdAt.toISOString(),
    };
  });

  items.sort(
    (a, b) => new Date(b.lastAt).getTime() - new Date(a.lastAt).getTime()
  );
  return items;
}

const CONVERSATION_INCLUDE = {
  booking: {
    include: {
      listing: {
        select: {
          id: true,
          title: true,
          hostDisplayName: true,
          user: { select: { name: true, email: true } },
        },
      },
      user: { select: { id: true, name: true, email: true } },
    },
  },
  messages: {
    orderBy: { createdAt: "desc" as const },
    take: 1,
    select: {
      body: true,
      imageUrl: true,
      createdAt: true,
      senderId: true,
    },
  },
};

export async function fetchConversationListForUser(
  userId: string
): Promise<ConversationListItem[]> {
  const conversations = await prisma.conversation.findMany({
    where: {
      OR: [{ booking: { userId } }, { booking: { listing: { userId } } }],
    },
    include: CONVERSATION_INCLUDE,
  });

  const readMap = await getConversationReadMap(
    userId,
    conversations.map((c) => c.id)
  );
  return buildConversationListItems(conversations, userId, readMap);
}

export async function getUnreadConversationCount(userId: string): Promise<number> {
  const items = await fetchConversationListForUser(userId);
  return items.filter((i) => i.hasUnread).length;
}
