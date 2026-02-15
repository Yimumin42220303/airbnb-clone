/**
 * minbak.tokyo에서 가져온 숙소 11개 삭제
 * 사용법: node scripts/delete-minbak-tokyo-listings.js
 */

require("dotenv").config({ path: ".env" });
require("dotenv").config({ path: ".env.local" });

const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

const MINBAK_TOKYO_TITLES = [
  "[다카다노바바역 도보6분]|리버사이드_신주쿠|〜4인・31㎡ 여유로운 공간",
  "[신주쿠 10분] 도심 속 힐링, 통창 햇살이 가득한 감성 로프트 아파트",
  "[신축/무료건조기] 야마노테선 다카다노바바 도보권, 신주쿠/시부야 최적의 접근성",
  "[Wide-Stay] 후지산 아트와 모던함이 공존하는 도쿄의 은신처 (신주쿠 5분)",
  "가족 여행 추천! 이케부쿠로 인근 2층 독채 스테이 (최대 6인/오츠카역 근처)",
  "시부야역 도보 10분! 도심 한복판에서 즐기는 세련된 감성 스테이",
  "도쿄 여행의 최중심! 신주쿠 30㎡ 넓은 객실 | 취사 가능·무료 세탁기 (최대 5인)",
  "(독채사용&셀프체크인)도쿄타워, 아자부다이힐즈 도보거리! 쾌적한 5인실 독채 Asahistay-Roppongi",
  "[High-Floor] 신주쿠 야경이 보이는 발코니 | 히가시신주쿠역 도보 3분 & 세탁건조기 완비",
  "도쿄 로컬 감성 가득한 아사쿠사 인근 숙소 | 혼조아즈마바시역 도보 8분 (건조기 완비)",
  "[Work & Stay] 듀얼 모니터 완비! 신주쿠 1정거장, 디지털 노마드를 위한 완벽한 아지트",
];

async function main() {
  const result = await prisma.listing.deleteMany({
    where: { title: { in: MINBAK_TOKYO_TITLES } },
  });
  console.log(`✅ minbak.tokyo 숙소 ${result.count}개 삭제 완료`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
