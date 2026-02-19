import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

/**
 * GET /api/notifications/unread-count
 * 안 읽은 알림 개수 (배지용)
 */
export async function GET() {
  const session = await getServerSession(authOptions);
  const userId = (session as { userId?: string } | null)?.userId;
  if (!userId) {
    return NextResponse.json({ count: 0 });
  }

  const count = await prisma.notification.count({
    where: { userId, readAt: null },
  });

  return NextResponse.json({ count });
}
