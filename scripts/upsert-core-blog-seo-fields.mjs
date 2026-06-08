/**
 * 핵심 블로그 5개 SEO 필드 upsert (기본 --dry-run, --apply는 구현만·실행 금지).
 *
 *   node scripts/upsert-core-blog-seo-fields.mjs
 *   node scripts/upsert-core-blog-seo-fields.mjs --apply  # 운영 승인 전 실행하지 말 것
 */
import { PrismaClient } from "@prisma/client";

const apply = process.argv.includes("--apply");

const CORE_SLUGS = [
  "what-is-tokyominbak",
  "tokyo-minbak-vs-hotel",
  "shinjuku-family-accommodation-guide",
  "shibuya-ku-area-guide",
  "tokyo-travel-luggage-tips",
];

/** slug → 제안 SEO 필드 (title/slug/body 미변경) */
const PROPOSED = {
  "what-is-tokyominbak": {
    seoTitle: "도쿄민박이란?｜한국어 안내 도쿄 숙소 예약",
    metaDescription:
      "도쿄민박은 한국인을 위한 도쿄 현지 숙소 예약 플랫폼입니다. 예약 전 문의·체크인·숙박 중 문제를 한국어로 안내합니다.",
    focusKeyword: "도쿄민박",
    secondaryKeywords: "도쿄 민박, 도쿄 한인민박, 도쿄 숙소",
    coverImageAlt: "도쿄민박 서비스 소개 대표 이미지",
    coverImageCaption: "한국어로 안내하는 도쿄 현지 숙소 예약 플랫폼 도쿄민박",
    postType: "guide",
    primaryCtaLabel: "도쿄 숙소 추천받기",
    primaryCtaUrl: "/recommend",
    secondaryCtaLabel: "등록 숙소 검색",
    secondaryCtaUrl: "/search",
    relatedPostSlugs: "tokyo-minbak-vs-hotel,shibuya-ku-area-guide",
    relatedListingIds: "",
    noindex: false,
  },
  "tokyo-minbak-vs-hotel": {
    seoTitle: "도쿄 민박 vs 호텔｜가족·친구 숙소 선택",
    metaDescription:
      "도쿄 여행에서 민박과 호텔 중 무엇이 맞을까요? 인원·예산·짐·주방 필요 여부 기준으로 비교하고 도쿄 숙소를 고르는 방법을 정리했습니다.",
    focusKeyword: "도쿄 민박 vs 호텔",
    secondaryKeywords: "도쿄 숙소, 도쿄 가족 숙소, 도쿄 4인 숙소",
    coverImageAlt: "도쿄 민박과 호텔 비교 가이드 대표 이미지",
    coverImageCaption: "가족·친구 여행 숙소 선택을 위한 민박 vs 호텔 비교",
    postType: "guide",
    primaryCtaLabel: "4인 맞춤 숙소 추천",
    primaryCtaUrl: "/recommend",
    secondaryCtaLabel: "도쿄 4인 숙소 랜딩",
    secondaryCtaUrl: "/tokyo-4-person-accommodation",
    relatedPostSlugs: "what-is-tokyominbak,shinjuku-family-accommodation-guide",
    relatedListingIds: "",
    noindex: false,
  },
  "shinjuku-family-accommodation-guide": {
    seoTitle: "신주쿠 가족 숙소 추천｜4인·가족여행",
    metaDescription:
      "신주쿠 가족여행 숙소를 고를 때 인원·역 거리·침구·엘리베이터를 어떻게 볼지 정리했습니다. 신주쿠 인근 도쿄민박 등록 숙소도 함께 확인하세요.",
    focusKeyword: "신주쿠 가족 숙소",
    secondaryKeywords: "신주쿠 4인 숙소, 도쿄 가족 숙소, 신주쿠 숙소",
    coverImageAlt: "신주쿠 가족 여행 숙소 선택 가이드",
    coverImageCaption: "신주쿠·히가시신주쿠 인근 가족 숙소 비교 포인트",
    postType: "guide",
    primaryCtaLabel: "신주쿠 맞춤 숙소 추천",
    primaryCtaUrl: "/recommend",
    secondaryCtaLabel: "신주쿠 가족 숙소 랜딩",
    secondaryCtaUrl: "/shinjuku-family-accommodation",
    relatedPostSlugs: "tokyo-minbak-vs-hotel,tokyo-travel-luggage-tips",
    relatedListingIds: "",
    noindex: false,
  },
  "shibuya-ku-area-guide": {
    seoTitle: "시부야구 숙소 가이드｜지역별 선택법",
    metaDescription:
      "시부야·하라주쿠·에비스·하타가야 등 시부야구 숙소 위치를 비교할 때 알아야 할 교통·가격·동선 포인트를 정리했습니다.",
    focusKeyword: "시부야구 숙소",
    secondaryKeywords: "시부야 숙소, 하츠다이 숙소, 도쿄 숙소",
    coverImageAlt: "시부야구 지역별 도쿄 숙소 선택 가이드",
    coverImageCaption: "시부야구·하츠다이 인근 숙소 비교를 위한 지역 가이드",
    postType: "guide",
    primaryCtaLabel: "시부야 동선 맞춤 추천",
    primaryCtaUrl: "/recommend",
    secondaryCtaLabel: "시부야 지역 숙소 검색",
    secondaryCtaUrl: "/search?location=시부야",
    relatedPostSlugs: "what-is-tokyominbak,tokyo-minbak-vs-hotel",
    relatedListingIds: "",
    noindex: false,
  },
  "tokyo-travel-luggage-tips": {
    seoTitle: "도쿄 여행 짐 보관·코인락커 가이드",
    metaDescription:
      "공항 택배, 코인락커, 숙소 짐 맡기기까지 도쿄 여행 짐 문제를 줄이는 방법과 숙소 선택 팁을 정리했습니다.",
    focusKeyword: "도쿄 짐 보관",
    secondaryKeywords: "도쿄 코인락커, 도쿄 여행 짐, 빈손 여행",
    coverImageAlt: "도쿄 여행 캐리어와 짐 보관 안내",
    coverImageCaption: "도쿄 공항·역 코인락커와 택배 짐 보관 가이드",
    postType: "tips",
    primaryCtaLabel: "짐 동선 맞춤 숙소 추천",
    primaryCtaUrl: "/recommend",
    secondaryCtaLabel: "도쿄 가족 숙소 보기",
    secondaryCtaUrl: "/tokyo-family-accommodation",
    relatedPostSlugs: "shinjuku-family-accommodation-guide,tokyo-minbak-vs-hotel",
    relatedListingIds: "",
    noindex: false,
  },
};

