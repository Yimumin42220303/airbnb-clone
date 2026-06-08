#!/usr/bin/env node
/**
 * Deploy Hook 설정 안내
 * npm run setup:deploy-hook
 */
const path = require("path");
const { execSync } = require("child_process");

// chris=tokyominbak.net(Chris' projects), minbaktokyos=minbaktokyos-projects
const TEAM = process.env.VERCEL_TEAM || "chris";
const SETTINGS_URL =
  TEAM === "chris"
    ? "https://vercel.com/chris-projects/airbnb-clone/settings/git"
    : "https://vercel.com/minbaktokyos-projects/airbnb-clone/settings/git";

console.log("\n=== Vercel Deploy Hook 설정 ===\n");
console.log("  대상:", TEAM === "chris" ? "Chris' projects (tokyominbak.net)" : "minbaktokyos-projects\n");
console.log("1. Deploy Hooks 섹션으로 스크롤 → Create Hook");
console.log("2. Name: main 배포, Branch: main 선택");
console.log("3. 생성된 URL 복사");
console.log("4. .env에 추가: VERCEL_DEPLOY_HOOK=\"복사한_URL\"\n");

try {
  if (process.platform === "win32") {
    execSync(`start "" "${SETTINGS_URL}"`, { stdio: "inherit" });
  } else if (process.platform === "darwin") {
    execSync(`open "${SETTINGS_URL}"`, { stdio: "inherit" });
  } else {
    execSync(`xdg-open "${SETTINGS_URL}"`, { stdio: "inherit" });
  }
  console.log("브라우저에서 Vercel Git 설정 페이지를 열었습니다.\n");
} catch (_) {
  console.log("아래 URL을 브라우저에서 열어주세요:\n  " + SETTINGS_URL + "\n");
}
