/**
 * 블로그 SEO/AEO 정적 QA (읽기 전용).
 *
 * 각 블로그 URL의 raw HTML(자바스크립트 미실행)을 받아 아래를 점검한다.
 *  - <h1> 개수 (정확히 1개)
 *  - title / meta description / canonical / og:image / og:type=article
 *  - BlogPosting · BreadcrumbList JSON-LD 존재
 *  - footer 사업자 정보가 본문(h1)보다 먼저 나오지 않는지
 *  - [이미지 삽입] · [IMG: · TODO 등 placeholder가 공개 HTML에 없는지
 *  - sitemap.xml 에 블로그 URL 포함
 *  - rss.xml 에 최신 글 포함
 *
 * 사용법:
 *   node scripts/qa-blog-seo.mjs            # 운영(tokyominbak.net)
 *   QA_BASE=http://localhost:3000 node scripts/qa-blog-seo.mjs
 */

const BASE = (process.env.QA_BASE || "https://tokyominbak.net").replace(/\/$/, "");

const POST_SLUGS = [
  "what-is-tokyominbak",
  "shibuya-ku-area-guide",
  "shinjuku-family-accommodation-guide",
  "tokyo-minbak-vs-hotel",
  "tokyo-travel-luggage-tips",
];

const FOOTER_MARKERS = ["한일익스프레스", "ftc.go.kr/bizCommPop"];
const PLACEHOLDERS = ["[이미지 삽입]", "[IMG:", "이미지 삽입", "TODO", "[image]", "[사진]"];

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
    headers: { "user-agent": "tokyominbak-qa-bot/1.0 (SEO check)" },
  });
  const text = await res.text();
  return { status: res.status, text };
}

function firstIndex(haystack, needle) {
  const i = haystack.indexOf(needle);
  return i < 0 ? Infinity : i;
}

async function checkPost(slug) {
  const url = `${BASE}/blog/${encodeURIComponent(slug)}`;
  console.log(`\n▶ ${url}`);
  let res;
  try {
    res = await fetchText(url);
  } catch (e) {
    fail(`fetch 실패: ${e.message}`);
    return;
  }
  if (res.status !== 200) {
    fail(`HTTP ${res.status}`);
    return;
  }
  const html = res.text;

  // h1 개수
  const h1Count = (html.match(/<h1[\s>]/gi) || []).length;
  if (h1Count === 1) pass("h1 1개");
  else fail(`h1 ${h1Count}개 (1개여야 함)`);

  // 메타
  if (/<title[^>]*>[^<]+<\/title>/i.test(html)) pass("title 존재");
  else fail("title 없음");

  if (/<meta[^>]+name=["']description["'][^>]+content=["'][^"']+["']/i.test(html))
    pass("meta description 존재");
  else fail("meta description 없음");

  const canonical = html.match(/<link[^>]+rel=["']canonical["'][^>]+href=["']([^"']+)["']/i);
  if (canonical) {
    if (canonical[1].includes(`/blog/${encodeURIComponent(slug)}`) || canonical[1].includes(`/blog/${slug}`))
      pass(`canonical 일치: ${canonical[1]}`);
    else warn(`canonical 불일치: ${canonical[1]}`);
  } else fail("canonical 없음");

  if (/<meta[^>]+property=["']og:type["'][^>]+content=["']article["']/i.test(html))
    pass("og:type=article");
  else warn("og:type=article 아님");

  const ogImage = html.match(/<meta[^>]+property=["']og:image["'][^>]+content=["']([^"']+)["']/i);
  if (ogImage) {
    const u = ogImage[1];
    if (u.includes("|") || /\s/.test(u)) fail(`og:image 깨짐: ${u}`);
    else pass(`og:image 정상`);
  } else fail("og:image 없음");

  // noindex
  if (/<meta[^>]+name=["']robots["'][^>]+content=["'][^"']*noindex/i.test(html))
    fail("noindex 감지됨");
  else pass("noindex 없음");

  // JSON-LD
  if (/"@type"\s*:\s*"BlogPosting"/.test(html)) pass("BlogPosting JSON-LD");
  else fail("BlogPosting JSON-LD 없음");
  if (/"@type"\s*:\s*"BreadcrumbList"/.test(html)) pass("BreadcrumbList JSON-LD");
  else fail("BreadcrumbList JSON-LD 없음");

  // footer가 h1보다 먼저 나오지 않아야 함
  const h1Idx = firstIndex(html, "<h1");
  const footerIdx = Math.min(...FOOTER_MARKERS.map((m) => firstIndex(html, m)));
  if (footerIdx < h1Idx) fail(`footer 사업자정보가 h1보다 먼저 (footer@${footerIdx} < h1@${h1Idx})`);
  else pass("footer가 h1보다 뒤");

  // placeholder
  const found = PLACEHOLDERS.filter((p) => html.includes(p));
  if (found.length === 0) pass("placeholder 없음");
  else fail(`placeholder 노출: ${found.join(", ")}`);
}

async function checkBlogList() {
  const url = `${BASE}/blog`;
  console.log(`\n▶ ${url}`);
  let res;
  try {
    res = await fetchText(url);
  } catch (e) {
    fail(`fetch 실패: ${e.message}`);
    return;
  }
  if (res.status !== 200) {
    fail(`HTTP ${res.status}`);
    return;
  }
  const html = res.text;
  const h1Count = (html.match(/<h1[\s>]/gi) || []).length;
  if (h1Count === 1) pass("h1 1개");
  else warn(`h1 ${h1Count}개`);

  const h1Idx = firstIndex(html, "<h1");
  const footerIdx = Math.min(...FOOTER_MARKERS.map((m) => firstIndex(html, m)));
  if (footerIdx < h1Idx) fail(`footer가 h1보다 먼저 (footer@${footerIdx} < h1@${h1Idx})`);
  else pass("footer가 h1보다 뒤");
}

async function checkSitemap() {
  const url = `${BASE}/sitemap.xml`;
  console.log(`\n▶ ${url}`);
  try {
    const { status, text } = await fetchText(url);
    if (status !== 200) return fail(`HTTP ${status}`);
    let ok = 0;
    for (const slug of POST_SLUGS) {
      if (text.includes(`/blog/${slug}`) || text.includes(`/blog/${encodeURIComponent(slug)}`)) ok += 1;
    }
    if (ok === POST_SLUGS.length) pass(`블로그 ${ok}/${POST_SLUGS.length} URL 포함`);
    else warn(`블로그 ${ok}/${POST_SLUGS.length} URL만 포함`);
  } catch (e) {
    fail(`fetch 실패: ${e.message}`);
  }
}

async function checkRss() {
  const url = `${BASE}/rss.xml`;
  console.log(`\n▶ ${url}`);
  try {
    const { status, text } = await fetchText(url);
    if (status !== 200) return fail(`HTTP ${status}`);
    if (!/<rss/i.test(text)) return fail("RSS 형식 아님");
    const itemCount = (text.match(/<item>/g) || []).length;
    if (itemCount > 0) pass(`RSS item ${itemCount}개`);
    else fail("RSS item 없음");
  } catch (e) {
    fail(`fetch 실패: ${e.message}`);
  }
}

async function main() {
  console.log(`블로그 SEO QA — base: ${BASE}`);
  await checkBlogList();
  for (const slug of POST_SLUGS) await checkPost(slug);
  await checkSitemap();
  await checkRss();

  console.log(`\n──────────────────────────────────────────`);
  console.log(`실패: ${failures} · 경고: ${warnings}`);
  if (failures > 0) process.exitCode = 1;
}

main();
