import { NextResponse } from "next/server";
import { getAdminUser } from "@/lib/admin";
import { prisma } from "@/lib/prisma";
import { DEFAULT_AMENITY_NAMES } from "@/lib/default-amenity-names";

/**
 * GET /api/admin/amenities - 전체 편의시설 목록 조회
 */
export async function GET() {
  const admin = await getAdminUser();
  if (!admin) {
    return NextResponse.json({ error: "관리자 권한이 필요합니다." }, { status: 403 });
  }
  const amenities = await prisma.amenity.findMany({
    orderBy: { name: "asc" },
    include: { _count: { select: { listings: true } } },
  });
  return NextResponse.json(amenities);
}

/** 문자열 배열로 두어 DB·API에서 조회된 name과 includes 비교 시 타입이 맞습니다. */
const AMENITIES: string[] = [...DEFAULT_AMENITY_NAMES];

/**
 * POST /api/admin/amenities - 편의시설 일괄 업데이트 (관리자 전용)
 * body: { action: "sync" } - 새 목록 기준으로 동기화
 */
export async function POST(request: Request) {
  const admin = await getAdminUser();
  if (!admin) {
    return NextResponse.json({ error: "관리자 권한이 필요합니다." }, { status: 403 });
  }

  const body = await request.json();
  if (body.action !== "sync") {
    return NextResponse.json({ error: "action: 'sync' 필요" }, { status: 400 });
  }

  let added = 0;
  // 새 편의시설 추가
  for (const name of AMENITIES) {
    const existing = await prisma.amenity.findUnique({ where: { name } });
    if (!existing) {
      await prisma.amenity.create({ data: { name } });
      added++;
    }
  }

  // 미사용 기존 편의시설 정리
  let removed = 0;
  const removedNames: string[] = [];
  const keptNames: string[] = [];
  const allAmenities = await prisma.amenity.findMany();
  for (const amenity of allAmenities) {
    if (!AMENITIES.includes(amenity.name)) {
      const usageCount = await prisma.listingAmenity.count({
        where: { amenityId: amenity.id },
      });
      if (usageCount === 0) {
        await prisma.amenity.delete({ where: { id: amenity.id } });
        removedNames.push(amenity.name);
        removed++;
      } else {
        keptNames.push(`${amenity.name} (${usageCount}개 숙소)`);
      }
    }
  }

  return NextResponse.json({
    ok: true,
    total: AMENITIES.length,
    added,
    removed,
    removedNames,
    keptNames,
  });
}
