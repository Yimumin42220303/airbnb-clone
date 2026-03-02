import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { skipScheduledMessage } from "@/lib/scheduled-messages";

export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string; scheduleId: string }> }
) {
  const session = await getServerSession(authOptions);
  const userId = (session as { userId?: string } | null)?.userId;
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id: conversationId, scheduleId } = await params;

  const conversation = await prisma.conversation.findUnique({
    where: { id: conversationId },
    include: { booking: { select: { listing: { select: { userId: true } } } } },
  });
  if (!conversation) return NextResponse.json({ error: "Not found" }, { status: 404 });

  if (conversation.booking.listing.userId !== userId) {
    return NextResponse.json({ error: "호스트만 건너뛸 수 있습니다." }, { status: 403 });
  }

  const sm = await prisma.scheduledMessage.findUnique({ where: { id: scheduleId } });
  if (!sm || sm.conversationId !== conversationId) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const result = await skipScheduledMessage(scheduleId);
  if (!result.ok) return NextResponse.json({ error: result.error }, { status: 400 });

  return NextResponse.json({ ok: true });
}
