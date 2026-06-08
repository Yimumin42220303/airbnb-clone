#!/usr/bin/env node
/**
 * shibuya-ku-area-guide 글 본문을 마크다운 구조로 재편집 (slug·publishedAt·category 유지).
 * Post.body / excerpt 만 UPDATE. 다른 테이블·행 삭제 없음.
 */
const fs = require("fs");
const path = require("path");
require("dotenv").config({ path: path.join(__dirname, "..", ".env") });

const SLUG = "shibuya-ku-area-guide";
const BODY_PATH = path.join(__dirname, "content", "shibuya-ku-area-guide-body.md");

const EXCERPT =
  "시부야구에서 숙소를 고를 때 시부야·하라주쿠·에비스·하타가야 등 지역별 특징, 교통·가격대 차이, 숙소 선택 체크리스트를 한눈에 정리했습니다. 도쿄민박에서 한국어로 시부야 인근 민박·숙소를 비교·예약할 때 참고하세요.";

async function main() {
  if (!fs.existsSync(BODY_PATH)) {
    console.error("[update-shibuya] 본문 파일 없음:", BODY_PATH);
    process.exit(1);
  }
  const body = fs.readFileSync(BODY_PATH, "utf8").replace(/\r\n/g, "\n").trim();
  const { PrismaClient } = require("@prisma/client");
  const prisma = new PrismaClient();

  const existing = await prisma.post.findUnique({ where: { slug: SLUG } });
  if (!existing) {
    console.error("[update-shibuya] 글 없음:", SLUG);
    process.exit(1);
  }

  await prisma.post.update({
    where: { id: existing.id },
    data: { body, excerpt: EXCERPT },
  });

  console.log("[update-shibuya] 완료");
  console.log("  slug:", existing.slug);
  console.log("  title:", existing.title);
  console.log("  category:", existing.category);
  console.log("  publishedAt:", existing.publishedAt?.toISOString() ?? "(초안)");
  console.log("  body 길이:", body.length, "자");
  console.log("  excerpt:", EXCERPT.length, "자");
  console.log("\n  운영 반영: /blog/" + SLUG + " (ISR revalidate 최대 약 5분)");
  await prisma.$disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
