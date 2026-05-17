import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getListingById, updateListing, deleteListing } from "@/lib/listings";
import { prisma } from "@/lib/prisma";

/**
 * GET /api/listings/[id]
 * 숙소 상세
 */
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const listing = await getListingById(id);
    if (!listing) {
      return NextResponse.json(
        { error: "숙소를 찾을 수 없습니다." },
        { status: 404 }
      );
    }
    return NextResponse.json(listing);
  } catch (error) {
    console.error("GET /api/listings/[id]", error);
    return NextResponse.json(
      { error: "숙소 정보를 불러오지 못했습니다." },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/listings/[id]
 * 숙소 수정 (호스트 본인만)
 */
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    const userId = (session as { userId?: string } | null)?.userId;
    const role = (session?.user as { role?: string } | undefined)?.role;
    const isAdmin = role === "admin";
    if (!userId) {
      return NextResponse.json(
        { error: "로그인 후 수정할 수 있습니다." },
        { status: 401 }
      );
    }
    const { id } = await params;
    const body = await request.json();
    if (body.userId != null && !isAdmin) {
      return NextResponse.json(
        { error: "호스트 변경은 관리자만 가능합니다." },
        { status: 403 }
      );
    }
    // isPromoted(프로모션대상)는 관리자만 설정 가능. 호스트는 변경 불가(undefined로 유지)
    const isPromoted = isAdmin && body.isPromoted != null ? body.isPromoted : undefined;
    // Beds24 Account Key 도 관리자만 변경 가능 (일반 호스트 요청은 undefined 로 유지 → 기존 값 보존)
    const beds24AccountKey = isAdmin && body.beds24AccountKey !== undefined ? body.beds24AccountKey : undefined;
    const result = await updateListing(
      id,
      userId,
      {
        title: body.title,
        hostDisplayName: body.hostDisplayName,
        location: body.location,
        description: body.description,
        mapUrl: body.mapUrl,
        videoUrl: body.videoUrl,
        pricePerNight: body.pricePerNight,
        cleaningFee: body.cleaningFee,
        baseGuests: body.baseGuests,
        maxGuests: body.maxGuests,
        extraGuestFee: body.extraGuestFee,
        januaryFactor: body.januaryFactor,
        februaryFactor: body.februaryFactor,
        marchFactor: body.marchFactor,
        aprilFactor: body.aprilFactor,
        mayFactor: body.mayFactor,
        juneFactor: body.juneFactor,
        julyFactor: body.julyFactor,
        augustFactor: body.augustFactor,
        septemberFactor: body.septemberFactor,
        octoberFactor: body.octoberFactor,
        novemberFactor: body.novemberFactor,
        decemberFactor: body.decemberFactor,
        imageUrl: body.imageUrl,
        imageUrls: body.imageUrls,
        bedrooms: body.bedrooms,
        beds: body.beds,
        baths: body.baths,
        areaSqm: body.areaSqm != null ? (body.areaSqm > 0 ? Number(body.areaSqm) : null) : undefined,
        bathroomToiletSeparate: body.bathroomToiletSeparate,
        isPromoted,
        cancellationPolicy: body.cancellationPolicy,
        houseRules: body.houseRules,
        categoryId: body.categoryId,
        amenityIds: body.amenityIds,
        icalImportUrls: body.icalImportUrls,
        beds24Enabled: body.beds24Enabled,
        beds24PropId: body.beds24PropId,
        beds24RoomId: body.beds24RoomId,
        beds24AccountKey,
        beds24PriceMultiplier:
          body.beds24PriceMultiplier != null
            ? (() => {
                const v = Number(body.beds24PriceMultiplier);
                return !isNaN(v) && v > 0 ? v : undefined;
              })()
            : undefined,
        beds24JanuaryFactor: body.beds24JanuaryFactor != null ? Number(body.beds24JanuaryFactor) : undefined,
        beds24FebruaryFactor: body.beds24FebruaryFactor != null ? Number(body.beds24FebruaryFactor) : undefined,
        beds24MarchFactor: body.beds24MarchFactor != null ? Number(body.beds24MarchFactor) : undefined,
        beds24AprilFactor: body.beds24AprilFactor != null ? Number(body.beds24AprilFactor) : undefined,
        beds24MayFactor: body.beds24MayFactor != null ? Number(body.beds24MayFactor) : undefined,
        beds24JuneFactor: body.beds24JuneFactor != null ? Number(body.beds24JuneFactor) : undefined,
        beds24JulyFactor: body.beds24JulyFactor != null ? Number(body.beds24JulyFactor) : undefined,
        beds24AugustFactor: body.beds24AugustFactor != null ? Number(body.beds24AugustFactor) : undefined,
        beds24SeptemberFactor: body.beds24SeptemberFactor != null ? Number(body.beds24SeptemberFactor) : undefined,
        beds24OctoberFactor: body.beds24OctoberFactor != null ? Number(body.beds24OctoberFactor) : undefined,
        beds24NovemberFactor: body.beds24NovemberFactor != null ? Number(body.beds24NovemberFactor) : undefined,
        beds24DecemberFactor: body.beds24DecemberFactor != null ? Number(body.beds24DecemberFactor) : undefined,
        instantBooking: body.instantBooking,
        hidden: body.hidden,
        minStayNights: body.minStayNights,
        maxStayNights: body.maxStayNights,
        checkInTime: body.checkInTime,
        checkOutTime: body.checkOutTime,
        userId: body.userId,
        propertyType: body.propertyType,
      },
      { isAdmin: isAdmin || undefined }
    );
    if (!result.ok) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("PATCH /api/listings/[id]", err);
    return NextResponse.json(
      { error: "숙소 수정 중 오류가 발생했습니다. 잠시 후 다시 시도해 주세요." },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/listings/[id]
 * 숙소 삭제 (호스트 본인 또는 어드민)
 */
export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  const userId = (session as { userId?: string } | null)?.userId;
  if (!userId) {
    return NextResponse.json(
      { error: "로그인 후 삭제할 수 있습니다." },
      { status: 401 }
    );
  }
  const { id } = await params;
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { role: true },
  });
  const isAdmin = user?.role === "admin";
  const result = await deleteListing(id, userId, isAdmin);
  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: 400 });
  }
  return NextResponse.json({ ok: true });
}
