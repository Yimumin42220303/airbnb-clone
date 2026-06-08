#!/usr/bin/env node
/** RSS 로컬/프로덕션 자체 점검 (읽기 전용) */
const BASE = process.argv[2] || "http://localhost:3000";

async function main() {
  const res = await fetch(`${BASE}/rss.xml`, {
    headers: { "User-Agent": "rss-verify/1.0" },
  });
  const text = await res.text();
  const ct = res.headers.get("content-type") || "";

  console.log("URL:", `${BASE}/rss.xml`);
  console.log("Status:", res.status);
  console.log("Content-Type:", ct);
  console.log("Size bytes:", Buffer.byteLength(text, "utf8"));

  const checks = {
    "RSS 2.0": /<rss version="2.0"/.test(text),
    "content namespace": /xmlns:content=/.test(text),
    "channel title": text.includes("<title>도쿄민박 블로그</title>"),
    "language ko-KR": text.includes("<language>ko-KR</language>"),
    "content:encoded": text.includes("<content:encoded>"),
    "what-is-tokyominbak": text.includes("https://tokyominbak.net/blog/what-is-tokyominbak"),
    "shibuya-ku-area-guide": text.includes("https://tokyominbak.net/blog/shibuya-ku-area-guide"),
    "no localhost": !/localhost|127\.0\.0\.1/.test(text),
    "no vercel preview": !/vercel\.app/.test(text),
    "no www": !/www\.tokyominbak\.net/.test(text),
    "no http insecure": !/http:\/\/tokyominbak/.test(text),
    "item count": (text.match(/<item>/g) || []).length,
  };

  console.log("\n--- Checks ---");
  for (const [k, v] of Object.entries(checks)) {
    console.log(`  ${v ? "OK" : "FAIL"} ${k}: ${v}`);
  }

  const itemBlocks = [...text.matchAll(/<item>([\s\S]*?)<\/item>/g)];
  console.log("\n--- Items ---");
  for (const m of itemBlocks) {
    const block = m[1];
    const title = block.match(/<title>([^<]*)<\/title>/)?.[1];
    const link = block.match(/<link>([^<]*)<\/link>/)?.[1];
    const pubDate = block.match(/<pubDate>([^<]*)<\/pubDate>/)?.[1];
    const category = block.match(/<category>([^<]*)<\/category>/)?.[1] || "(none)";
    const encodedLen = block.match(/<content:encoded><!\[CDATA\[([\s\S]*?)\]\]><\/content:encoded>/)?.[1]?.length ?? 0;
    console.log(`  - ${title}`);
    console.log(`    link: ${link}`);
    console.log(`    pubDate: ${pubDate}`);
    console.log(`    category: ${category}`);
    console.log(`    content:encoded chars: ${encodedLen}`);
  }

  const fail = Object.entries(checks).some(([k, v]) => {
    if (k === "item count") return typeof v === "number" && v < 1;
    return v === false;
  });
  process.exit(fail ? 1 : 0);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
