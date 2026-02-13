import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getListingById, updateListing, deleteListing } from "@/lib/listings";

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
    const result = await updateListing(
      id,
      userId,
      {
        title: body.title,
        location: body.location,
        description: body.description,
        mapUrl: body.mapUrl,
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
        categoryId: body.categoryId,
        amenityIds: body.amenityIds,
        icalImportUrls: body.icalImportUrls,
        userId: body.userId,
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
 * 숙소 삭제 (호스트 본인만)
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
  const result = await deleteListing(id, userId);
  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: 400 });
  }
  return NextResponse.json({ ok: true });
}
