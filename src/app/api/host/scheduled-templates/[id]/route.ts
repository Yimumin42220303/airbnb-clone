import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const VALID_TRIGGERS = ["booking_confirmed", "before_checkin", "after_checkin", "before_checkout", "after_checkout"];

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  const userId = (session as { userId?: string } | null)?.userId;
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const existing = await prisma.scheduledMessageTemplate.findUnique({ where: { id } });
  if (!existing || existing.hostId !== userId) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const body = await request.json();
  const data: Record<string, unknown> = {};

  if (body.title !== undefined) data.title = String(body.title).trim();
  if (body.body !== undefined) data.body = String(body.body).trim();
  if (body.trigger !== undefined && VALID_TRIGGERS.includes(body.trigger)) data.trigger = body.trigger;
  if (body.offsetDays !== undefined) data.offsetDays = Math.max(0, parseInt(body.offsetDays) || 0);
  if (body.sendTime !== undefined && /^\d{2}:\d{2}$/.test(body.sendTime)) data.sendTime = body.sendTime;
  if (body.enabled !== undefined) data.enabled = !!body.enabled;

  const listingIds = Array.isArray(body.listingIds)
    ? body.listingIds.filter((id: unknown): id is string => typeof id === "string")
    : undefined;

  if (listingIds !== undefined) {
    await prisma.scheduledMessageTemplateListing.deleteMany({ where: { templateId: id } });
    if (listingIds.length > 0) {
      const count = await prisma.listing.count({
        where: { id: { in: listingIds }, userId },
      });
      if (count !== listingIds.length) {
        return NextResponse.json({ error: "숙소를 찾을 수 없습니다." }, { status: 404 });
      }
      await prisma.scheduledMessageTemplateListing.createMany({
        data: listingIds.map((listingId: string) => ({ templateId: id, listingId })),
      });
    }
  }

  const updated = await prisma.scheduledMessageTemplate.update({
    where: { id },
    data,
    include: {
      templateListings: {
        include: { listing: { select: { id: true, title: true, hostDisplayName: true } } },
      },
    },
  });

  return NextResponse.json({
    ...updated,
    listingIds: updated.templateListings.map((tl) => tl.listingId),
    listings: updated.templateListings.map((tl) => ({
      id: tl.listing.id,
      title: tl.listing.hostDisplayName?.trim() || tl.listing.title,
    })),
    templateListings: undefined,
  });
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  const userId = (session as { userId?: string } | null)?.userId;
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const existing = await prisma.scheduledMessageTemplate.findUnique({ where: { id } });
  if (!existing || existing.hostId !== userId) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  await prisma.scheduledMessageTemplate.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
