#!/usr/bin/env node
/**
 * what-is-tokyominbak 블로그 글 발행 (Post INSERT 또는 UPDATE).
 * Post 테이블만 대상. 예약·숙소·유저 등 다른 데이터 변경 없음.
 */
const fs = require("fs");
const path = require("path");
require("dotenv").config({ path: path.join(__dirname, "..", ".env") });

const SLUG = "what-is-tokyominbak";
const TITLE = "도쿄민박이란? 한국인을 위한 도쿄 현지 숙소 예약 플랫폼";
const CATEGORY = "guide";
const EXCERPT =
  "도쿄민박은 한국인을 위한 도쿄 현지 숙소 예약 플랫폼입니다. 예약 전 문의, 체크인 안내, 숙박 중 문제 접수, 환불·민원 접수까지 한국어로 직접 운영대응하며, 도쿄 여행자가 더 안심하고 숙소를 선택할 수 있도록 돕습니다.";
const BODY_PATH = path.join(__dirname, "content", "what-is-tokyominbak-body.md");
const COVER_IMAGE =
  "https://res.cloudinary.com/doqmedazc/image/upload/v1780070151/blog/nudjlvquzvkiyiyn2llb.png";

async function resolveAuthorId(prisma) {
  const existing = await prisma.post.findFirst({
    where: { publishedAt: { not: null } },
    orderBy: { publishedAt: "desc" },
    select: { authorId: true },
  });
  if (existing?.authorId) return existing.authorId;

  const admin = await prisma.user.findFirst({
    where: { role: "admin" },
    select: { id: true },
  });
  if (admin) return admin.id;

  const anyUser = await prisma.user.findFirst({ select: { id: true } });
  if (!anyUser) throw new Error("authorId를 찾을 수 없습니다 (User 없음)");
  return anyUser.id;
}

async function main() {
  if (!fs.existsSync(BODY_PATH)) {
    console.error("[publish-tokyominbak] 본문 없음:", BODY_PATH);
    process.exit(1);
  }
  const body = fs.readFileSync(BODY_PATH, "utf8").replace(/\r\n/g, "\n").trim();
  const { PrismaClient } = require("@prisma/client");
  const prisma = new PrismaClient();

  const existing = await prisma.post.findUnique({ where: { slug: SLUG } });
  const authorId = existing?.authorId ?? (await resolveAuthorId(prisma));

  let post;
  if (existing) {
    post = await prisma.post.update({
      where: { id: existing.id },
      data: {
        title: TITLE,
        excerpt: EXCERPT,
        body,
        category: CATEGORY,
        coverImage: COVER_IMAGE,
        publishedAt: existing.publishedAt ?? new Date(),
      },
    });
    console.log("[publish-tokyominbak] 기존 글 업데이트");
  } else {
    post = await prisma.post.create({
      data: {
        authorId,
        title: TITLE,
        slug: SLUG,
        excerpt: EXCERPT,
        body,
        category: CATEGORY,
        coverImage: COVER_IMAGE,
        publishedAt: new Date(),
      },
    });
    console.log("[publish-tokyominbak] 신규 글 발행");
  }

  console.log("  id:", post.id);
  console.log("  url: https://tokyominbak.net/blog/" + post.slug);
  console.log("  category:", post.category);
  console.log("  publishedAt:", post.publishedAt?.toISOString());
  console.log("  body:", body.length, "자");
  console.log("  excerpt:", EXCERPT.length, "자");
  console.log("\n  캐시: /blog, /blog/" + SLUG + " (revalidate 최대 약 1분, middleware no-store)");
  await prisma.$disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
