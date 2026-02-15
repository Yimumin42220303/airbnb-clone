/**
 * Vercel 환경변수 목록 조회
 * 사용: $env:VERCEL_TOKEN="xxx"; node scripts/vercel-env-list.js
 * 토큰: https://vercel.com/account/tokens
 */

const token = process.env.VERCEL_TOKEN;
const teamId = process.env.VERCEL_TEAM_ID || "team_1qdVcZtzKQGHJmkdtvE2xrHZ";
const useTeam = process.env.VERCEL_USE_TEAM !== "0";
let projectId = process.env.VERCEL_PROJECT_ID || "airbnb-clone";

if (!token) {
  console.error("VERCEL_TOKEN 필요. 토큰: https://vercel.com/account/tokens");
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

async function listEnvVars() {
  const qs = useTeam && teamId ? `?teamId=${teamId}` : "";
  const res = await fetch(
    `https://api.vercel.com/v10/projects/${projectId}/env${qs}`,
    { headers: { Authorization: `Bearer ${token}` } }
  );
  if (!res.ok) {
    throw new Error(`${res.status} ${await res.text()}`);
  }
  return res.json();
}

async function main() {
  projectId = await getProjectId();
  console.log(`프로젝트: ${projectId}\n`);
  const envs = await listEnvVars();
  const keys = envs.envs?.map((e) => e.key) ?? [];
  console.log("설정된 환경변수:", keys.length, "개\n");
  keys.sort().forEach((k) => console.log("  -", k));
  const hasOpenAI = keys.includes("OPENAI_API_KEY");
  console.log("\n" + (hasOpenAI ? "✓ OPENAI_API_KEY 설정됨" : "✗ OPENAI_API_KEY 없음"));
}

main().catch((e) => {
  console.error(e.message);
  process.exit(1);
});
