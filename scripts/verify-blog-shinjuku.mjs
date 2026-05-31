import "dotenv/config";
import { PrismaClient } from "@prisma/client";

const slug = "shinjuku-family-accommodation-guide";
const prisma = new PrismaClient();
const post = await prisma.post.findFirst({ where: { slug }, select: { body: true } });
const body = post?.body ?? "";

const listingLinks = [...new Set(body.match(/\/listing\/[a-z0-9]+/g) || [])];
const rawRecommend = /tokyominbak\.net\/recommend|↓나한테/.test(body);

console.log("body length:", body.length);
console.log("unique /listing/ links in markdown:", listingLinks.length, listingLinks);
console.log("raw recommend CTA in body:", rawRecommend);
console.log("[BLOG_COMPARE with ids]:", /\[BLOG_COMPARE:[^\]]+\]/.test(body));
console.log("[LISTING_CARD with cuid]:", /\[LISTING_CARD:c[a-z0-9]{20,}/i.test(body));
console.log("[LISTING_CARD] count:", (body.match(/\[LISTING_CARD:/g) || []).length);
console.log("linked IMG count:", (body.match(/\[IMG:[^\]]+\|listing:/g) || []).length);

await prisma.$disconnect();
