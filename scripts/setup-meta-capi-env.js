#!/usr/bin/env node
/**
 * Meta Conversions API 환경 변수 → Vercel 동기화
 *
 * 1) .env에 META_CAPI_ACCESS_TOKEN 설정 (CAPI용, 선택)
 * 2) npm run setup:meta-capi
 *
 * 토큰 발급: Meta Events Manager → 데이터 소스(픽셀) → 설정 → Conversions API → 액세스 토큰 생성
 */
require("dotenv").config({
  path: require("path").join(__dirname, "..", ".env"),
  override: true,
});

const { spawnSync } = require("child_process");

const DEFAULT_PIXEL_ID = "1815598592627600";
const capiToken = process.env.META_CAPI_ACCESS_TOKEN?.trim();
const testEventCode = process.env.META_CAPI_TEST_EVENT_CODE?.trim();
const pixelId = process.env.NEXT_PUBLIC_META_PIXEL_ID?.trim() || DEFAULT_PIXEL_ID;
const vercelToken = process.env.VERCEL_TOKEN?.trim();

const ENVS = ["production", "preview", "development"];

function runVercelEnvAdd(name, value, targetEnv) {
  const args = ["vercel", "env", "add", name, targetEnv, "--force"];
  if (vercelToken) args.push("--token", vercelToken);
  const result = spawnSync("npx", args, {
    input: value,
    stdio: ["pipe", "inherit", "inherit"],
    shell: true,
    env: process.env,
  });
  if (result.status !== 0) {
    throw new Error(`vercel env add ${name} ${targetEnv} failed (exit ${result.status})`);
  }
}

function syncVar(name, value) {
  console.log(`\n[setup:meta-capi] ${name} → Vercel (${ENVS.join(", ")})`);
  for (const env of ENVS) {
    runVercelEnvAdd(name, value, env);
    console.log(`  ✓ ${env}`);
  }
}

if (!vercelToken) {
  console.error("\n[setup:meta-capi] VERCEL_TOKEN이 .env에 없습니다.\n");
  process.exit(1);
}

try {
  syncVar("NEXT_PUBLIC_META_PIXEL_ID", pixelId);

  if (capiToken) {
    syncVar("META_CAPI_ACCESS_TOKEN", capiToken);
    if (testEventCode) {
      syncVar("META_CAPI_TEST_EVENT_CODE", testEventCode);
    }
    console.log("\n[setup:meta-capi] ✅ Pixel ID + CAPI 토큰 Vercel 동기화 완료");
  } else {
    console.log(`
[setup:meta-capi] ✅ NEXT_PUBLIC_META_PIXEL_ID 동기화 완료

⚠ META_CAPI_ACCESS_TOKEN이 .env에 없어 CAPI(서버 Purchase)는 아직 비활성입니다.

1. Meta Events Manager → 픽셀(${pixelId}) → 설정 → Conversions API → 액세스 토큰 생성
2. .env에 추가: META_CAPI_ACCESS_TOKEN="EAA..."
3. (선택) META_CAPI_TEST_EVENT_CODE="TEST12345"
4. npm run setup:meta-capi 재실행
`);
  }

  console.log("   변경 반영: npm run deploy:cli\n");
} catch (e) {
  console.error("\n[setup:meta-capi] 오류:", e.message);
  process.exit(1);
}
