#!/usr/bin/env node
/**
 * 운영 DB·핵심 데이터 손상 여부 읽기 전용 점검.
 * UPDATE/DELETE 없음.
 */
const path = require("path");
require("dotenv").config({ path: path.join(__dirname, "..", ".env") });

async function main() {
  const { PrismaClient } = require("@prisma/client");
  const prisma = new PrismaClient();

  const [users, listings, bookings, posts, bookingByStatus] = await Promise.all([
    prisma.user.count(),
    prisma.listing.count(),
    prisma.booking.count(),
    prisma.post.count(),
    prisma.booking.groupBy({ by: ["status"], _count: { _all: true } }),
  ]);

  const shibuya = await prisma.post.findUnique({
    where: { slug: "shibuya-ku-area-guide" },
    select: {
      id: true,
      slug: true,
      title: true,
      publishedAt: true,
      category: true,
      excerpt: true,
      updatedAt: true,
      body: true,
    },
  });

  const otherPosts = await prisma.post.findMany({
    where: { slug: { not: "shibuya-ku-area-guide" } },
    select: { slug: true, updatedAt: true },
    orderBy: { updatedAt: "desc" },
    take: 5,
  });

  console.log("=== DB counts (read-only) ===");
  console.log("User:", users);
  console.log("Listing:", listings);
  console.log("Booking (all):", bookings);
  console.log("Booking by status:", bookingByStatus.map((b) => `${b.status}:${b._count._all}`).join(", "));
  console.log("Post:", posts);

  if (shibuya) {
    console.log("\n=== shibuya post only (expected sole content change) ===");
    console.log("id:", shibuya.id);
    console.log("publishedAt:", shibuya.publishedAt?.toISOString() ?? null);
    console.log("category:", shibuya.category);
    console.log("updatedAt:", shibuya.updatedAt.toISOString());
    console.log("excerpt len:", shibuya.excerpt?.length ?? 0);
    console.log("body len:", shibuya.body.length);
    console.log("has markdown links:", shibuya.body.includes("](/trust)"));
    console.log("no plain trust URL:", !shibuya.body.includes("https://tokyominbak.net/trust"));
  } else {
    console.log("\n[WARN] shibuya-ku-area-guide post missing");
  }

  console.log("\n=== other posts (updatedAt, should be unchanged by shibuya script) ===");
  otherPosts.forEach((p) =>
    console.log(`  ${p.slug.slice(0, 40)}  updated: ${p.updatedAt.toISOString()}`)
  );

  await prisma.$disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
