/**
 * shinjuku-family-accommodation-guide 본문: 내부 링크·카드·비교표 shortcode 반영
 * Post.body만 UPDATE (예약/결제/스키마 무관)
 */
import "dotenv/config";
import { readFileSync } from "fs";
import { PrismaClient } from "@prisma/client";

const SLUG = "shinjuku-family-accommodation-guide";

const L = {
  classic: {
    id: "cmo74q3da004e5uv4wdnqo3sy",
    title: "2025년 4월 오픈 / 신주쿠 클래식 하우스",
    anchor: "신주쿠 클래식 하우스 자세히 보기",
    img: "rsd0g9ctnbtarr2kmdrw",
    alt: "신주쿠 클래식 하우스 거실과 침실",
  },
  apartment: {
    id: "cmo74ef3l00345uv4hafvr7l7",
    title: "신주쿠역 도보 거리 내의 편리한 아파트",
    anchor: "신주쿠역 도보 거리 내의 편리한 아파트 자세히 보기",
    img: "rygawqb6l3m9eobehqv6",
    alt: "신주쿠역 인근 패밀리 아파트 실내",
  },
  riverside: {
    id: "cmpbamgil0001m9motgb7aptv",
    title: "리버사이드_신주쿠",
    anchor: "리버사이드_신주쿠 자세히 보기",
    img: "zjbmoaabyqnvzt0qflan",
    alt: "리버사이드_신주쿠 거실",
  },
  asahi: {
    id: "cmncytjx30001mvd6qszlltf5",
    title: "AsahiStay -Shinjuku",
    anchor: "AsahiStay -Shinjuku 자세히 보기",
    img: "v4fru0au9ds4eovvdmkb",
    alt: "AsahiStay -Shinjuku 객실",
  },
};

function link(label, id) {
  return `[${label}](/listing/${id})`;
}

function transformBody(body) {
  let b = body;

  // raw URL / 중복 CTA 제거
  b = b.replace(/\n*↓나한테 딱 맞는 숙소 추천받기\s*\nhttps?:\/\/tokyominbak\.net\/recommend\s*/gi, "\n");
  b = b.replace(/\n*도쿄 숙소가 아직 고민된다면\?[\s\S]*?\/recommend\s*/gi, "\n");

  // 섹션 제목 → 앵커 링크
  b = b.replace(
    /^2025년 4월 오픈 \/ 신주쿠 클래식 하우스$/m,
    link(L.classic.anchor, L.classic.id)
  );
  b = b.replace(
    /^신주쿠역 도보 거리 내의 편리한 아파트$/m,
    link(L.apartment.anchor, L.apartment.id)
  );
  b = b.replace(/^리버사이드_신주쿠$/m, link(L.riverside.anchor, L.riverside.id));
  b = b.replace(/^AsahiStay -Shinjuku$/m, link(L.asahi.anchor, L.asahi.id));

  // 첫 등장 문장
  b = b.replace(
    "첫 번째로 추천하는 숙소는 2025년 4월 오픈 / 신주쿠 클래식 하우스입니다.",
    `첫 번째로 추천하는 숙소는 ${link(L.classic.anchor, L.classic.id)}입니다.`
  );
  b = b.replace(
    "두 번째 추천 숙소는 신주쿠역 도보 거리 내의 편리한 아파트입니다.",
    `두 번째 추천 숙소는 ${link(L.apartment.anchor, L.apartment.id)}입니다.`
  );
  b = b.replace(
    "세 번째 추천 숙소는 리버사이드_신주쿠입니다.",
    `세 번째 추천 숙소는 ${link(L.riverside.anchor, L.riverside.id)}입니다.`
  );
  b = b.replace(
    "네 번째 추천 숙소는 AsahiStay -Shinjuku입니다.",
    `네 번째 추천 숙소는 ${link(L.asahi.anchor, L.asahi.id)}입니다.`
  );

  // 세 번째·네 번째 섹션 소제목(본문 중) 링크
  b = b.replace(
    "세 번째 추천 숙소는 리버사이드_신주쿠입니다.\n\n이 숙소는",
    `세 번째 추천 숙소는 ${link(L.riverside.anchor, L.riverside.id)}입니다.\n\n이 숙소는`
  );

  // 인원별 요약 화살표 줄 → 링크
  b = b.replace(/^→ 신주쿠 클래식 하우스$/m, `→ ${link(L.classic.anchor, L.classic.id)}`);
  b = b.replace(
    /^→ 신주쿠역 도보 거리 내의 편리한 아파트$/m,
    `→ ${link(L.apartment.anchor, L.apartment.id)}`
  );
  b = b.replace(/^→ 리버사이드_신주쿠$/m, `→ ${link(L.riverside.anchor, L.riverside.id)}`);
  b = b.replace(/^→ AsahiStay -Shinjuku$/m, `→ ${link(L.asahi.anchor, L.asahi.id)}`);

  // 본문 내 숙소명 (첫 언급 외) — 리버사이드_신주쿠 단독 줄
  b = b.replace(
    /^리버사이드_신주쿠는 무료 Wi-Fi/m,
    `${link("리버사이드_신주쿠", L.riverside.id)}는 무료 Wi-Fi`
  );

  // 이미지 → listing 링크 + 고유 alt
  for (const key of Object.keys(L)) {
    const item = L[key];
    const re = new RegExp(
      `\\[IMG:([^\\]]*${item.img}[^\\]]*)\\]`,
      "g"
    );
    b = b.replace(
      re,
      `[IMG:$1|listing:${item.id}|${item.alt}]`
    );
  }

  // 카드 shortcode (섹션 소개 직후)
  if (!b.includes("[LISTING_CARD:classic]")) {
    b = b.replace(
      /(첫 번째로 추천하는 숙소는[^\n]+\n\n)(이 숙소는 4~8인)/,
      `$1[LISTING_CARD:classic]\n\n$2`
    );
  }
  if (!b.includes("[LISTING_CARD:apartment]")) {
    b = b.replace(
      /(두 번째 추천 숙소는[^\n]+\n\n)(이 숙소는 3~5인)/,
      `$1[LISTING_CARD:apartment]\n\n$2`
    );
  }
  if (!b.includes("[LISTING_CARD:riverside]")) {
    b = b.replace(
      /(세 번째 추천 숙소는[^\n]+\n\n)(이 숙소는 3~4인)/,
      `$1[LISTING_CARD:riverside]\n\n$2`
    );
  }
  if (!b.includes("[LISTING_CARD:asahi]")) {
    b = b.replace(
      /(네 번째 추천 숙소는[^\n]+\n\n)(이 숙소는 부부)/,
      `$1[LISTING_CARD:asahi]\n\n$2`
    );
  }

  // 비교표 shortcode
  if (!b.includes("[BLOG_COMPARE]")) {
    b = b.replace(
      /(가족여행 인원별 추천 정리\n\n가족 구성에 따라)/,
      "가족여행 인원별 추천 정리\n\n[BLOG_COMPARE]\n\n가족 구성에 따라"
    );
  }

  return b;
}

const prisma = new PrismaClient();
const post = await prisma.post.findFirst({ where: { slug: SLUG } });
if (!post) {
  console.error("Post not found");
  process.exit(1);
}

const nextBody = transformBody(post.body);
if (nextBody === post.body) {
  console.log("No changes needed");
} else {
  await prisma.post.update({
    where: { id: post.id },
    data: { body: nextBody },
  });
  console.log("Updated body length:", nextBody.length, "(was", post.body.length + ")");
}

await prisma.$disconnect();
