import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { sendMetaCapiEvent } from "@/lib/meta-capi";
import { extractMetaCookies } from "@/lib/meta-user-data";
import { BASE_URL } from "@/lib/site-url";

/**
 * POST /api/listings/[id]/view
 * 숙소 상세 페이지 진입 시 CAPI ViewContent 미러링.
 * Body: { eventId: string }  — 브라우저 Pixel과 동일한 eventId 전달 (중복 제거용)
 */
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: listingId } = await params;
    if (!listingId) {
      return NextResponse.json({ ok: false }, { status: 400 });
    }

    let eventId: string | undefined;
    try {
      const body = await request.json();
      eventId = typeof body.eventId === "string" ? body.eventId : undefined;
    } catch {
      // eventId 없어도 계속 진행
    }
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

    void sendMetaCapiEvent({
      eventName: "ViewContent",
      eventId,
      eventSourceUrl: `${BASE_URL}/listing/${listingId}`,
      contentIds: [listingId],
      clientIpAddress: clientIp,
      clientUserAgent,
      userEmail,
      userPhone,
      userFirstName,
      userLastName,
      fbc,
      fbp,
    }).catch((err) => console.error("[capi] ViewContent failed:", err));

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[api/listings/view]", err);
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}
