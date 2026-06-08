/**
 * 오가닉 SEO QA — /search, listing, 랜딩, sitemap, robots (read-only HTTP).
 *
 *   QA_BASE=https://tokyominbak.net node scripts/qa-organic-seo.mjs
 *   QA_BASE=http://localhost:3000 node scripts/qa-organic-seo.mjs
 */
const BASE = (process.env.QA_BASE || "https://tokyominbak.net").replace(/\/$/, "");

const LANDING_PATHS = [
  "/tokyo-family-accommodation",
  "/tokyo-4-person-accommodation",
  "/tokyo-5-person-accommodation",
  "/shinjuku-family-accommodation",
  "/tokyo-korean-minbak",
];

const BLOG_SLUGS = [
  "what-is-tokyominbak",
  "tokyo-minbak-vs-hotel",
  "shinjuku-family-accommodation-guide",
  "shibuya-ku-area-guide",
  "tokyo-travel-luggage-tips",
];

const FOOTER_MARKERS = ["한일익스프레스", "ftc.go.kr/bizCommPop"];
const PLACEHOLDERS = ["[이미지 삽입]", "[IMG:", "TODO", "/recommendation"];

let failures = 0;
let warnings = 0;

function pass(msg) {
  console.log(`  ✅ ${msg}`);
}
function fail(msg) {
  console.log(`  ❌ ${msg}`);
  failures += 1;
}
function warn(msg) {
  console.log(`  ⚠️  ${msg}`);
  warnings += 1;
}

async function fetchText(url) {
  const res = await fetch(url, {
    headers: { "user-agent": "tokyominbak-organic-qa/1.0" },
  });
  return { status: res.status, text: await res.text(), url };
}

function firstIndex(haystack, needle) {
  const i = haystack.indexOf(needle);
  return i < 0 ? Infinity : i;
}

function footerBeforeH1(html) {
  const h1 = firstIndex(html, "<h1");
  const footer = Math.min(...FOOTER_MARKERS.map((m) => firstIndex(html, m)));
  return footer !== Infinity && h1 !== Infinity && footer < h1;
}

