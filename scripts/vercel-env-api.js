/**
 * Vercel API로 환경변수 추가
 * 사용: $env:VERCEL_TOKEN="xxx"; node scripts/vercel-env-api.js
 * 토큰: https://vercel.com/account/tokens 에서 생성
 */

const fs = require("fs");
const path = require("path");

const token = process.env.VERCEL_TOKEN;
const teamId = process.env.VERCEL_TEAM_ID || "team_1qdVcZtzKQGHJmkdtvE2xrHZ";
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

const sensitiveKeys = ["DATABASE_URL", "DIRECT_URL", "NEXTAUTH_SECRET", "GOOGLE_CLIENT_SECRET", "KAKAO_CLIENT_SECRET", "RESEND_API_KEY"];

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
  console.log("\n완료. Vercel 대시보드에서 Redeploy 하세요.");
}

main().catch(console.error);
