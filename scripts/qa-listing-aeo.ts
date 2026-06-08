/**
 * 숙소 AEO 자동 생성 결과 검수 스크립트 (read-only).
 *
 * 사용:
 *   npx dotenv -e .env -- npx tsx scripts/qa-listing-aeo.ts
 * 또는:
 *   node --import tsx scripts/qa-listing-aeo.ts
 *
 * - DB에 쓰기 작업을 절대 수행하지 않는다.
 * - 모든 approved & not hidden 숙소에 대해 AEO 생성 결과를 출력한다.
 */

/* eslint-disable @typescript-eslint/no-explicit-any */
import fs from "node:fs";
import path from "node:path";
import { PrismaClient } from "@prisma/client";
import {
  buildListingAeo,
  buildListingH1,
  buildListingTitle,
  buildListingMetaDescription,
  buildAutoFaq,
  buildSuitabilityNotices,
  buildRecommendedForBullets,
  buildLodgingJsonLd,
  buildBreadcrumbJsonLd,
  buildFaqJsonLd,
  type AeoListingInput,
} from "@/lib/aeo";

const prisma = new PrismaClient();

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || "https://tokyominbak.net";

// UTF-8 파일에 직접 쓰기 위한 출력 버퍼 (Windows PowerShell 콘솔 인코딩 회피)
const OUTPUT_FILE = path.resolve(process.cwd(), "qa-aeo-output.md");
const lines: string[] = [];
const log = (...args: any[]) => {
  lines.push(args.map((a) => (typeof a === "string" ? a : String(a))).join(" "));
};

type Row = {
  id: string;
  title: string;
  location: string;
  mainArea: string | null;
  nearestStation: string | null;
  walkMinutes: number | null;
  maxGuests: number;
  bedrooms: number;
  beds: number;
  floorSize: number | null;
  rating: number | null;
  reviewCount: number;
  h1: string;
  title_meta: string;
  description_meta: string;
  recommendedFor: string[];
  faqQuestions: string[];
  notices: string[];
  suspectLocation: boolean;
  suspectReason: string[];
};

function isSuspectLocation(raw: string, parsed: { nearestStation: string | null; walkMinutes: number | null }): { suspect: boolean; reasons: string[] } {
  const reasons: string[] = [];
  // walkMinutes가 채워졌는데 location 원문에 "도보" 또는 "徒歩"가 없으면 의심.
  if (parsed.walkMinutes != null) {
    if (!raw.includes("도보") && !raw.includes("徒歩")) {
      reasons.push(`walkMinutes(${parsed.walkMinutes}) 추출됐으나 원문에 '도보'/'徒歩' 없음`);
    }
  }
  // nearestStation은 "도보 N분" 패턴 매칭으로만 채워지도록 보수화됨 → walkMinutes와 동시에만 존재해야 함.
  if (parsed.nearestStation && parsed.walkMinutes == null) {
    reasons.push("nearestStation 단독 추출 (도보 분 없음)");
  }
  return { suspect: reasons.length > 0, reasons };
}

function pad(s: string, n: number): string {
  if (s.length >= n) return s;
  return s + " ".repeat(n - s.length);
}

