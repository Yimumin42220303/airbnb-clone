#!/usr/bin/env node
/**
 * 운영(또는 지정 URL) meta-catalog-build Cron 1회 수동 실행
 *
 * .env: CRON_SECRET, NEXT_PUBLIC_APP_URL (또는 META_CATALOG_CRON_BASE_URL)
 * 실행: npm run meta:catalog-build
 */
const path = require("path");
const root = path.join(__dirname, "..");
const envFile = process.env.META_ENV_FILE
  ? path.join(root, process.env.META_ENV_FILE)
  : path.join(root, ".env");
require("dotenv").config({ path: envFile, override: true });

const cronSecret = process.env.CRON_SECRET?.trim();
const baseUrl = (
  process.env.META_CATALOG_CRON_BASE_URL ||
  process.env.NEXT_PUBLIC_APP_URL ||
  (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "") ||
  "https://tokyominbak.net"
)?.replace(/\/$/, "");

if (!cronSecret) {
  console.error("\n❌ CRON_SECRET이 .env에 없습니다.\n");
  process.exit(1);
}
if (!baseUrl) {
  console.error(
    "\n❌ NEXT_PUBLIC_APP_URL 또는 META_CATALOG_CRON_BASE_URL을 설정하세요.\n"
  );
  process.exit(1);
}

const url = `${baseUrl}/api/cron/meta-catalog-build`;

async function main() {
  console.log(`\n[meta:catalog-build] POST ${url}\n`);

  const res = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${cronSecret}`,
      "Content-Type": "application/json",
    },
  });

  const text = await res.text();
  let json;
  try {
    json = JSON.parse(text);
  } catch {
    console.error("응답 파싱 실패:", text.slice(0, 500));
    process.exit(1);
  }

  console.log(JSON.stringify(json, null, 2));

  if (!res.ok || !json.ok) {
    console.error("\n❌ 카탈로그 빌드 실패\n");
    process.exit(1);
  }

  const registerUrl =
    json.metaCatalogRegisterUrl || json.feedUrl || json.blobUrl;
  console.log("\n✅ Meta Commerce Catalog 피드 URL (Meta 관리자에 등록):");
  console.log(`   ${registerUrl}`);
  if (json.blobError) {
    console.log(`\n⚠ Blob 업로드 생략: ${json.blobError}`);
    console.log("   공개 API 피드 URL로 Meta Scheduled Fetch 등록 가능합니다.\n");
  } else {
    console.log("");
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
