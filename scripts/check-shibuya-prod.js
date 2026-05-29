#!/usr/bin/env node
const fs = require("fs");
const path = require("path");
require("dotenv").config({ path: path.join(__dirname, "..", ".env") });

function dbHost(url) {
  if (!url) return "(none)";
  try {
    return new URL(url.replace(/^postgres:/, "http:")).hostname;
  } catch {
    return "(parse error)";
  }
}

async function main() {
  console.log("=== env ===");
  console.log("DATABASE_URL host:", dbHost(process.env.DATABASE_URL));
  console.log("VERCEL_PROJECT_ID:", process.env.VERCEL_PROJECT_ID?.slice(0, 12) + "...");

  const htmlPath = path.join(__dirname, "_tmp-prod2.html");
  const htmlPathFallback = path.join(__dirname, "_tmp-prod.html");
  const htmlFile = fs.existsSync(htmlPath)
    ? htmlPath
    : fs.existsSync(htmlPathFallback)
      ? htmlPathFallback
      : null;
  if (htmlFile) {
    const h = fs.readFileSync(htmlFile, "utf8");
    console.log("\n=== production HTML ===");
    console.log("dpl:", (h.match(/dpl_[a-zA-Z0-9]+/) || ["?"])[0]);
    console.log("old CTA (직접 검증):", h.includes("직접 검증"));
    console.log("new CTA:", h.includes("예약 전 문의부터 체크인 안내까지"));
    console.log("plain URL trust:", h.includes("https://tokyominbak.net/trust"));
    console.log('href="/trust":', (h.match(/href="\/trust"/g) || []).length);
    console.log("conversion block:", h.includes("시부야구 숙소를 찾고 있다면"));
    console.log("h3 시부야역:", h.includes("시부야역 주변: 도쿄의 활기"));
    console.log("FAQPage JSON-LD:", h.includes("FAQPage"));
    const types = [...h.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)]
      .map((m) => {
        try {
          return JSON.parse(m[1])["@type"];
        } catch {
          return "?";
        }
      });
    console.log("JSON-LD types:", types.join(", "));
    const mainIdx = h.indexOf("<main");
    const footerIdx = h.indexOf("<footer");
    console.log("main@footer:", mainIdx, footerIdx, "main first:", mainIdx > 0 && mainIdx < footerIdx);
  }

  const { PrismaClient } = require("@prisma/client");
  const prisma = new PrismaClient();
  const post = await prisma.post.findUnique({
    where: { slug: "shibuya-ku-area-guide" },
    select: { id: true, body: true, updatedAt: true },
  });
  if (!post) {
    console.log("\n=== DB: post NOT FOUND on this DATABASE_URL ===");
  } else {
    const b = post.body;
    console.log("\n=== DB (local .env) ===");
    console.log("updatedAt:", post.updatedAt.toISOString());
    console.log("has ](/trust):", b.includes("](/trust)"));
    console.log("plain https trust:", b.includes("https://tokyominbak.net/trust"));
    console.log("has ### 1.:", b.includes("### 1."));
    console.log("has ## 1. (wrong):", /^## 1\./m.test(b));
    console.log("conversion h2:", b.includes("## 시부야구 숙소를 찾고 있다면"));
    console.log("CRLF:", b.includes("\r\n"));
    console.log("body preview (trust line):");
    const lines = b.split(/\r?\n/).filter((l) => l.includes("trust") || l.includes("안심"));
    lines.slice(0, 5).forEach((l) => console.log(" ", l.slice(0, 100)));
  }
  await prisma.$disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
