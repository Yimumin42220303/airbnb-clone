import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { isDevSkipAuth } from "@/lib/dev-auth";
import { getAdminUser } from "@/lib/admin";
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
 * 숙소 등록은 관리자(admin)만 가능. 비관리자 호출 시 403.
 */
export async function POST(request: Request) {
  try {
    const admin = await getAdminUser();
    if (!admin) {
      return NextResponse.json(
        { error: "관리자만 숙소를 등록할 수 있습니다." },
        { status: 403 }
      );
    }
    const userId = admin.id;
    if (userId === "dev-skip-auth" && isDevSkipAuth()) {
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
      const body = await request.json();
      const result = await createListing(firstUser.id, {
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
      });
      if (!result.ok) {
        return NextResponse.json({ error: result.error }, { status: 400 });
      }
      return NextResponse.json(result.listing, { status: 201 });
    }

    const body = await request.json();
    const result = await createListing(userId, {
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
