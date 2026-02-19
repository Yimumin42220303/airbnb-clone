import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { createNotification } from "@/lib/notifications";

/**
 * PATCH /api/admin/listings/[id]
 * 어드민 전용: 숙소 상태 변경 (승인/거절)
 * body: { status: "approved" | "rejected", rejectedReason?: string }
 */
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  const role = (session?.user as { role?: string } | undefined)?.role;
  if (role !== "admin") {
    return NextResponse.json(
      { error: "관리자만 숙소 상태를 변경할 수 있습니다." },
      { status: 403 }
    );
  }

  const { id } = await params;
  if (!id) {
    return NextResponse.json({ error: "id 필요" }, { status: 400 });
  }

  let body: { status?: string; rejectedReason?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "JSON 필요" }, { status: 400 });
  }

  const status = body.status;
  if (status !== "approved" && status !== "rejected") {
    return NextResponse.json(
      { error: "status는 approved 또는 rejected여야 합니다." },
      { status: 400 }
    );
  }

  const listing = await prisma.listing.findUnique({ where: { id } });
  if (!listing) {
    return NextResponse.json({ error: "숙소를 찾을 수 없습니다." }, { status: 404 });
  }

  const now = new Date();
  const rejectedReason =
    status === "rejected" && typeof body.rejectedReason === "string"
      ? body.rejectedReason.trim() || null
      : null;

  await prisma.listing.update({
    where: { id },
    data:
      status === "approved"
        ? { status: "approved", approvedAt: now, rejectedAt: null, rejectedReason: null }
        : {
            status: "rejected",
            rejectedAt: now,
            rejectedReason,
            approvedAt: null,
          },
  });

  const hostUserId = listing.userId;
  if (hostUserId) {
    createNotification({
      userId: hostUserId,
      type: status === "approved" ? "listing_approved" : "listing_rejected",
      title:
        status === "approved"
          ? `숙소 "${listing.title}"가 승인되어 게재되었습니다.`
          : rejectedReason
            ? `숙소 "${listing.title}" 등록이 거절되었습니다. 사유: ${rejectedReason}`
            : `숙소 "${listing.title}" 등록이 거절되었습니다.`,
      linkPath: "/host/listings",
      linkLabel: "내 숙소 보기",
      listingId: id,
    }).catch((err) => console.error("[admin listing status] createNotification", err));
  }

  return NextResponse.json({ ok: true, status });
}
