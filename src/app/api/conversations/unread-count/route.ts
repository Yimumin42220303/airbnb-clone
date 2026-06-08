import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getUnreadConversationCount } from "@/lib/conversation-read";

/**
 * GET /api/conversations/unread-count
 * 미읽음 대화 수 (nav 뱃지용)
 */
export async function GET() {
  const session = await getServerSession(authOptions);
  const userId = (session as { userId?: string } | null)?.userId;
  if (!userId) {
    return NextResponse.json({ count: 0 });
  }

  const count = await getUnreadConversationCount(userId);
  return NextResponse.json({ count });
}
