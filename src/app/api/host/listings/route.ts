import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

/**
 * GET /api/host/listings
 * 로그인 호스트의 숙소 목록
 */
export async function GET() {
  const session = await getServerSession(authOptions);
  const userId = (session as { userId?: string } | null)?.userId;
  if (!userId) {
    return NextResponse.json(
      { error: "로그인 후 이용할 수 있습니다." },
      { status: 401 }
    );
  }

  const listings = await prisma.listing.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      title: true,
      location: true,
      imageUrl: true,
      pricePerNight: true,
      maxGuests: true,
      _count: { select: { reviews: true } },
    },
  });

  return NextResponse.json(listings);
}
