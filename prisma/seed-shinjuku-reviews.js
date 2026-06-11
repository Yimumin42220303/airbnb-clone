/**
 * 신주쿠 다카다노바바 숙소 리뷰 등록 스크립트
 * 에어비앤비 원본 리뷰 → 한국인 게스트 자연스러운 한국어로 리라이트
 *
 * 실행: node prisma/seed-shinjuku-reviews.js
 */

const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

const LISTING_ID = "cmq9e7b4500017xha4jsxng3h";

// 에어비앤비 원본 리뷰를 한국인 게스트 시점으로 자연스럽게 리라이트
const reviews = [
  {
    authorDisplayName: "재윤",
    rating: 5,
    body: "도쿄 현지 감성 제대로 느낄 수 있는 숙소예요. 일본 특유의 미니멀한 공간 구조라 처음엔 좁게 느껴질 수 있는데, 막상 생활해보면 동선이 잘 짜여 있어서 불편함이 없었어요. 욕실이랑 화장실이 분리되어 있어서 여러 명이 써도 편하고, 친구들끼리 단기로 묵기에 딱 맞는 구조였습니다. 호스트분도 연락이 정말 빠르고 친절하게 응대해주셔서 좋았어요. 신주쿠까지 전철로 5분이라 접근성도 완벽하고요. 가성비 숙소 찾으시는 분들께 강력 추천합니다!",
    createdAt: "2026-04-15",
  },
  {
    authorDisplayName: "원종",
    rating: 5,
    body: "가격 대비 정말 만족스러웠어요. 근처에 먹을 곳도 많고 편의점도 가까워서 생활하기 편했습니다. 다음에 도쿄 오면 또 이용할 것 같아요.",
    createdAt: "2026-05-21",
  },
  {
    authorDisplayName: "Kansa",
    rating: 5,
    body: "며칠 지내면서 정말 집처럼 편안하게 쉴 수 있었어요. 신주쿠 지역에서 이 가격에 이 퀄리티면 가성비는 최고라고 생각해요. 역에서 가까워서 이동도 너무 편리했고, 근처에 자판기랑 24시 슈퍼마켓도 있어서 생활하기 좋았습니다. 방이 아늑하고 아담해서 소그룹 여행에 딱 맞았고, 호스트분이 연락도 빠르고 여러모로 도움을 많이 주셨어요. 다음에 도쿄 오면 여기 또 예약할 것 같습니다!",
    createdAt: "2026-05-10",
  },
  {
    authorDisplayName: "ליהי",
    rating: 4,
    body: "위치가 정말 좋았어요. 역이랑 가까워서 이동이 편리하고 주변 편의시설도 충분했습니다. 묵는 중에 작은 문제가 생겼는데 호스트분이 바로 연락되고 신속하게 해결해주셔서 불편함 없이 지낼 수 있었어요. 공간이 넓진 않아서 4명이 지내면 조금 빡빡할 수 있는데, 2~3명이라면 충분히 편하게 쓸 수 있을 것 같습니다. 전반적으로 만족스러운 숙박이었습니다.",
    createdAt: "2026-06-04",
  },
];

async function main() {
  // 1. admin 계정 조회
  const admin = await prisma.user.findFirst({
    where: { role: "admin" },
    select: { id: true, email: true },
  });

  if (!admin) {
    throw new Error("admin 계정을 찾을 수 없습니다.");
  }
  console.log("✅ admin 계정:", admin.email);

  // 2. 숙소 존재 확인
  const listing = await prisma.listing.findUnique({
    where: { id: LISTING_ID },
    select: { id: true, title: true },
  });

  if (!listing) {
    throw new Error(`숙소를 찾을 수 없습니다: ${LISTING_ID}\n먼저 seed-shinjuku-listing.js를 실행해주세요.`);
  }
  console.log("✅ 숙소 확인:", listing.title);

  // 3. 기존 리뷰 초기화 (재실행 시 중복 방지)
  const existing = await prisma.review.count({ where: { listingId: LISTING_ID } });
  if (existing > 0) {
    await prisma.review.deleteMany({ where: { listingId: LISTING_ID } });
    console.log(`🗑  기존 리뷰 ${existing}개 삭제 후 재등록`);
  }

  // 4. 리뷰 등록
  for (const r of reviews) {
    await prisma.review.create({
      data: {
        listingId: LISTING_ID,
        userId: admin.id,
        rating: r.rating,
        body: r.body,
        authorDisplayName: r.authorDisplayName,
        createdAt: new Date(r.createdAt),
      },
    });
    console.log(`✅ 리뷰 등록: ${r.authorDisplayName} (★${r.rating})`);
  }

  console.log(`\n🎉 완료! ${reviews.length}개 리뷰 등록`);
  console.log(`👉 확인: https://tokyominbak.net/listing/${LISTING_ID}`);
}

main()
  .catch((e) => {
    console.error("❌ 오류:", e.message);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
