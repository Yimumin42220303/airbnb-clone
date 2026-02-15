/**
 * Vercel에서 BLOB_READ_WRITE_TOKEN 제거 (Cloudinary만 사용 시)
 * 사용: $env:VERCEL_TOKEN="xxx"; node scripts/vercel-remove-blob-token.js
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

async function main() {
  projectId = await getProjectId();
  const qs = useTeam && teamId ? `?teamId=${teamId}` : "";
  const listRes = await fetch(
    `https://api.vercel.com/v9/projects/${projectId}/env${qs}`,
    { headers: { Authorization: `Bearer ${token}` } }
  );
  if (!listRes.ok) {
    console.error("환경변수 목록 조회 실패:", await listRes.text());
    process.exit(1);
  }
  const { envs = [] } = await listRes.json();
  const blobEnv = envs.find((e) => e.key === "BLOB_READ_WRITE_TOKEN");
  if (!blobEnv) {
    console.log("BLOB_READ_WRITE_TOKEN이 없습니다. 이미 Cloudinary만 사용 중입니다.");
    return;
  }
  const delQs = useTeam && teamId ? `?teamId=${teamId}` : "";
  const delRes = await fetch(
    `https://api.vercel.com/v9/projects/${projectId}/env/${blobEnv.id}${delQs}`,
    { method: "DELETE", headers: { Authorization: `Bearer ${token}` } }
  );
  if (!delRes.ok) {
    console.error("삭제 실패:", await delRes.text());
    process.exit(1);
  }
  console.log("BLOB_READ_WRITE_TOKEN 제거 완료. Redeploy 하세요.");
}

main().catch(console.error);
