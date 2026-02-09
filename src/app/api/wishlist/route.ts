import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

/**
 * GET /api/wishlist
 * 내 위시리스트 목록 (listing id 배열 또는 상세)
 */
export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions);
  const userId = (session as { userId?: string } | null)?.userId;
  if (!userId) {
    return NextResponse.json({ listingIds: [], listings: [] });
  }

  const full = request.nextUrl.searchParams.get("full") === "1";

  if (full) {
    const items = await prisma.wishlist.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      include: {
        listing: {
          include: {
            images: { orderBy: { sortOrder: "asc" }, take: 1 },
            reviews: true,
          },
        },
      },
    });
    const listings = items.map((w) => {
      const l = w.listing;
      const imageUrl =
        l.images.length > 0 ? l.images[0].url : l.imageUrl;
      const reviewCount = l.reviews.length;
      const rating =
        reviewCount > 0
          ? l.reviews.reduce((s, r) => s + r.rating, 0) / reviewCount
          : null;
      return {
        id: l.id,
        title: l.title,
        location: l.location,
        imageUrl,
        price: l.pricePerNight,
        rating: rating !== null ? Math.round(rating * 100) / 100 : undefined,
        reviewCount: reviewCount > 0 ? reviewCount : undefined,
      };
    });
    return NextResponse.json({ listings });
  }

  const items = await prisma.wishlist.findMany({
    where: { userId },
    select: { listingId: true },
  });
  return NextResponse.json({
    listingIds: items.map((i) => i.listingId),
  });
}

/**
 * POST /api/wishlist
 * body: { listingId } — 토글 (있으면 제거, 없으면 추가)
 */
export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  const userId = (session as { userId?: string } | null)?.userId;
  if (!userId) {
    return NextResponse.json(
      { error: "로그인 후 이용할 수 있습니다." },
      { status: 401 }
    );
  }

  const body = await request.json();
  const listingId = body.listingId;
  if (!listingId || typeof listingId !== "string") {
    return NextResponse.json(
      { error: "listingId가 필요합니다." },
      { status: 400 }
    );
  }

  const listing = await prisma.listing.findUnique({
    where: { id: listingId },
  });
  if (!listing) {
    return NextResponse.json(
      { error: "숙소를 찾을 수 없습니다." },
      { status: 404 }
    );
  }

  const existing = await prisma.wishlist.findUnique({
    where: {
      userId_listingId: { userId, listingId },
    },
  });

  if (existing) {
    await prisma.wishlist.delete({
      where: { id: existing.id },
    });
    return NextResponse.json({ saved: false });
  }

  await prisma.wishlist.create({
    data: { userId, listingId },
  });
  return NextResponse.json({ saved: true });
}
