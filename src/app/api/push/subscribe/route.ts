import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

type SubscribeBody = {
  endpoint: string;
  keys: { p256dh: string; auth: string };
  userAgent?: string;
};

/**
 * POST /api/push/subscribe
 * PWA 푸시 구독 등록. 로그인 사용자만. 클라이언트가 PushSubscription 직렬화 객체 전달.
 */
export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  const userId = (session as { userId?: string } | null)?.userId;
  if (!userId) {
    return NextResponse.json({ error: "로그인이 필요합니다." }, { status: 401 });
  }

  let body: SubscribeBody;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "잘못된 요청입니다." }, { status: 400 });
  }

  const { endpoint, keys, userAgent } = body;
  if (!endpoint || !keys?.p256dh || !keys?.auth) {
    return NextResponse.json(
      { error: "endpoint와 keys.p256dh, keys.auth가 필요합니다." },
      { status: 400 }
    );
  }

  try {
    await prisma.pushSubscription.upsert({
      where: {
        userId_endpoint: { userId, endpoint },
      },
      create: {
        userId,
        endpoint,
        p256dh: keys.p256dh,
        auth: keys.auth,
        userAgent: userAgent ?? null,
      },
      update: {
        p256dh: keys.p256dh,
        auth: keys.auth,
        userAgent: userAgent ?? null,
      },
    });
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[POST /api/push/subscribe]", err);
    return NextResponse.json(
      { error: "구독 저장에 실패했습니다." },
      { status: 500 }
    );
  }
}
