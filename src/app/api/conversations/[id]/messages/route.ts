import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

function canAccessConversation(
  userId: string,
  conversation: { booking: { userId: string; listing: { userId: string } } }
) {
  return (
    conversation.booking.userId === userId ||
    conversation.booking.listing.userId === userId
  );
}

/**
 * GET /api/conversations/[id]/messages
 * 대화 메시지 목록 (참여자만)
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  const userId = (session as { userId?: string } | null)?.userId;
  if (!userId) {
    return NextResponse.json(
      { error: "로그인 후 이용할 수 있습니다." },
      { status: 401 }
    );
  }

  const { id: conversationId } = await params;

  const conversation = await prisma.conversation.findUnique({
    where: { id: conversationId },
    include: {
      booking: {
        include: {
          listing: { select: { id: true, title: true, userId: true } },
          user: { select: { id: true, name: true, email: true } },
        },
      },
    },
  });
  if (!conversation) {
    return NextResponse.json(
      { error: "대화를 찾을 수 없습니다." },
      { status: 404 }
    );
  }
  if (!canAccessConversation(userId, conversation)) {
    return NextResponse.json(
      { error: "권한이 없습니다." },
      { status: 403 }
    );
  }

  const cursor = request.nextUrl.searchParams.get("cursor");
  const orderDesc = request.nextUrl.searchParams.get("order") === "desc";
  const limit = Math.min(
    parseInt(request.nextUrl.searchParams.get("limit") || "50", 10) || 50,
    100
  );

  const messages = await prisma.message.findMany({
    where: { conversationId },
    orderBy: { createdAt: orderDesc ? "desc" : "asc" },
    take: orderDesc ? limit : limit + 1,
    ...(cursor && !orderDesc ? { cursor: { id: cursor }, skip: 1 } : {}),
    include: {
      sender: { select: { id: true, name: true, email: true } },
    },
  });

  const list = orderDesc ? [...messages].reverse() : messages.slice(0, limit);
  const hasMore = !orderDesc && messages.length > limit;
  const nextCursor = hasMore ? (messages[limit - 1]?.id ?? null) : null;

  const listing = conversation.booking.listing;
  const guest = conversation.booking.user;
  const isGuest = userId === guest.id;
  const otherName = isGuest
    ? "호스트"
    : (guest.name || guest.email || "게스트");

  return NextResponse.json({
    conversationId,
    bookingId: conversation.bookingId,
    listingId: listing.id,
    listingTitle: listing.title,
    otherName,
    messages: list.map((m) => ({
      id: m.id,
      body: m.body,
      createdAt: m.createdAt.toISOString(),
      senderId: m.senderId,
      isFromMe: m.senderId === userId,
      senderName: m.sender.name || m.sender.email || "알 수 없음",
    })),
    nextCursor,
  });
}

/**
 * POST /api/conversations/[id]/messages
 * 메시지 전송 (참여자만)
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  const userId = (session as { userId?: string } | null)?.userId;
  if (!userId) {
    return NextResponse.json(
      { error: "로그인 후 이용할 수 있습니다." },
      { status: 401 }
    );
  }

  const { id: conversationId } = await params;
  const body = await request.json();
  const text = typeof body.body === "string" ? body.body.trim() : "";
  if (!text) {
    return NextResponse.json(
      { error: "메시지 내용을 입력해 주세요." },
      { status: 400 }
    );
  }
  if (text.length > 2000) {
    return NextResponse.json(
      { error: "메시지는 2000자 이내로 입력해 주세요." },
      { status: 400 }
    );
  }

  const conversation = await prisma.conversation.findUnique({
    where: { id: conversationId },
    include: {
      booking: { include: { listing: { select: { userId: true } } } },
    },
  });
  if (!conversation) {
    return NextResponse.json(
      { error: "대화를 찾을 수 없습니다." },
      { status: 404 }
    );
  }
  if (!canAccessConversation(userId, conversation)) {
    return NextResponse.json(
      { error: "권한이 없습니다." },
      { status: 403 }
    );
  }

  const message = await prisma.message.create({
    data: {
      conversationId,
      senderId: userId,
      body: text,
    },
    include: {
      sender: { select: { id: true, name: true, email: true } },
    },
  });

  return NextResponse.json({
    id: message.id,
    body: message.body,
    createdAt: message.createdAt.toISOString(),
    senderId: message.senderId,
    isFromMe: true,
    senderName: message.sender.name || message.sender.email || "알 수 없음",
  });
}
