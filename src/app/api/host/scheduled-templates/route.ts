import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const VALID_TRIGGERS = ["booking_confirmed", "before_checkin", "after_checkin", "before_checkout", "after_checkout"];

export async function GET() {
  const session = await getServerSession(authOptions);
  const userId = (session as { userId?: string } | null)?.userId;
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const templates = await prisma.scheduledMessageTemplate.findMany({
    where: { hostId: userId },
    orderBy: { createdAt: "asc" },
    include: {
      templateListings: {
        include: { listing: { select: { id: true, title: true, hostDisplayName: true } } },
      },
    },
  });

  return NextResponse.json(
    templates.map((t) => ({
      ...t,
      listingIds: t.templateListings.map((tl) => tl.listingId),
      listings: t.templateListings.map((tl) => ({
        id: tl.listing.id,
        title: tl.listing.hostDisplayName?.trim() || tl.listing.title,
      })),
      templateListings: undefined,
    }))
  );
}

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  const userId = (session as { userId?: string } | null)?.userId;
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json();
  const { title, body: msgBody, trigger, offsetDays, sendTime, listingIds, enabled } = body;

  if (!title?.trim() || !msgBody?.trim()) {
    return NextResponse.json({ error: "제목과 본문은 필수입니다." }, { status: 400 });
  }
  if (!VALID_TRIGGERS.includes(trigger)) {
    return NextResponse.json({ error: "유효하지 않은 트리거입니다." }, { status: 400 });
  }

  const ids = Array.isArray(listingIds) ? listingIds.filter((id): id is string => typeof id === "string") : [];
  if (ids.length > 0) {
    const count = await prisma.listing.count({ where: { id: { in: ids }, userId } });
    if (count !== ids.length) {
      return NextResponse.json({ error: "숙소를 찾을 수 없습니다." }, { status: 404 });
    }
  }

  const template = await prisma.scheduledMessageTemplate.create({
    data: {
      hostId: userId,
      title: title.trim(),
      body: msgBody.trim(),
      trigger,
      offsetDays: Math.max(0, parseInt(offsetDays) || 0),
      sendTime: /^\d{2}:\d{2}$/.test(sendTime) ? sendTime : "10:00",
      enabled: enabled !== false,
      ...(ids.length > 0 && {
        templateListings: { create: ids.map((listingId) => ({ listingId })) },
      }),
    },
    include: {
      templateListings: {
        include: { listing: { select: { id: true, title: true, hostDisplayName: true } } },
      },
    },
  });

  return NextResponse.json(
    {
      ...template,
      listingIds: template.templateListings.map((tl) => tl.listingId),
      listings: template.templateListings.map((tl) => ({
        id: tl.listing.id,
        title: tl.listing.hostDisplayName?.trim() || tl.listing.title,
      })),
      templateListings: undefined,
    },
    { status: 201 }
  );
}
