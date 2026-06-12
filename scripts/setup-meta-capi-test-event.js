#!/usr/bin/env node
/**
 * Meta Test Events 코드 → 로컬 .env (+ 선택: Vercel) 주입
 *
 * 사용:
 *   npm run setup:meta-capi-test -- --code=TEST12345
 *   npm run setup:meta-capi-test -- --code=TEST12345 --sync-vercel
 *
 * .env에 이미 META_CAPI_TEST_EVENT_CODE가 있으면 --code 생략 가능
 */
const path = require("path");
const { spawnSync } = require("child_process");
const { upsertEnvLine } = require("./lib/upsert-env-line");

const root = path.join(__dirname, "..");
require("dotenv").config({ path: path.join(root, ".env.local") });
require("dotenv").config({ path: path.join(root, ".env"), override: true });

const args = process.argv.slice(2);
const codeArg = args.find((a) => a.startsWith("--code="))?.split("=")[1]?.trim();
const syncVercel = args.includes("--sync-vercel");
const testCode = codeArg || process.env.META_CAPI_TEST_EVENT_CODE?.trim();
const envPath = path.join(root, ".env");
const vercelToken = process.env.VERCEL_TOKEN?.trim();

if (!testCode) {
  console.error(`
[setup:meta-capi-test] META_CAPI_TEST_EVENT_CODE가 필요합니다.

1) Meta Events Manager → 픽셀 → 테스트 이벤트 →「웹사이트에서 이벤트 테스트」→ 코드 복사 (예: TEST12345)
2) 실행:
   npm run setup:meta-capi-test -- --code=TEST12345
3) 로컬 서버 재시작 후 npm run test:meta-mock-purchase

Vercel Preview/Production에도 반영:
   npm run setup:meta-capi-test -- --code=TEST12345 --sync-vercel
`);
  process.exit(1);
}

upsertEnvLine(envPath, "META_CAPI_TEST_EVENT_CODE", testCode);
process.env.META_CAPI_TEST_EVENT_CODE = testCode;

console.log(`\n[setup:meta-capi-test] ✅ ${envPath}`);
console.log(`  META_CAPI_TEST_EVENT_CODE 설정됨 (길이 ${testCode.length}, TEST 접두 확인)`);
console.log("  CAPI 요청 시 test_event_code 필드에 포함됩니다.");
console.log("  로컬 dev 서버를 켜 두었다면 재시작하세요.\n");

if (syncVercel) {
  if (!vercelToken) {
    console.error("[setup:meta-capi-test] --sync-vercel: VERCEL_TOKEN이 .env에 없습니다.");
    process.exit(1);
  }
  for (const env of ["production", "preview", "development"]) {
    const r = spawnSync(
      "npx",
      ["vercel", "env", "add", "META_CAPI_TEST_EVENT_CODE", env, "--force", "--token", vercelToken],
      { input: testCode, stdio: ["pipe", "inherit", "inherit"], shell: true, env: process.env }
    );
    if (r.status !== 0) {
      console.error(`[setup:meta-capi-test] Vercel ${env} 동기화 실패`);
      process.exit(1);
    }
    console.log(`  ✓ Vercel ${env}`);
  }
  console.log("\n  Vercel 반영 후: npm run deploy:cli\n");
}
