#!/usr/bin/env node
require("dotenv").config({ path: require("path").join(__dirname, "..", ".env") });
/**
 * Vercel 배포 트리거 (git push 후 배포가 안 될 때)
 *
 * 1) Deploy Hook (권장): VERCEL_DEPLOY_HOOK 설정 시 POST로 트리거
 *    Vercel → Settings → Git → Deploy Hooks에서 main 브랜치용 생성
 *
 * 2) Vercel API: VERCEL_TOKEN 설정 시 API로 배포 생성 (gitSource ref: main)
 *
 * 사용: node scripts/vercel-redeploy.js
 *      또는 deploy.js가 push 후 자동 호출
 */

const deployHook = process.env.VERCEL_DEPLOY_HOOK?.trim();
const token = process.env.VERCEL_TOKEN?.trim();
const teamId = process.env.VERCEL_TEAM_ID || process.env.VERCEL_ORG_ID || "team_ZSwD0UVtxOgbCA0KkP3lLGBf";
const projectId = process.env.VERCEL_PROJECT_ID || "prj_vOtK4fShQ4xp8d1N8kpYKFDNzN71";

async function triggerDeployHook() {
  if (!deployHook) return false;
  const res = await fetch(deployHook, { method: "POST" });
  if (res.ok) {
    const data = await res.json().catch(() => ({}));
    console.log("[vercel-redeploy] Deploy Hook 호출 완료. 배포 시작됨.");
    if (data?.job?.id) console.log("[vercel-redeploy] Job ID:", data.job.id);
    return true;
  }
  console.warn("[vercel-redeploy] Deploy Hook 실패:", res.status);
  return false;
}

async function triggerDeployApi() {
  if (!token) return false;
  const url = `https://api.vercel.com/v13/deployments?teamId=${teamId}`;
  const body = {
    name: "airbnb-clone",
    project: projectId,
    target: "production",
    gitSource: {
      type: "github",
      ref: "main",
      repo: "airbnb-clone",
      org: "Yimumin42220303",
    },
  };
  try {
    const res = await fetch(url, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });
    if (res.ok) {
      const data = await res.json();
      console.log("[vercel-redeploy] API 배포 트리거 완료. ID:", data.id);
      return true;
    }
    const err = await res.text();
    console.warn("[vercel-redeploy] API 실패:", res.status, err.slice(0, 200));
  } catch (e) {
    console.warn("[vercel-redeploy] API 오류:", e.message);
  }
  return false;
}

async function main() {
  if (deployHook) {
    const ok = await triggerDeployHook();
    if (ok) process.exit(0);
  }
  if (token) {
    const ok = await triggerDeployApi();
    if (ok) process.exit(0);
  }
  if (!deployHook && !token) {
    console.log(
      "[vercel-redeploy] VERCEL_DEPLOY_HOOK 또는 VERCEL_TOKEN이 없습니다."
    );
    console.log(
      "  Deploy Hook: Vercel → Settings → Git → Deploy Hooks (main 브랜치)"
    );
    console.log("  토큰: https://vercel.com/account/tokens");
    process.exit(1);
  }
  process.exit(1);
}

main();