async function main() {
  const listings = await prisma.listing.findMany({
    where: { status: "approved", hidden: false },
    include: {
      listingAmenities: { include: { amenity: true } },
      reviews: { select: { rating: true, body: true } },
      images: { orderBy: { sortOrder: "asc" }, take: 1 },
    },
    orderBy: { createdAt: "asc" },
  });

  console.log(`\n[QA] approved & visible 숙소 ${listings.length}건 검수 시작\n`);

  const rows: Row[] = [];
  for (const l of listings) {
    const reviewCount = l.reviews.length;
    const ratingAvg =
      reviewCount > 0
        ? l.reviews.reduce((s, r) => s + r.rating, 0) / reviewCount
        : null;
    const rating = ratingAvg != null ? Math.round(ratingAvg * 100) / 100 : null;

    const aeoInput: AeoListingInput = {
      id: l.id,
      title: l.title,
      location: l.location,
      description: l.description,
      imageUrl: l.imageUrl,
      pricePerNight: l.pricePerNight,
      maxGuests: l.maxGuests,
      baseGuests: l.baseGuests ?? 2,
      bedrooms: l.bedrooms,
      beds: l.beds,
      baths: l.baths,
      areaSqm: l.areaSqm,
      bathroomToiletSeparate: l.bathroomToiletSeparate,
      propertyType: l.propertyType,
      amenities: l.listingAmenities.map((la: any) => la.amenity.name),
      rating,
      reviewCount,
      minStayNights: l.minStayNights,
      maxStayNights: l.maxStayNights,
      checkInTime: l.checkInTime,
      checkOutTime: l.checkOutTime,
    };

    const aeo = buildListingAeo(aeoInput);
    const h1 = buildListingH1(aeoInput, aeo);
    const titleMeta = buildListingTitle(aeoInput, aeo);
    const description = buildListingMetaDescription(aeoInput, aeo);
    const faq = buildAutoFaq(aeoInput, aeo);
    const recommended = buildRecommendedForBullets(aeo);
    const notices = buildSuitabilityNotices(aeoInput, aeo);
    const sus = isSuspectLocation(l.location, aeo.parsedLocation);

    rows.push({
      id: l.id,
      title: l.title,
      location: l.location,
      mainArea: aeo.parsedLocation.mainArea,
      nearestStation: aeo.parsedLocation.nearestStation,
      walkMinutes: aeo.parsedLocation.walkMinutes,
      maxGuests: l.maxGuests,
      bedrooms: l.bedrooms,
      beds: l.beds,
      floorSize: l.areaSqm,
      rating,
      reviewCount,
      h1,
      title_meta: titleMeta,
      description_meta: description,
      recommendedFor: recommended,
      faqQuestions: faq.map((f) => f.q),
      notices,
      suspectLocation: sus.suspect,
      suspectReason: sus.reasons,
    });
  }

  // 1) 요약 테이블 (Markdown 형식 - UTF-8 파일에 직접 저장)
  log(`# 숙소 AEO 자동 생성 검수 (총 ${rows.length}건)\n`);
  log("\n## 1. 숙소별 AEO 요약\n");
  for (const r of rows) {
    log(`\n### ${r.title}`);
    log(``);
    log(`- listingId: \`${r.id}\``);
    log(`- 원본 location: \`${r.location}\``);
    log(`- mainArea: ${r.mainArea ?? "(미매칭)"}`);
    log(`- nearestStation: ${r.nearestStation ?? "(미매칭)"}`);
    log(`- walkMinutes: ${r.walkMinutes ?? "(미매칭)"}`);
    log(`- maxGuests / bedrooms / beds: ${r.maxGuests} / ${r.bedrooms} / ${r.beds}`);
    log(`- floorSize(㎡): ${r.floorSize ?? "(미설정)"}`);
    log(`- rating / reviews: ${r.rating ?? "(없음)"} / ${r.reviewCount}`);
    log(`- H1: **${r.h1}**`);
    log(`- meta title: ${r.title_meta}`);
    log(`- meta description: ${r.description_meta}`);
    log(`- recommendedFor:`);
    r.recommendedFor.forEach((x) => log(`  - ${x}`));
    log(`- FAQ 질문 목록:`);
    r.faqQuestions.forEach((x) => log(`  - ${x}`));
    log(`- suitability notice 목록:`);
    r.notices.forEach((x) => log(`  - ${x}`));
    if (r.suspectLocation) {
      log(`- ⚠ 위치 추출 의심: ${r.suspectReason.join(" | ")}`);
    }
  }

  // 2) 위치 파싱 의심 숙소
  log("\n\n## 2. 위치 파싱 의심 숙소\n");
  const suspects = rows.filter((r) => r.suspectLocation);
  if (suspects.length === 0) {
    log("의심 숙소 없음. 모든 위치 추출 결과가 보수 조건을 통과했습니다.\n");
    log("- '도보' 또는 '徒歩' 표현이 있는 숙소만 nearestStation/walkMinutes를 채웁니다.");
    log("- 단순 '○○역' 표기는 nearestStation에 채우지 않습니다 (도보/차/전철 거리 불분명).");
  } else {
    for (const r of suspects) {
      log(` - \`${r.id}\` | "${r.location}" → station=${r.nearestStation}, walk=${r.walkMinutes}min  // ${r.suspectReason.join(" | ")}`);
    }
  }
  void pad;

  // 3) 대표 JSON-LD 3개: 2~3인 / 4인 가족·친구 / 5인 이상 그룹
  log("\n\n## 3. 대표 JSON-LD 샘플 3개\n");

  const cat23 = listings.find((l) => l.maxGuests >= 2 && l.maxGuests <= 3);
  const cat4 = listings.find(
    (l) => l.maxGuests === 4 && l.bedrooms >= 1 && l.beds >= 2
  );
  const cat5 = listings.find((l) => l.maxGuests >= 5);

  const buildAeoForSample = (l: any) => {
    const reviewCount = l.reviews.length;
    const ratingAvg =
      reviewCount > 0
        ? l.reviews.reduce((s: number, r: any) => s + r.rating, 0) / reviewCount
        : null;
    const rating = ratingAvg != null ? Math.round(ratingAvg * 100) / 100 : null;
    const inp: AeoListingInput = {
      id: l.id,
      title: l.title,
      location: l.location,
      description: l.description,
      imageUrl: l.imageUrl,
      pricePerNight: l.pricePerNight,
      maxGuests: l.maxGuests,
      baseGuests: l.baseGuests ?? 2,
      bedrooms: l.bedrooms,
      beds: l.beds,
      baths: l.baths,
      areaSqm: l.areaSqm,
      bathroomToiletSeparate: l.bathroomToiletSeparate,
      propertyType: l.propertyType,
      amenities: l.listingAmenities.map((la: any) => la.amenity.name),
      rating,
      reviewCount,
      minStayNights: l.minStayNights,
      maxStayNights: l.maxStayNights,
      checkInTime: l.checkInTime,
      checkOutTime: l.checkOutTime,
    };
    const aeo = buildListingAeo(inp);
    const meta = buildListingMetaDescription(inp, aeo);
    const faq = buildAutoFaq(inp, aeo);
    return {
      input: inp,
      aeo,
      lodging: buildLodgingJsonLd(
        { ...inp, rating, reviewCount },
        aeo,
        meta,
        l.reviews.map((r: any) => ({
          rating: r.rating,
          body: r.body,
          userName: null,
          createdAt: new Date().toISOString(),
        })),
        { baseUrl: BASE_URL, includeReviews: true, reviewLimit: 3 }
      ),
      breadcrumb: buildBreadcrumbJsonLd(inp, aeo, BASE_URL, {
        home: "홈",
        search: "숙소 검색",
      }),
      faq: buildFaqJsonLd(faq),
    };
  };

  const printSample = (label: string, l: any | undefined) => {
    log(`\n### ${label}\n`);
    if (!l) {
      log("(해당 조건에 맞는 숙소가 없습니다)");
      return;
    }
    const r = buildAeoForSample(l);
    log(`- listingId: \`${l.id}\``);
    log(`- title: ${l.title}`);
    log(`- max=${l.maxGuests} / beds=${l.beds} / bedrooms=${l.bedrooms} / area=${l.areaSqm}`);
    log(`- rating=${r.input.rating} / reviewCount=${r.input.reviewCount}`);
    log(`\n#### LodgingBusiness JSON-LD`);
    log("```json");
    log(JSON.stringify(r.lodging, null, 2));
    log("```");
    log(`\n#### BreadcrumbList JSON-LD`);
    log("```json");
    log(JSON.stringify(r.breadcrumb, null, 2));
    log("```");
    log(`\n#### FAQPage JSON-LD`);
    log("```json");
    log(JSON.stringify(r.faq, null, 2));
    log("```");
  };

  printSample("(A) 2~3인 중심지 숙소", cat23);
  printSample("(B) 4인 가족/친구 숙소", cat4);
  printSample("(C) 5인 이상 그룹 숙소", cat5);

  // 추가 검증: 리뷰가 없는 숙소의 JSON-LD에 aggregateRating/review가 들어가지 않는지 확인
  log(`\n\n## 4. 무리뷰 숙소 JSON-LD 검증 (aggregateRating/review 미출력 여부)\n`);
  const noReviewListings = listings.filter((l) => l.reviews.length === 0);
  if (noReviewListings.length === 0) {
    log("리뷰가 없는 숙소가 없습니다.");
  } else {
    for (const l of noReviewListings) {
      const r = buildAeoForSample(l);
      const ld = r.lodging as Record<string, unknown>;
      const hasAggregate = "aggregateRating" in ld;
      const hasReview = "review" in ld;
      log(`- \`${l.id}\` ${l.title}`);
      log(`  - reviewCount: ${l.reviews.length}`);
      log(`  - aggregateRating 키 존재? ${hasAggregate ? "❌ 출력됨 (문제)" : "✅ 미출력"}`);
      log(`  - review 키 존재? ${hasReview ? "❌ 출력됨 (문제)" : "✅ 미출력"}`);
    }
  }

  fs.writeFileSync(OUTPUT_FILE, lines.join("\n"), { encoding: "utf8" });
  // 콘솔 안내(영문/숫자만 사용 - PowerShell 인코딩 영향 없음)
  process.stdout.write(`\nQA report written: ${OUTPUT_FILE}\n`);
  process.stdout.write(`listings checked: ${rows.length}, suspects: ${suspects.length}\n`);

  await prisma.$disconnect();
}

main().catch(async (e) => {
  console.error(e);
  await prisma.$disconnect();
  process.exit(1);
});
