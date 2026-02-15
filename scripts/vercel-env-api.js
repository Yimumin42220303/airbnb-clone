/**
 * Vercel API로 환경변수 추가
 * 사용: $env:VERCEL_TOKEN="xxx"; node scripts/vercel-env-api.js
 *       $env:VERCEL_TOKEN="xxx"; node scripts/vercel-env-api.js --redeploy  (환경변수 반영 후 자동 Redeploy)
 * 토큰: https://vercel.com/account/tokens 에서 생성
 */

const fs = require("fs");
const path = require("path");

const doRedeploy = process.argv.includes("--redeploy");
const token = process.env.VERCEL_TOKEN;
const teamId = process.env.VERCEL_TEAM_ID || "team_ZSwD0UVtxOgbCA0KkP3lLGBf";
const useTeam = process.env.VERCEL_USE_TEAM !== "0";
let projectId = process.env.VERCEL_PROJECT_ID || "airbnb-clone";

if (!token) {
  console.error("VERCEL_TOKEN 필요. 토큰: https://vercel.com/account/tokens");
  console.error("PowerShell: $env:VERCEL_TOKEN='xxx'; node scripts/vercel-env-api.js");
  process.exit(1);
}

async function getProjectId() {
  try {
    const res = await fetch(
      `https://api.vercel.com/v9/projects?teamId=${teamId}`,
      { headers: { Authorization: `Bearer ${token}` } }
    );
    if (res.ok) {
      const data = await res.json();
      const proj = data.projects?.find((p) => p.name === "airbnb-clone");
      if (proj) return proj.id;
    }
  } catch (e) {}
  return projectId;
}

const envFile = path.join(__dirname, "..", ".env.vercel.import");
if (!fs.existsSync(envFile)) {
  console.error(".env.vercel.import 파일이 없습니다. scripts/vercel-env-export.ps1 를 먼저 실행하세요.");
  process.exit(1);
}

const envVars = {};
fs.readFileSync(envFile, "utf8")
  .split(/\r?\n/)
  .forEach((line) => {
    const trimmed = line.trim();
    const m = trimmed.match(/^([A-Za-z_][A-Za-z0-9_]*)=(.*)$/);
    if (m && m[2].trim()) envVars[m[1]] = m[2].trim();
  });

const EMAIL_FROM_FIX = "도쿄민박 <noreply@tokyominbak.net>";
if (envVars.EMAIL_FROM && envVars.EMAIL_FROM.includes("・・")) {
  envVars.EMAIL_FROM = EMAIL_FROM_FIX;
}

const sensitiveKeys = ["DATABASE_URL", "DIRECT_URL", "NEXTAUTH_SECRET", "GOOGLE_CLIENT_SECRET", "KAKAO_CLIENT_SECRET", "RESEND_API_KEY", "CLOUDINARY_API_SECRET", "CLOUDINARY_URL", "OPENAI_API_KEY", "PORTONE_API_SECRET"];

async function addEnvVar(key, value, type = "plain") {
  const body = {
    key,
    value,
    type: sensitiveKeys.includes(key) ? "encrypted" : type,
    target: ["production", "preview", "development"],
  };
  const qs = useTeam && teamId ? `?teamId=${teamId}&upsert=true` : "?upsert=true";
  const res = await fetch(
    `https://api.vercel.com/v10/projects/${projectId}/env${qs}`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    }
  );
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`${key}: ${res.status} ${err}`);
  }
  return res.json();
}

async function triggerRedeploy() {
  const deployHook = process.env.VERCEL_DEPLOY_HOOK?.trim();
  if (deployHook) {
    const res = await fetch(deployHook, { method: "POST" });
    if (res.ok) {
      console.log("Deploy Hook 호출 완료. 배포가 시작됩니다.");
      return;
    }
    console.warn("Deploy Hook 실패:", res.status);
  }
  const listQs = `?projectId=${projectId}&limit=1${useTeam && teamId ? `&teamId=${teamId}` : ""}`;
  const listRes = await fetch(
    `https://api.vercel.com/v6/deployments${listQs}`,
    { headers: { Authorization: `Bearer ${token}` } }
  );
  if (!listRes.ok) {
    console.warn("배포 목록 조회 실패. 수동 Redeploy 필요.");
    return;
  }
  const { deployments = [] } = await listRes.json();
  const latest = deployments[0];
  if (!latest?.id) {
    console.warn("배포를 찾을 수 없음. 수동 Redeploy 필요.");
    return;
  }
  const createQs = useTeam && teamId ? `?teamId=${teamId}` : "";
  const createRes = await fetch(
    `https://api.vercel.com/v13/deployments${createQs}`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        name: "airbnb-clone",
        project: projectId,
        deploymentId: latest.id,
        target: "production",
      }),
    }
  );
  if (!createRes.ok) {
    const err = await createRes.text();
    console.warn("Redeploy 실패:", err, "- 수동 Redeploy 필요.");
    return;
  }
  const data = await createRes.json();
  console.log("Redeploy 트리거 완료. 배포 ID:", data.id);
}

async function main() {
  projectId = await getProjectId();
  console.log(`프로젝트: ${projectId}\n`);
  console.log("Vercel 환경변수 추가 중...\n");
  for (const [key, value] of Object.entries(envVars)) {
    try {
      await addEnvVar(key, value);
      console.log(`  ${key} OK`);
    } catch (e) {
      console.error(`  ${key} FAIL:`, e.message);
    }
  }
  if (doRedeploy) {
    console.log("\nRedeploy 트리거 중...");
    await triggerRedeploy();
  } else {
    console.log("\n완료. Redeploy: node scripts/vercel-env-api.js --redeploy");
  }
}

main().catch(console.error);
