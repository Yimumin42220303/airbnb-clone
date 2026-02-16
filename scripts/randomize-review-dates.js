/**
 * 리뷰 게시일(createdAt)을 2023-12-01 ~ 2026-02-28 범위 내 무작위로 재설정합니다.
 * - 표시 순서: 게시일 최신순(이미 getListingById에서 orderBy createdAt desc 적용됨)
 *
 * 사용:
 *   node scripts/randomize-review-dates.js          → 전체 숙소의 모든 리뷰
 *   node scripts/randomize-review-dates.js <id>     → 해당 숙소 리뷰만
 *
 * 프로덕션 DB 적용:
 *   DATABASE_URL="postgresql://..." node scripts/randomize-review-dates.js
 *   또는 .env.production 등 프로덕션 URL 로드 후 실행
 */
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

const LISTING_ID_ARG = process.argv[2]; // 없으면 전체
const START = new Date("2023-12-01T00:00:00.000Z").getTime();
const END = new Date("2026-02-28T23:59:59.999Z").getTime();

function randomDateInRange() {
  const ts = START + Math.random() * (END - START);
  return new Date(Math.floor(ts));
}

async function processReviews(reviews) {
  if (reviews.length === 0) return 0;
  const used = new Set();
  for (const r of reviews) {
    let d = randomDateInRange();
    while (used.has(d.getTime())) {
      d = randomDateInRange();
    }
    used.add(d.getTime());
    await prisma.review.update({
      where: { id: r.id },
      data: { createdAt: d },
    });
  }
  return reviews.length;
}

async function main() {
  const where = LISTING_ID_ARG ? { listingId: LISTING_ID_ARG } : {};
  const reviews = await prisma.review.findMany({
    where,
    select: { id: true, listingId: true },
    orderBy: { id: "asc" },
  });

  if (reviews.length === 0) {
    console.log(
      LISTING_ID_ARG
        ? "해당 숙소에 리뷰가 없습니다. listingId: " + LISTING_ID_ARG
        : "DB에 리뷰가 없습니다."
    );
    return;
  }

  if (LISTING_ID_ARG) {
    const n = await processReviews(reviews);
    console.log("총", n, "개 리뷰의 게시일을 재설정했습니다. (숙소:", LISTING_ID_ARG + ")");
    return;
  }

  // 전체: 숙소별로 묶어서 처리 (숙소 내 중복 일시 방지)
  const byListing = new Map();
  for (const r of reviews) {
    if (!byListing.has(r.listingId)) byListing.set(r.listingId, []);
    byListing.get(r.listingId).push(r);
  }

  let total = 0;
  for (const [listingId, list] of byListing) {
    const n = await processReviews(list);
    total += n;
    console.log("숙소", listingId, "->", n, "개 리뷰 재설정");
  }
  console.log("총", total, "개 리뷰의 게시일을 재설정했습니다. (숙소", byListing.size, "개)");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
