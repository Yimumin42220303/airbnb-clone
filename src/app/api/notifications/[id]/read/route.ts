import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

/**
 * PATCH /api/notifications/[id]/read
 * 해당 알림 읽음 처리. 본인 것만.
 */
export async function PATCH(
  _request: Request,
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

  const { id } = await params;

  const notification = await prisma.notification.findUnique({
    where: { id },
    select: { userId: true, readAt: true },
  });

  if (!notification) {
    return NextResponse.json(
      { error: "알림을 찾을 수 없습니다." },
      { status: 404 }
    );
  }
  if (notification.userId !== userId) {
    return NextResponse.json(
      { error: "권한이 없습니다." },
      { status: 403 }
    );
  }

  if (notification.readAt) {
    return NextResponse.json({ ok: true, alreadyRead: true });
  }

  await prisma.notification.update({
    where: { id },
    data: { readAt: new Date() },
  });

  return NextResponse.json({ ok: true });
}
