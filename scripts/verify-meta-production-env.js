#!/usr/bin/env node
/**
 * Meta 운영 필수 환경 변수 검증 (값 미출력)
 *
 * 로컬: npm run verify:meta-production-env
 * Vercel 목록(선택): VERCEL_TOKEN 있으면 production env 키 존재 여부 조회
 */
require("dotenv").config({
  path: require("path").join(__dirname, "..", ".env"),
  override: true,
});

const { spawnSync } = require("child_process");
const path = require("path");

const jiti = require("jiti")(path.join(__dirname, "verify-meta-production-env.js"), {
  alias: { "@": path.join(__dirname, "..", "src") },
  interopDefault: true,
});

const { checkMetaProductionEnv } = jiti("../src/lib/meta-ops-log.ts");

const REQUIRED = [
  "META_CAPI_ACCESS_TOKEN",
  "CRON_SECRET",
  "NEXT_PUBLIC_APP_URL",
];
const BLOB_ANY = ["BLOB_READ_WRITE_TOKEN", "BLOB_STORE_ID"];
const OPTIONAL = ["META_CAPI_TEST_EVENT_CODE", "NEXT_PUBLIC_META_PIXEL_ID"];

function maskSet(name) {
  return process.env[name]?.trim() ? "✅ 설정됨" : "❌ 미설정";
}

console.log("\n=== Meta 운영 환경 변수 (로컬 .env) ===\n");
for (const name of REQUIRED) {
  console.log(`  [필수] ${name}: ${maskSet(name)}`);
}
const blobLocal = BLOB_ANY.some((n) => process.env[n]?.trim());
console.log(
  `  [필수] blob_storage: ${blobLocal ? "✅ 설정됨 (토큰 또는 BLOB_STORE_ID)" : "❌ 미설정"}`
);
for (const name of OPTIONAL) {
  console.log(`  [선택] ${name}: ${maskSet(name)}`);
}

const local = checkMetaProductionEnv();
console.log(
  local.ok
    ? "\n✅ 로컬 .env 필수 항목 OK\n"
    : "\n⚠ 로컬 .env에 필수 항목이 빠져 있습니다. 배포 전 설정하세요.\n"
);

const vercelToken = process.env.VERCEL_TOKEN?.trim();
const projectId = process.env.VERCEL_PROJECT_ID?.trim();

if (vercelToken && projectId) {
  console.log("=== Vercel Production env 키 (이름만) ===\n");
  const args = [
    "vercel",
    "env",
    "ls",
    "production",
    "--token",
    vercelToken,
  ];
  const r = spawnSync("npx", args, {
    encoding: "utf-8",
    shell: true,
    cwd: path.join(__dirname, ".."),
  });
  const out = (r.stdout || "") + (r.stderr || "");
  for (const name of REQUIRED) {
    const found = out.includes(name);
    console.log(`  ${name}: ${found ? "✅ Vercel production에 존재" : "❌ 없음"}`);
  }
  const blobRemote = BLOB_ANY.some((n) => out.includes(n));
  console.log(
    `  blob_storage: ${blobRemote ? "✅ Vercel production에 존재" : "❌ 없음 — Storage에서 airbnb-clone-blob-v2 연결 권장"}`
  );
  for (const name of OPTIONAL) {
    const found = out.includes(name);
    console.log(`  ${name}: ${found ? "✅ Vercel production에 존재" : "❌ 없음"}`);
  }
  console.log("");
} else {
  console.log(
    "(Vercel 원격 확인 생략: VERCEL_TOKEN + VERCEL_PROJECT_ID 설정 시 production env 목록 조회)\n"
  );
}

console.log("다음 단계:");
console.log("  1) npm run setup:meta-capi  — .env 토큰 → Vercel 동기화");
console.log("  2) npm run deploy:cli       — 운영 배포");
console.log("  3) npm run meta:catalog-build — 카탈로그 Cron 1회 실행\n");

process.exit(local.ok ? 0 : 1);
