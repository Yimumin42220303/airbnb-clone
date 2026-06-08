/**
 * BEDS24_REFRESH_TOKEN을 Vercel 환경변수에 추가
 * 사용: $env:VERCEL_TOKEN="xxx"; node scripts/beds24-vercel-env.js
 *       $env:VERCEL_TOKEN="xxx"; node scripts/beds24-vercel-env.js --redeploy
 * 토큰: https://vercel.com/account/tokens
 */

const fs = require("fs");
const path = require("path");

const doRedeploy = process.argv.includes("--redeploy");
const token = process.env.VERCEL_TOKEN;
const teamId = process.env.VERCEL_TEAM_ID || null;
let projectId = process.env.VERCEL_PROJECT_ID || "prj_airbnb-clone";

if (!token) {
  console.error("VERCEL_TOKEN 필요. https://vercel.com/account/tokens 에서 생성");
  console.error("PowerShell: $env:VERCEL_TOKEN='xxx'; node scripts/beds24-vercel-env.js");
  process.exit(1);
}

function loadEnvValue(key) {
  const envPath = path.join(__dirname, "..", ".env");
  if (!fs.existsSync(envPath)) return null;
  const content = fs.readFileSync(envPath, "utf8");
  for (const line of content.split(/\r?\n/)) {
    const m = line.trim().match(new RegExp(`^${key}=(.*)$`));
    if (m) {
      const val = m[1].replace(/^["']|["']$/g, "").trim();
      return val || null;
    }
  }
  return null;
}

async function getProjectId() {
  const url = teamId
    ? `https://api.vercel.com/v9/projects?teamId=${teamId}`
    : "https://api.vercel.com/v9/projects";
  try {
    const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
    if (res.ok) {
      const data = await res.json();
      const proj = data.projects?.find((p) => p.name === "airbnb-clone");
      if (proj) return proj.id;
    }
  } catch (e) {}
  return projectId;
}

async function addEnvVar(key, value) {
  const body = {
    key,
    value,
    type: "encrypted",
    target: ["production", "preview", "development"],
  };
  const qs = teamId ? `?teamId=${teamId}&upsert=true` : "?upsert=true";
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
    throw new Error(`${res.status} ${err}`);
  }
  return res.json();
}

async function triggerRedeploy() {
  const listQs = teamId
    ? `?projectId=${projectId}&limit=1&teamId=${teamId}`
    : `?projectId=${projectId}&limit=1`;
  const res = await fetch(
    `https://api.vercel.com/v6/deployments${listQs}`,
    { headers: { Authorization: `Bearer ${token}` } }
  );
  if (!res.ok) {
    console.warn("배포 목록 조회 실패. Vercel 대시보드에서 수동 Redeploy 해주세요.");
    return;
  }
  const { deployments = [] } = await res.json();
  const latest = deployments[0];
  if (!latest?.id) {
    console.warn("배포를 찾을 수 없음. 수동 Redeploy 필요.");
    return;
  }
  const createQs = teamId ? `?teamId=${teamId}` : "";
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
        target: "production",
      }),
    }
  );
  if (!createRes.ok) {
    console.warn("Redeploy 실패. Vercel 대시보드에서 수동 Redeploy 해주세요.");
    return;
  }
  const data = await createRes.json();
  console.log("Redeploy 트리거 완료. 배포 ID:", data.id);
}

async function main() {
  const value = loadEnvValue("BEDS24_REFRESH_TOKEN");
  if (!value) {
    console.error(".env에 BEDS24_REFRESH_TOKEN이 없습니다.");
    process.exit(1);
  }

  projectId = await getProjectId();
  console.log("프로젝트:", projectId, "\n");

  console.log("BEDS24_REFRESH_TOKEN Vercel 추가 중...");
  await addEnvVar("BEDS24_REFRESH_TOKEN", value);
  console.log("  BEDS24_REFRESH_TOKEN OK\n");

  if (doRedeploy) {
    console.log("Redeploy 트리거 중...");
    await triggerRedeploy();
  } else {
    console.log("완료. Redeploy: node scripts/beds24-vercel-env.js --redeploy");
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
