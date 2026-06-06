import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { sendMetaCapiEvent } from "@/lib/meta-capi";
import { extractMetaCookies } from "@/lib/meta-user-data";
import { BASE_URL } from "@/lib/site-url";

/**
 * POST /api/capi/initiate-checkout
 * 결제 페이지 진입 시 CAPI InitiateCheckout 미러링.
 * Body: { eventId: string; bookingId: string; value: number }
 */
export async function POST(request: Request) {
  try {
    const body = await request.json() as { eventId?: string; bookingId?: string; value?: number };
    const { eventId, bookingId, value } = body;

    if (!eventId || !bookingId) {
      return NextResponse.json({ ok: false, error: "eventId, bookingId required" }, { status: 400 });
    }

    const session = await getServerSession(authOptions);
    const userId = (session as { userId?: string } | null)?.userId ?? null;

    let userEmail: string | null = null;
    let userPhone: string | null = null;
    let userFirstName: string | null = null;
    let userLastName: string | null = null;
    let listingId: string | null = null;

    if (userId) {
      const [user, booking] = await Promise.all([
        prisma.user.findUnique({ where: { id: userId }, select: { email: true, phone: true, name: true } }).catch(() => null),
        prisma.booking.findUnique({ where: { id: bookingId }, select: { listingId: true } }).catch(() => null),
      ]);
      if (user) {
        userEmail = user.email ?? null;
        userPhone = user.phone ?? null;
        const parts = user.name?.trim().split(/\s+/) ?? [];
        userFirstName = parts[0] ?? null;
        userLastName = parts.length > 1 ? parts.slice(1).join(" ") : null;
      }
      listingId = booking?.listingId ?? null;
    }

    const { fbc, fbp } = extractMetaCookies(request);
    const clientIp = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim()
      ?? request.headers.get("x-real-ip")
      ?? undefined;
    const clientUserAgent = request.headers.get("user-agent") ?? undefined;

    void sendMetaCapiEvent({
      eventName: "InitiateCheckout",
      eventId,
      eventSourceUrl: `${BASE_URL}/booking/${bookingId}/pay`,
      contentIds: listingId ? [listingId] : undefined,
      value: typeof value === "number" ? value : undefined,
      currency: "JPY",
      clientIpAddress: clientIp,
      clientUserAgent,
      userEmail,
      userPhone,
      userFirstName,
      userLastName,
      fbc,
      fbp,
    }).catch((err) => console.error("[capi] InitiateCheckout failed:", err));

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[api/capi/initiate-checkout]", err);
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}