function metaChecks(html, label) {
  if (!/<title[^>]*>[^<]+<\/title>/i.test(html)) fail(`${label}: title 없음`);
  else pass(`${label}: title`);
  if (!/<meta[^>]+name=["']description["'][^>]+content=["'][^"']+["']/i.test(html))
    fail(`${label}: meta description 없음`);
  else pass(`${label}: meta description`);
  if (!/<link[^>]+rel=["']canonical["']/i.test(html)) warn(`${label}: canonical 없음`);
  else pass(`${label}: canonical`);
  if (!/<meta[^>]+property=["']og:title["']/i.test(html)) warn(`${label}: og:title 없음`);
  else pass(`${label}: og:title`);
  if (!/<meta[^>]+property=["']og:description["']/i.test(html)) warn(`${label}: og:description 없음`);
  else pass(`${label}: og:description`);
  if (/<meta[^>]+name=["']robots["'][^>]+content=["'][^"']*noindex/i.test(html))
    fail(`${label}: noindex`);
  else pass(`${label}: noindex 없음`);
}

async function checkPage(path, opts = {}) {
  const { label = path, requireH1 = true, minLinks = 0, requireListingCards = false } = opts;
  console.log(`\n▶ ${BASE}${path}`);
  let res;
  try {
    res = await fetchText(`${BASE}${path}`);
  } catch (e) {
    return fail(`fetch 실패: ${e.message}`);
  }
  if (res.status !== 200) return fail(`HTTP ${res.status}`);

  const html = res.text;
  metaChecks(html, label);

  const h1c = (html.match(/<h1[\s>]/gi) || []).length;
  if (requireH1) {
    if (h1c === 1) pass("h1 1개");
    else fail(`h1 ${h1c}개`);
  }

  if (footerBeforeH1(html)) fail("footer가 h1보다 먼저");
  else pass("footer가 h1보다 뒤");

  const mainBeforeFooter =
    firstIndex(html, "<main") < firstIndex(html, "<footer") &&
    firstIndex(html, "<main") !== Infinity;
  if (mainBeforeFooter) pass("main이 footer보다 앞");
  else warn("main/footer 순서 확인 필요");

  const foundPh = PLACEHOLDERS.filter((p) => html.includes(p));
  if (foundPh.length) fail(`placeholder: ${foundPh.join(", ")}`);
  else pass("placeholder 없음");

  const hrefCount = (html.match(/<a\b[^>]*\shref=["'][^"'#][^"']*["']/gi) || []).length;
  if (hrefCount >= minLinks) pass(`내부 링크 ${hrefCount}개`);
  else warn(`내부 링크 ${hrefCount}개 (권장 ${minLinks}+)`);

  if (requireListingCards) {
    if (/ListingCard|\/listing\//i.test(html) && (html.includes("최대") || html.includes("박")))
      pass("숙소 카드 SSR 힌트");
    else warn("숙소 카드/가격 텍스트 약함");
  }

  if (!/alt=["'][^"']+["']/i.test(html)) warn("비어있지 않은 alt 없음");
  else pass("이미지 alt 존재");
}

async function checkSitemap() {
  console.log(`\n▶ ${BASE}/sitemap.xml`);
  const { status, text } = await fetchText(`${BASE}/sitemap.xml`);
  if (status !== 200) return fail(`HTTP ${status}`);
  for (const p of LANDING_PATHS) {
    if (text.includes(p)) pass(`sitemap ${p}`);
    else fail(`sitemap ${p} 없음`);
  }
  for (const slug of BLOG_SLUGS) {
    if (text.includes(`/blog/${slug}`)) pass(`sitemap blog/${slug}`);
    else warn(`sitemap blog/${slug} 없음`);
  }
  if (text.includes("/listing/")) pass("sitemap listing 포함");
  else fail("sitemap listing 없음");
}

async function checkRobots() {
  console.log(`\n▶ ${BASE}/robots.txt`);
  const { status, text } = await fetchText(`${BASE}/robots.txt`);
  if (status !== 200) return fail(`HTTP ${status}`);
  for (const p of ["/blog", "/search", "/listing", ...LANDING_PATHS]) {
    if (new RegExp(`Disallow:\\s*${p.replace("/", "\\/")}`, "i").test(text))
      fail(`robots Disallow ${p}`);
  }
  pass("robots /blog·/search·/listing·랜딩 차단 없음");
}

async function resolveListingIds() {
  if (process.env.QA_LISTING_IDS) {
    return process.env.QA_LISTING_IDS.split(",").map((s) => s.trim()).filter(Boolean);
  }
  try {
    const { PrismaClient } = await import("@prisma/client");
    const p = new PrismaClient();
    const rows = await p.listing.findMany({
      where: { status: "approved", hidden: false },
      take: 5,
      orderBy: { updatedAt: "desc" },
      select: { id: true },
    });
    await p.$disconnect();
    return rows.map((r) => r.id);
  } catch {
    return ["cmnd06irz0001hnvx46i20490", "cmo73wghd000110kf4r8pawut"];
  }
}

async function main() {
  console.log(`오가닉 SEO QA — ${BASE}\n`);

  await checkPage("/", { minLinks: 5 });
  await checkPage("/search", {
    label: "/search",
    minLinks: 8,
    requireListingCards: true,
  });
  await checkPage("/blog", { minLinks: 3 });

  for (const slug of BLOG_SLUGS) {
    await checkPage(`/blog/${slug}`, { label: `blog/${slug}`, minLinks: 2 });
  }

  const listingIds = await resolveListingIds();
  for (const id of listingIds.slice(0, 5)) {
    await checkPage(`/listing/${id}`, {
      label: `listing/${id}`,
      minLinks: 2,
    });
  }

  for (const p of LANDING_PATHS) {
    await checkPage(p, {
      label: p,
      minLinks: 5,
      requireListingCards: true,
    });
  }

  await checkSitemap();
  await checkRobots();

  console.log(`\n▶ ${BASE}/rss.xml`);
  try {
    const rss = await fetchText(`${BASE}/rss.xml`);
    if (rss.status !== 200) fail(`RSS HTTP ${rss.status}`);
    else if ((rss.text.match(/<item>/g) || []).length > 0) pass("RSS item 있음");
    else fail("RSS item 없음");
  } catch (e) {
    fail(`RSS fetch: ${e.message}`);
  }

  console.log(`\n──────────────────────────────────────────`);
  console.log(`실패: ${failures} · 경고: ${warnings}`);
  if (failures > 0) process.exitCode = 1;
}

main();
