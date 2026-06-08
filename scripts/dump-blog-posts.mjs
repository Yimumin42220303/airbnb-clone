/** 읽기 전용: 블로그 포스트 slug·제목·본문 점검 (수정 없음) */
import "dotenv/config";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
const posts = await prisma.post.findMany({
  orderBy: { createdAt: "desc" },
  select: {
    slug: true,
    title: true,
    excerpt: true,
    coverImage: true,
    category: true,
    publishedAt: true,
    body: true,
  },
});

const filter = process.argv[2];
for (const p of posts) {
  if (filter && p.slug !== filter) continue;
  const placeholders = [];
  for (const token of ["[이미지 삽입]", "[IMG:", "TODO", "[image]", "[사진]", "이미지 삽입"]) {
    if (p.body.includes(token)) placeholders.push(token);
  }
  const rawUrls = (p.body.match(/(^|\s)https?:\/\/[^\s)]+/gm) || []).length;
  console.log("──────────────────────────────────────────");
  console.log("slug:", p.slug);
  console.log("title:", p.title);
  console.log("published:", p.publishedAt ? p.publishedAt.toISOString().slice(0, 10) : "DRAFT");
  console.log("category:", p.category, "| cover:", p.coverImage ? "yes" : "NO");
  console.log("excerpt:", p.excerpt ? p.excerpt.slice(0, 80) : "(none)");
  console.log("bodyLen:", p.body.length, "| placeholders:", placeholders.join(",") || "none", "| rawUrlLines:", rawUrls);
  if (filter) {
    console.log("---- BODY ----");
    console.log(p.body);
  }
}
console.log("──────────────────────────────────────────");
console.log("total posts:", posts.length);
await prisma.$disconnect();
