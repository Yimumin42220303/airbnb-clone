/**
 * [LISTING_CARD:classic] → ID 기반 + [BLOG_COMPARE] → ID 목록
 * Post.body만 UPDATE
 */
import "dotenv/config";
import { PrismaClient } from "@prisma/client";

const SLUG = "shinjuku-family-accommodation-guide";

const CARDS = {
  classic: {
    id: "cmo74q3da004e5uv4wdnqo3sy",
    for: "4~8인 대가족·3대 가족·두 가족 동반 여행",
    reason: "최대 8명·침실 2개·침대 7개로 한 숙소에 함께 머물기 좋고, 니시신주쿠고초메역 도보 5분",
    caution: "엘리베이터·세탁기 여부는 예약 전 상세페이지에서 확인",
  },
  apartment: {
    id: "cmo74ef3l00345uv4hafvr7l7",
    for: "3~5인 가족·아이 1~2명·신주쿠 중심 접근성 중시",
    reason: "히가시신주쿠역 도보 5분, 31㎡·침대 4개로 3~5인 가족에 맞는 구성",
    caution: "호텔보다 넓은 공간이 필요한지 일정·짐 양과 함께 비교",
  },
  riverside: {
    id: "cmpbamgil0001m9motgb7aptv",
    for: "3~4인 가족·친구 가족·생활 편의시설 활용",
    reason: "다카다노바바역 도보 6분, 주방·세탁기·건조기 등 가족 여행 편의",
    caution: "4층·엘리베이터 없음 — 유모차·큰 캐리어 동반 시 확인",
  },
  asahi: {
    id: "cmncytjx30001mvd6qszlltf5",
    for: "2~3인 소가족·부부+아이 1명·역 접근성 최우선",
    reason: "히가시신주쿠역 도보 3분, 엘리베이터·욕조·세탁·건조기",
    caution: "4인 이상·분리 침실 필요 시 다른 숙소와 비교",
  },
};

function cardShortcode(key) {
  const c = CARDS[key];
  return `[LISTING_CARD:${c.id}|${c.for}|${c.reason}|${c.caution}]`;
}

const COMPARE_IDS = Object.values(CARDS)
  .map((c) => c.id)
  .join(",");

function transform(body) {
  let b = body;
  for (const key of Object.keys(CARDS)) {
    b = b.replace(new RegExp(`\\[LISTING_CARD:${key}\\]`, "gi"), cardShortcode(key));
  }
  b = b.replace(/\[BLOG_COMPARE(?::[^\]]*)?\]/gi, `[BLOG_COMPARE:${COMPARE_IDS}]`);
  return b;
}

const prisma = new PrismaClient();
const post = await prisma.post.findFirst({ where: { slug: SLUG } });
if (!post) {
  console.error("not found");
  process.exit(1);
}
const next = transform(post.body);
if (next !== post.body) {
  await prisma.post.update({ where: { id: post.id }, data: { body: next } });
  console.log("migrated", SLUG);
} else {
  console.log("already migrated");
}
await prisma.$disconnect();
