import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  const userId = (session as { userId?: string } | null)?.userId;
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id: conversationId } = await params;

  const conversation = await prisma.conversation.findUnique({
    where: { id: conversationId },
    include: {
      booking: { select: { userId: true, listing: { select: { userId: true } } } },
    },
  });
  if (!conversation) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const isParticipant =
    conversation.booking.userId === userId ||
    conversation.booking.listing.userId === userId;
  if (!isParticipant) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const items = await prisma.scheduledMessage.findMany({
    where: { conversationId },
    orderBy: { scheduledAt: "asc" },
    include: {
      template: { select: { title: true, trigger: true } },
    },
  });

  return NextResponse.json({
    items: items.map((sm) => ({
      id: sm.id,
      title: sm.template.title,
      trigger: sm.template.trigger,
      scheduledAt: sm.scheduledAt.toISOString(),
      status: sm.status,
      sentAt: sm.sentAt?.toISOString() ?? null,
      sentManually: sm.sentManually,
      renderedBody: sm.renderedBody,
    })),
  });
}
