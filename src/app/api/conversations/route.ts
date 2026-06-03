import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { fetchConversationListForUser } from "@/lib/conversation-read";

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

  const conversations = await fetchConversationListForUser(userId);
  return NextResponse.json({ conversations });
}

/**
 * POST /api/conversations
 * 대화방 조회 또는 생성 (body: { bookingId })
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