const prisma = new PrismaClient();

function diffField(name, current, next) {
  const cur = current ?? "";
  const nxt = next ?? "";
  if (String(cur) === String(nxt)) return null;
  return { field: name, current: cur || "(empty)", next: nxt || "(empty)" };
}

async function main() {
  console.log(`핵심 블로그 SEO 필드 — mode: ${apply ? "APPLY" : "DRY-RUN"}\n`);
  if (apply) {
    console.error("❌ --apply는 이번 작업에서 실행하지 않습니다. dry-run 결과만 확인하세요.");
    process.exit(1);
  }

  const posts = await prisma.post.findMany({
    where: { slug: { in: CORE_SLUGS } },
    select: {
      id: true,
      slug: true,
      title: true,
      seoTitle: true,
      metaDescription: true,
      focusKeyword: true,
      secondaryKeywords: true,
      coverImageAlt: true,
      coverImageCaption: true,
      postType: true,
      primaryCtaLabel: true,
      primaryCtaUrl: true,
      secondaryCtaLabel: true,
      secondaryCtaUrl: true,
      relatedPostSlugs: true,
      relatedListingIds: true,
      noindex: true,
    },
  });

  for (const slug of CORE_SLUGS) {
    const post = posts.find((p) => p.slug === slug);
    const proposed = PROPOSED[slug];
    console.log(`\n▶ ${slug}`);
    if (!post) {
      console.log("  ❌ DB에 글 없음");
      continue;
    }
    if (!proposed) {
      console.log("  ❌ 제안 데이터 없음");
      continue;
    }
    const changes = [
      diffField("seoTitle", post.seoTitle, proposed.seoTitle),
      diffField("metaDescription", post.metaDescription, proposed.metaDescription),
      diffField("focusKeyword", post.focusKeyword, proposed.focusKeyword),
      diffField("secondaryKeywords", post.secondaryKeywords, proposed.secondaryKeywords),
      diffField("coverImageAlt", post.coverImageAlt, proposed.coverImageAlt),
      diffField("coverImageCaption", post.coverImageCaption, proposed.coverImageCaption),
      diffField("postType", post.postType, proposed.postType),
      diffField("primaryCtaLabel", post.primaryCtaLabel, proposed.primaryCtaLabel),
      diffField("primaryCtaUrl", post.primaryCtaUrl, proposed.primaryCtaUrl),
      diffField("secondaryCtaLabel", post.secondaryCtaLabel, proposed.secondaryCtaLabel),
      diffField("secondaryCtaUrl", post.secondaryCtaUrl, proposed.secondaryCtaUrl),
      diffField("relatedPostSlugs", post.relatedPostSlugs, proposed.relatedPostSlugs),
      diffField("relatedListingIds", post.relatedListingIds, proposed.relatedListingIds),
      diffField("noindex", post.noindex, proposed.noindex),
    ].filter(Boolean);

    if (changes.length === 0) {
      console.log("  ✅ 변경 없음 (이미 동일 또는 채워짐)");
    } else {
      for (const c of changes) {
        console.log(`  · ${c.field}: "${c.current}" → "${c.next}"`);
      }
    }
  }

  console.log("\n──────────────────────────────────────────");
  console.log("DB 쓰기 없음 (dry-run). CMS 수동 입력 또는 운영 승인 후 --apply 검토.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
