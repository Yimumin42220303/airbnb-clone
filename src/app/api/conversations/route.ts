import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

/**
 * GET /api/conversations
 * 내가 참여한 대화 목록 (게스트 또는 호스트)
 */
export async function GET() {
  const session = await getServerSession(authOptions);
  const userId = (session as { userId?: string } | null)?.userId;
  if (!userId) {
    return NextResponse.json(
      { error: "로그인 후 이용할 수 있습니다." },
      { status: 401 }
    );
  }

  const conversations = await prisma.conversation.findMany({
    where: {
      OR: [
        { booking: { userId } },
        { booking: { listing: { userId } } },
      ],
    },
    orderBy: { createdAt: "desc" },
    include: {
      booking: {
        include: {
          listing: {
            include: { user: { select: { name: true, email: true } } },
          },
          user: { select: { id: true, name: true, email: true } },
        },
      },
      messages: {
        orderBy: { createdAt: "desc" },
        take: 1,
        select: { id: true, body: true, createdAt: true, senderId: true },
      },
    },
  });

  const result = conversations.map((c) => {
    const guest = c.booking.user;
    const listing = c.booking.listing as { id: string; title: string; user: { name: string | null; email: string } };
    const isGuest = userId === guest.id;
    const otherName = isGuest
      ? (listing.user?.name || listing.user?.email || "호스트")
      : (guest.name || guest.email || "게스트");
    const last = c.messages[0];
    return {
      id: c.id,
      bookingId: c.bookingId,
      listingId: listing.id,
      listingTitle: listing.title,
      otherName,
      lastMessage: last
        ? {
            body: last.body,
            createdAt: last.createdAt.toISOString(),
            isFromMe: last.senderId === userId,
          }
        : null,
      createdAt: c.createdAt.toISOString(),
    };
  });

  return NextResponse.json({ conversations: result });
}

/**
 * POST /api/conversations
 * 예약에 대한 대화방 조회 또는 생성 (body: { bookingId })
 */
export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  const userId = (session as { userId?: string } | null)?.userId;
  if (!userId) {
    return NextResponse.json(
      { error: "로그인 후 이용할 수 있습니다." },
      { status: 401 }
    );
  }

  const body = await request.json();
  const bookingId = body.bookingId;
  if (!bookingId || typeof bookingId !== "string") {
    return NextResponse.json(
      { error: "bookingId가 필요합니다." },
      { status: 400 }
    );
  }

  const booking = await prisma.booking.findUnique({
    where: { id: bookingId },
    include: { listing: { select: { userId: true } } },
  });
  if (!booking) {
    return NextResponse.json(
      { error: "예약을 찾을 수 없습니다." },
      { status: 404 }
    );
  }
  const isGuest = booking.userId === userId;
  const isHost = booking.listing.userId === userId;
  if (!isGuest && !isHost) {
    return NextResponse.json(
      { error: "해당 예약의 게스트 또는 호스트만 대화할 수 있습니다." },
      { status: 403 }
    );
  }

  let conversation = await prisma.conversation.findUnique({
    where: { bookingId },
  });
  if (!conversation) {
    conversation = await prisma.conversation.create({
      data: { bookingId },
    });
  }

  return NextResponse.json({
    id: conversation.id,
    bookingId: conversation.bookingId,
  });
}
