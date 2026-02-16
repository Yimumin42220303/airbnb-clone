import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { isDevSkipAuth } from "@/lib/dev-auth";
import { prisma } from "@/lib/prisma";
import { getListings, type ListingFilters } from "@/lib/listings";
import { createListing } from "@/lib/listings";

/**
 * GET /api/listings
 * 쿼리: location, guests, minPrice, maxPrice, checkIn, checkOut (모두 선택)
 */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const location = searchParams.get("location") ?? undefined;
    const guests = searchParams.get("guests");
    const minPrice = searchParams.get("minPrice");
    const maxPrice = searchParams.get("maxPrice");
    const checkIn = searchParams.get("checkIn") ?? undefined;
    const checkOut = searchParams.get("checkOut") ?? undefined;

    const filters: ListingFilters = {};
    if (location) filters.location = location;
    if (guests) {
      const n = parseInt(guests, 10);
      if (!isNaN(n)) filters.guests = n;
    }
    if (minPrice) {
      const n = parseInt(minPrice, 10);
      if (!isNaN(n)) filters.minPrice = n;
    }
    if (maxPrice) {
      const n = parseInt(maxPrice, 10);
      if (!isNaN(n)) filters.maxPrice = n;
    }
    if (checkIn) filters.checkIn = checkIn;
    if (checkOut) filters.checkOut = checkOut;

    const listings = await getListings(
      Object.keys(filters).length > 0 ? filters : undefined
    );
    return NextResponse.json(listings);
  } catch (error) {
    console.error("GET /api/listings", error);
    return NextResponse.json(
      { error: "숙소 목록을 불러오지 못했습니다." },
      { status: 500 }
    );
  }
}

/**
 * POST /api/listings
 * 숙소 등록: 로그인한 호스트는 본인 소유로만 등록 가능.
 * 관리자는 body.userId로 다른 호스트에게 할당 가능 (일괄 등록 등).
 */
export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    const sessionUserId = (session as { userId?: string } | null)?.userId;
    const role = (session?.user as { role?: string } | undefined)?.role;
    const isAdmin = role === "admin";

    if (!sessionUserId) {
      return NextResponse.json(
        { error: "로그인 후 숙소를 등록할 수 있습니다." },
        { status: 401 }
      );
    }

    let targetUserId = sessionUserId;
    if (isDevSkipAuth() && sessionUserId === "dev-skip-auth") {
      const firstUser = await prisma.user.findFirst({
        where: { role: "admin" },
        select: { id: true },
      });
      if (!firstUser) {
        return NextResponse.json(
          { error: "관리자 계정이 없습니다. DB에 role이 admin인 사용자를 추가해 주세요." },
          { status: 403 }
        );
      }
      targetUserId = firstUser.id;
    }

    const body = await request.json();

    // 관리자만 다른 호스트에게 숙소 할당 가능
    if (body.userId != null && body.userId !== targetUserId) {
      if (!isAdmin) {
        return NextResponse.json(
          { error: "본인 소유의 숙소만 등록할 수 있습니다." },
          { status: 403 }
        );
      }
      targetUserId = body.userId;
    }

    // isPromoted(프로모션대상)는 관리자만 설정 가능
    const isPromoted = isAdmin && body.isPromoted === true ? true : false;

    const result = await createListing(targetUserId, {
      title: body.title,
      location: body.location,
      description: body.description,
      mapUrl: body.mapUrl,
      pricePerNight: body.pricePerNight,
      cleaningFee: body.cleaningFee,
      baseGuests: body.baseGuests,
      maxGuests: body.maxGuests,
      extraGuestFee: body.extraGuestFee,
      imageUrl: body.imageUrl,
      imageUrls: body.imageUrls,
      bedrooms: body.bedrooms,
      beds: body.beds,
      baths: body.baths,
      categoryId: body.categoryId,
      amenityIds: body.amenityIds,
      isPromoted,
      cancellationPolicy: ["flexible", "moderate", "strict"].includes(body.cancellationPolicy) ? body.cancellationPolicy : "flexible",
      propertyType: body.propertyType,
    });

    if (!result.ok) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }
    return NextResponse.json(result.listing, { status: 201 });
  } catch (error) {
    console.error("POST /api/listings", error);
    return NextResponse.json(
      { error: "숙소 등록 중 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}
