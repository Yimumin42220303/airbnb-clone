import { NextResponse } from "next/server";
import { getAdminUser } from "@/lib/admin";
import { prisma } from "@/lib/prisma";

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

// 한국인 게스트 맞춤 편의시설 목록
const AMENITIES = [
  "무료 WiFi", "포켓 WiFi 대여",
  "에어컨", "난방", "공기청정기", "가습기", "선풍기",
  "욕조 (바스타브)", "샤워실", "비데", "수건", "바디워시", "샴푸 / 린스", "치약 / 칫솔", "헤어드라이어", "화장지",
  "주방 (취사 가능)", "냉장고", "전자레인지", "전기포트", "밥솥", "식기세트", "조리기구", "정수기",
  "세탁기", "건조기", "세탁용 세제", "다리미",
  "침대", "이불 / 침구류", "옷걸이", "수납공간 (클로젯)",
  "TV", "넷플릭스 / OTT",
  "역세권 (도보 5분 이내)", "무료 주차", "자전거 대여",
  "엘리베이터", "셀프 체크인", "키패드 / 스마트락", "전용 출입구", "편의점 도보권", "한국어 안내문",
  "화재경보기", "소화기", "구급상자", "일산화탄소 경보기",
  "발코니 / 베란다", "테라스", "BBQ 시설",
  "아기침대", "유아용 식기", "어린이 안전장치",
  "반려동물 동반 가능",
  "온천 / 대욕장", "유카타 제공", "슬리퍼 제공", "우산 대여", "짐 보관 서비스",
  "한국어 가능 호스트", "공항 픽업 가능", "관광지도 / 가이드북",
  "110V 콘센트 (한국 플러그 호환)", "변압기 / 어댑터 제공",
];

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
