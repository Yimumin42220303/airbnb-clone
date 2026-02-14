/**
 * Airbnb 스타일 부가시설을 DB에 추가합니다.
 * 기존 데이터는 유지하고, 없는 부가시설만 추가합니다.
 *
 * 사용법: node scripts/add-airbnb-amenities.js
 * (DATABASE_URL 환경변수 필요. .env 또는 .env.local 사용)
 */
require("dotenv").config({ path: ".env.local" });
require("dotenv").config({ path: ".env" });

const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

// Airbnb 카테고리별 부가시설 (한국어)
const AIRBNB_AMENITIES = [
  // 필수/기본
  "WiFi",
  "에어컨",
  "난방",
  "세탁기",
  "건조기",
  "TV",
  "헤어드라이어",
  "다리미",
  "옷걸이",
  // 주방
  "주방",
  "냉장고",
  "전자레인지",
  "오븐",
  "식기세트",
  "조리기구",
  "커피메이커",
  "식당",
  // 욕실
  "샤워실",
  "욕조",
  "바디워시",
  "수건",
  "샴푸",
  "화장지",
  // 침실
  "침구류",
  "침대",
  // 주차/편의
  "무료 주차",
  "세차장",
  "엘리베이터",
  // 안전
  "화재경보기",
  "일산화탄소 경보기",
  "구급상자",
  "소화기",
  "안전 카메라",
  // 야외
  "발코니",
  "야외 테라스",
  "정원",
  "BBQ 그릴",
  "수영장",
  "온수 욕조",
  // 업무/가족
  "업무 공간",
  "조용한 공간",
  "아기침대",
  "유아용품",
  // 체크인/기타
  "키패드 체크인",
  "셀프 체크인",
  "세탁용 세제",
  "온수",
  "전용 출입구",
  "반려동물 동반 가능",
];

async function main() {
  console.log("Airbnb 스타일 부가시설 추가 중...");
  let added = 0;
  for (const name of AIRBNB_AMENITIES) {
    await prisma.amenity.upsert({
      where: { name },
      update: {},
      create: { name },
    });
    added++;
    console.log(`  ${added}/${AIRBNB_AMENITIES.length}: ${name}`);
  }
  console.log(`\n✅ 완료: ${AIRBNB_AMENITIES.length}개 부가시설 추가/확인됨`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
