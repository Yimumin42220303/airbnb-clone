#!/usr/bin/env node
/**
 * sitemap.xml / robots.txt 프로덕션 검수 (읽기 전용 GET)
 * 사용: node scripts/verify-sitemap.mjs [baseUrl]
 */
const BASE = (process.argv[2] || "https://tokyominbak.net").replace(/\/$/, "");

const FORBIDDEN = [
  "/messages",
  "/mypage",
  "/wishlist",
  "/admin",
  "/api",
  "/auth",
  "/booking",
  "/my-bookings",
  "/notifications",
  "blog.naver.com",
  "localhost",
  "vercel.app",
  "www.tokyominbak.net",
];

const REQUIRED_STATIC = [
  "/",
  "/search",
  "/about",
  "/trust",
  "/policy",
  "/agreement",
  "/recommend",
  "/blog",
];

async function fetchText(path) {
  const res = await fetch(`${BASE}${path}`, {
    headers: { "User-Agent": "sitemap-verify/1.0" },
  });
  return { status: res.status, text: await res.text(), ct: res.headers.get("content-type") || "" };
}

function extractLocs(xml) {
  return [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1].trim());
}

async function main() {
  console.log(`\n=== Sitemap/Robots verify: ${BASE} ===\n`);

  const sitemap = await fetchText("/sitemap.xml");
  console.log("sitemap.xml:", sitemap.status, sitemap.ct, `${Buffer.byteLength(sitemap.text, "utf8")} bytes`);

  const robots = await fetchText("/robots.txt");
  console.log("robots.txt:", robots.status, robots.ct);

  const locs = extractLocs(sitemap.text);
  const urls = new Set(locs);
  console.log("\nURL count:", locs.length, "unique:", urls.size);

  let failed = false;

  for (const path of REQUIRED_STATIC) {
    const expected = path === "/" ? BASE : `${BASE}${path}`;
    const ok = locs.some((u) => u === expected || u === `${expected}/`);
    console.log(ok ? "OK" : "FAIL", "static", expected);
    if (!ok) failed = true;
  }

  const blogPosts = locs.filter((u) => u.includes("/blog/") && u !== `${BASE}/blog`);
  const listings = locs.filter((u) => u.includes("/listing/"));
  console.log("\nBlog posts in sitemap:", blogPosts.length);
  console.log("Listings in sitemap:", listings.length);

  if (blogPosts.length < 1) {
    console.log("FAIL: no /blog/{slug} URLs");
    failed = true;
  }
  if (listings.length < 1) {
    console.log("FAIL: no /listing/{id} URLs");
    failed = true;
  }

  for (const forbidden of FORBIDDEN) {
    const hit = locs.filter((u) => u.includes(forbidden));
    if (hit.length) {
      console.log("FAIL forbidden pattern", forbidden, "->", hit.slice(0, 3));
      failed = true;
    } else {
      console.log("OK absent", forbidden);
    }
  }

  const external = locs.filter((u) => !u.startsWith(BASE));
  if (external.length) {
    console.log("FAIL external/non-canonical URLs:", external.slice(0, 5));
    failed = true;
  } else {
    console.log("OK all URLs under", BASE);
  }

  if (locs.length !== urls.size) {
    console.log("FAIL duplicate URLs detected");
    failed = true;
  } else {
    console.log("OK no duplicate URLs");
  }

  const hasLastmod = (sitemap.text.match(/<lastmod>/g) || []).length;
  console.log("\nlastmod tags:", hasLastmod);
  if (hasLastmod < locs.length) {
    console.log("WARN: some entries may lack lastmod (Next.js may use lastModified)");
  }

  const sitemapLine = robots.text.split("\n").find((l) => l.toLowerCase().startsWith("sitemap:"));
  console.log("\nrobots Sitemap line:", sitemapLine?.trim() || "(missing)");
  if (!sitemapLine?.includes(`${BASE}/sitemap.xml`)) {
    console.log("FAIL robots.txt missing correct Sitemap directive");
    failed = true;
  }

  console.log(failed ? "\nRESULT: FAIL" : "\nRESULT: PASS");
  process.exit(failed ? 1 : 0);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
