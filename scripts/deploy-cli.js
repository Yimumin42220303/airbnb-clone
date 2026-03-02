#!/usr/bin/env node
/**
 * Vercel CLI 직접 배포
 * .env의 VERCEL_ORG_ID, VERCEL_PROJECT_ID로 로컬→Vercel 배포
 * (환경변수로 전달하여 chris/minbaktokyos 혼동 방지)
 */
require("dotenv").config({
  path: require("path").join(__dirname, "..", ".env"),
  override: true,
});
const { spawnSync } = require("child_process");
const fs = require("fs");
const path = require("path");

const orgId = process.env.VERCEL_ORG_ID?.trim();
const projectId = process.env.VERCEL_PROJECT_ID?.trim();

if (!orgId || !projectId) {
  console.log("\n[deploy:cli] VERCEL_ORG_ID, VERCEL_PROJECT_ID가 .env에 없습니다.\n");
  console.log("  minbaktokyos (tokyominbak.net):");
  console.log('    VERCEL_ORG_ID="team_1qdVcZtzKQGHJmkdtvE2xrHZ"');
  console.log('    VERCEL_PROJECT_ID="prj_z477oVao1phDDrLMETtRQlkTXMYH"\n');
  console.log("  docs/배포-가이드.md 참고\n");
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
} catch (e) {
  console.error("[deploy:cli] .vercel/project.json 생성 실패:", e.message);
  process.exit(1);
}

const r = spawnSync(
  "vercel",
  ["deploy", "--prod", "--yes"],
  {
    stdio: "inherit",
    shell: true,
    env: {
      ...process.env,
      VERCEL_ORG_ID: orgId,
      VERCEL_PROJECT_ID: projectId,
    },
  }
);
process.exit(r.status !== undefined ? r.status : 1);
