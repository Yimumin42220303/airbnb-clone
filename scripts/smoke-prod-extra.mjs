#!/usr/bin/env node
const BASE = "https://tokyominbak.net";

async function get(path) {
  const r = await fetch(`${BASE}${path}`, {
    headers: { "User-Agent": "tokyominbak-smoke-extra/1.0" },
  });
  return { status: r.status, text: await r.text() };
}

async function main() {
  console.log("=== SEO / content checks ===\n");
  for (const p of ["/", "/policy", "/about", "/trust", "/blog", "/messages", "/mypage", "/wishlist"]) {
    const { status, text } = await get(p);
    const title = text.match(/<title[^>]*>([^<]+)/i)?.[1]?.trim();
    const robots = text.match(/name="robots" content="([^"]+)/i)?.[1];
    console.log(`${p} [${status}]`);
    console.log(`  title: ${title?.slice(0, 90) ?? "(none)"}`);
    if (robots) console.log(`  robots: ${robots}`);
  }

  console.log("\n=== Policy wording ===");
  const policy = await get("/policy");
  console.log("  has '현재 사이트에 스크립트':", policy.text.includes("현재 사이트에 스크립트"));
  console.log("  has analytics soft wording:", policy.text.includes("서비스 이용 통계") || policy.text.includes("분석"));

  console.log("\n=== Blog content tone ===");
  const blog = await get("/blog/what-is-tokyominbak");
  console.log("  status:", blog.status);
  console.log("  '직접 운영대응':", blog.text.includes("직접 운영대응"));

  console.log("\n=== Auth-gated pages body hints ===");
  for (const p of ["/admin", "/host/calendar", "/booking/fake-id/pay"]) {
    const { status, text } = await get(p);
    const loginHint =
      text.includes("로그인") ||
      text.includes("signin") ||
      text.includes("Sign in") ||
      text.includes("auth/signin");
    console.log(`${p} [${status}] login/signin hint: ${loginHint}`);
  }

  console.log("\n=== Invalid listing ===");
  const bad = await get("/listing/nonexistent-id-xyz");
  console.log("  status:", bad.status);
  console.log("  not-found page:", bad.text.includes("찾을 수") || bad.text.includes("not found") || bad.text.includes("404"));

  console.log("\n=== robots.txt / sitemap ===");
  const robots = await get("/robots.txt");
  console.log("  robots.txt lines:", robots.text.trim().split("\n").slice(0, 6).join(" | "));
  const sitemap = await get("/sitemap.xml");
  console.log("  sitemap status:", sitemap.status, "has url:", sitemap.text.includes("<url>"));
}

main().catch(console.error);
