import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { sendMetaCapiEvent } from "@/lib/meta-capi";
import { extractMetaCookies } from "@/lib/meta-user-data";
import { BASE_URL } from "@/lib/site-url";

/**
 * POST /api/capi/lead
 * 추천 펀넬 완료 또는 회원가입 시 Lead 이벤트 CAPI 전송.
 * Body: { eventId: string; source: 'recommend' | 'signup' }
 */
export async function POST(request: Request) {
  try {
    const body = await request.json() as { eventId?: string; source?: string };
    const { eventId, source } = body;

    if (!eventId) {
      return NextResponse.json({ ok: false, error: "eventId required" }, { status: 400 });
    }

    const session = await getServerSession(authOptions);
    const userId = (session as { userId?: string } | null)?.userId ?? null;

    let userEmail: string | null = null;
    let userPhone: string | null = null;
    let userFirstName: string | null = null;
    let userLastName: string | null = null;

    if (userId) {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { email: true, phone: true, name: true },
      }).catch(() => null);
      if (user) {
        userEmail = user.email ?? null;
        userPhone = user.phone ?? null;
        const parts = user.name?.trim().split(/\s+/) ?? [];
        userFirstName = parts[0] ?? null;
        userLastName = parts.length > 1 ? parts.slice(1).join(" ") : null;
      }
    }

    const { fbc, fbp } = extractMetaCookies(request);
    const clientIp = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim()
      ?? request.headers.get("x-real-ip")
      ?? undefined;
    const clientUserAgent = request.headers.get("user-agent") ?? undefined;

    const sourceUrl = source === "signup"
      ? `${BASE_URL}/auth/signup`
      : `${BASE_URL}/recommend`;

    void sendMetaCapiEvent({
      eventName: "Lead",
      eventId,
      eventSourceUrl: sourceUrl,
      customData: { source: source ?? "recommend" },
      clientIpAddress: clientIp,
      clientUserAgent,
      userEmail,
      userPhone,
      userFirstName,
      userLastName,
      fbc,
      fbp,
    }).catch((err) => console.error("[capi] Lead failed:", err));

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[api/capi/lead]", err);
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}
