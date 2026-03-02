#!/usr/bin/env node
/**
 * .vercel/project.json 생성 (Vercel CLI 배포용)
 * VERCEL_ORG_ID, VERCEL_PROJECT_ID가 .env에 있으면 해당 값으로 링크 파일 생성
 *
 * 사용: npm run setup:vercel-link
 */

require("dotenv").config({
  path: require("path").join(__dirname, "..", ".env"),
  override: true,
});
const fs = require("fs");
const path = require("path");

const orgId = process.env.VERCEL_ORG_ID?.trim();
const projectId = process.env.VERCEL_PROJECT_ID?.trim();

if (!orgId || !projectId) {
  console.log("\n[setup-vercel-link] VERCEL_ORG_ID, VERCEL_PROJECT_ID가 .env에 없습니다.\n");
  console.log("  .env에 추가 후 다시 실행하세요:");
  console.log("  VERCEL_ORG_ID=team_xxxxxxxx");
  console.log("  VERCEL_PROJECT_ID=prj_xxxxxxxx\n");
  console.log("  값 확인: Vercel 대시보드 → 프로젝트 → Settings → General");
  console.log("  또는 터미널: vercel project inspect airbnb-clone --scope minbaktokyos-projects\n");
  process.exit(1);
}

const vercelDir = path.join(__dirname, "..", ".vercel");
const projectJson = path.join(vercelDir, "project.json");

try {
  if (!fs.existsSync(vercelDir)) fs.mkdirSync(vercelDir, { recursive: true });
  fs.writeFileSync(
    projectJson,
    JSON.stringify({ orgId, projectId }, null, 2),
    "utf-8"
  );
  console.log("\n[setup-vercel-link] .vercel/project.json 생성 완료");
  console.log("  orgId:", orgId);
  console.log("  projectId:", projectId);
  console.log("\n  이제 npm run deploy:cli 로 로컬→Vercel 직접 배포 가능합니다.\n");
} catch (e) {
  console.error("[setup-vercel-link] 오류:", e.message);
  process.exit(1);
}
