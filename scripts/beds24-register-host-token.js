/**
 * 신규 호스트 Beds24 Refresh Token 등록 (.env + 선택적 Vercel)
 *
 * 사용:
 *   node scripts/beds24-register-host-token.js ASAHISTAY "REFRESH_TOKEN"
 *   node scripts/beds24-register-host-token.js ASAHISTAY --from-invite "INVITE_CODE"
 *   $env:VERCEL_TOKEN="..."; node scripts/beds24-register-host-token.js ASAHISTAY "TOKEN" --vercel
 *
 * Account Key: 영문 대문자/숫자/밑줄만. 숙소 편집의「Beds24 Account Key」와 동일하게 입력.
 */

require("dotenv").config({ path: require("path").join(__dirname, "..", ".env") });

const fs = require("fs");
const path = require("path");

const accountKey = process.argv[2]?.trim().toUpperCase();
const fromInviteIdx = process.argv.indexOf("--from-invite");
const vercel = process.argv.includes("--vercel");
let refreshToken =
  fromInviteIdx >= 0
    ? null
    : process.argv[3]?.trim();

if (!accountKey || !/^[A-Z0-9_]+$/.test(accountKey)) {
  console.error("사용법: node scripts/beds24-register-host-token.js ACCOUNT_KEY [REFRESH_TOKEN|--from-invite CODE] [--vercel]");
  process.exit(1);
}

async function fetchRefreshTokenFromInvite(inviteCode) {
  const res = await fetch("https://beds24.com/api/v2/authentication/setup", {
    method: "GET",
    headers: { Accept: "application/json", code: inviteCode },
  });
  const text = await res.text();
  let data;
  try {
    data = JSON.parse(text);
  } catch {
    throw new Error(`응답 파싱 실패: ${text.slice(0, 200)}`);
  }
  if (!res.ok) {
    throw new Error(data.error || data.message || `${res.status}`);
  }
  if (!data.refreshToken) throw new Error("refreshToken 없음");
  return data.refreshToken;
}

function upsertEnvKey(envPath, key, value) {
  const line = `${key}="${value.replace(/"/g, '\\"')}"`;
  let content = fs.existsSync(envPath) ? fs.readFileSync(envPath, "utf8") : "";
  const re = new RegExp(`^${key}=.*$`, "m");
  if (re.test(content)) {
    content = content.replace(re, line);
  } else {
    if (content.length && !content.endsWith("\n")) content += "\n";
    content += `\n# Beds24 호스트 계정 (${accountKey})\n${line}\n`;
  }
  fs.writeFileSync(envPath, content, "utf8");
}

async function addVercelEnv(key, value) {
  const token = process.env.VERCEL_TOKEN;
  if (!token) throw new Error("VERCEL_TOKEN 필요");
  const teamId = process.env.VERCEL_TEAM_ID || null;
  let projectId = process.env.VERCEL_PROJECT_ID || "prj_airbnb-clone";
  const qs = teamId ? `?teamId=${teamId}&upsert=true` : "?upsert=true";
  const res = await fetch(`https://api.vercel.com/v10/projects/${projectId}/env${qs}`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      key,
      value,
      type: "encrypted",
      target: ["production", "preview", "development"],
    }),
  });
  if (!res.ok) throw new Error(`${res.status} ${await res.text()}`);
}

async function verifyToken(token) {
  const res = await fetch("https://beds24.com/api/v2/authentication/token", {
    method: "GET",
    headers: { Accept: "application/json", refreshToken: token },
  });
  if (!res.ok) return false;
  const data = await res.json();
  return !!data.token;
}

async function main() {
  if (fromInviteIdx >= 0) {
    const inviteCode = process.argv[fromInviteIdx + 1]?.trim();
    if (!inviteCode) {
      console.error("--from-invite 뒤에 Invite Code 필요");
      process.exit(1);
    }
    console.log("Invite Code → Refresh Token 발급 중...");
    refreshToken = await fetchRefreshTokenFromInvite(inviteCode);
  }

  if (!refreshToken) {
    console.error("Refresh Token이 없습니다.");
    process.exit(1);
  }

  const envKey = `BEDS24_REFRESH_TOKEN_${accountKey}`;
  const root = path.join(__dirname, "..");
  for (const name of [".env", ".env.local"]) {
    const p = path.join(root, name);
    upsertEnvKey(p, envKey, refreshToken);
    console.log(`✓ ${name} → ${envKey}`);
  }

  console.log("토큰 검증 중...");
  const ok = await verifyToken(refreshToken);
  console.log(ok ? "✓ Access Token 발급 성공" : "✗ 토큰 검증 실패");

  if (vercel) {
    console.log(`Vercel env 등록: ${envKey}...`);
    await addVercelEnv(envKey, refreshToken);
    console.log("✓ Vercel 등록 완료 (재배포 필요: npm run deploy:cli)");
  }

  console.log("\n=== 다음 단계 ===");
  console.log(`1. 관리자로 /host/listings/{id}/edit → Beds24 Account Key: ${accountKey}`);
  console.log("2. Prop ID / Room ID 입력 후 저장");
  console.log("3. 「연동 테스트(디버그)」로 availabilityStatus: 200 확인");
  if (!vercel) {
    console.log(`4. Vercel: $env:VERCEL_TOKEN="..."; node scripts/beds24-register-host-token.js ${accountKey} "..." --vercel`);
    console.log("   또는 npm run deploy:cli (로컬 .env만 쓰는 경우 생략 가능)");
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
