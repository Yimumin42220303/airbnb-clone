/**
 * 한국인 게스트 맞춤 편의시설을 DB에 추가합니다.
 * 기존 데이터는 유지하고, 없는 편의시설만 추가합니다.
 * 더 이상 사용하지 않는 항목은 숙소 연결이 없을 때만 삭제합니다.
 *
 * 사용법: node scripts/add-airbnb-amenities.js
 * (DATABASE_URL 환경변수 필요. .env 또는 .env.local 사용)
 */
require("dotenv").config({ path: ".env.local" });
require("dotenv").config({ path: ".env" });

const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

// 한국인 게스트가 도쿄 민박/숙소에서 중요하게 체크하는 편의시설
const AMENITIES = [
  // ===== 인터넷/통신 =====
  "무료 WiFi",
  "포켓 WiFi 대여",

  // ===== 냉난방 =====
  "에어컨",
  "난방",
  "공기청정기",
  "가습기",
  "선풍기",

  // ===== 욕실 =====
  "욕조 (바스타브)",
  "샤워실",
  "비데",
  "수건",
  "바디워시",
  "샴푸 / 린스",
  "치약 / 칫솔",
  "헤어드라이어",
  "화장지",

  // ===== 주방/식사 =====
  "주방 (취사 가능)",
  "냉장고",
  "전자레인지",
  "전기포트",
  "밥솥",
  "식기세트",
  "조리기구",
  "정수기",

  // ===== 세탁 =====
  "세탁기",
  "건조기",
  "세탁용 세제",
  "다리미",

  // ===== 침실/생활 =====
  "침대",
  "이불 / 침구류",
  "옷걸이",
  "수납공간 (클로젯)",

  // ===== 가전/엔터 =====
  "TV",
  "넷플릭스 / OTT",

  // ===== 교통/위치 =====
  "역세권 (도보 5분 이내)",
  "무료 주차",
  "자전거 대여",

  // ===== 편의/접근성 =====
  "엘리베이터",
  "셀프 체크인",
  "키패드 / 스마트락",
  "전용 출입구",
  "편의점 도보권",
  "한국어 안내문",

  // ===== 안전 =====
  "화재경보기",
  "소화기",
  "구급상자",
  "일산화탄소 경보기",

  // ===== 야외/부대 =====
  "발코니 / 베란다",
  "테라스",
  "BBQ 시설",

  // ===== 가족/아이 =====
  "아기침대",
  "유아용 식기",
  "어린이 안전장치",

  // ===== 반려동물 =====
  "반려동물 동반 가능",

  // ===== 일본 특화 (한국인 관심사항) =====
  "온천 / 대욕장",
  "유카타 제공",
  "슬리퍼 제공",
  "우산 대여",
  "짐 보관 서비스",
  "한국어 가능 호스트",
  "공항 픽업 가능",
  "관광지도 / 가이드북",
  "110V 콘센트 (한국 플러그 호환)",
  "변압기 / 어댑터 제공",
];

async function main() {
  console.log("한국인 게스트 맞춤 편의시설 업데이트 중...\n");

  let added = 0;
  let existing = 0;

  for (const name of AMENITIES) {
    const result = await prisma.amenity.upsert({
      where: { name },
      update: {},
      create: { name },
    });
    const isNew = result.name === name;
    if (isNew) added++;
    else existing++;
    console.log(`  [${added + existing}/${AMENITIES.length}] ${name}`);
  }

  // 새 목록에 없는 기존 편의시설 중 숙소 연결이 없는 것만 정리
  const allAmenities = await prisma.amenity.findMany();
  let removed = 0;
  for (const amenity of allAmenities) {
    if (!AMENITIES.includes(amenity.name)) {
      const usageCount = await prisma.listingAmenity.count({
        where: { amenityId: amenity.id },
      });
      if (usageCount === 0) {
        await prisma.amenity.delete({ where: { id: amenity.id } });
        console.log(`  [삭제] ${amenity.name} (미사용)`);
        removed++;
      } else {
        console.log(`  [유지] ${amenity.name} (${usageCount}개 숙소에서 사용 중)`);
      }
    }
  }

  console.log(`\n✅ 완료: ${AMENITIES.length}개 편의시설 등록, ${removed}개 미사용 항목 삭제`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
