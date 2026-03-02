#!/usr/bin/env node
/**
 * 배포 스크립트
 *
 * 1) 기본: git push → (선택) Deploy Hook/API로 Vercel 배포 트리거
 *    npm run deploy
 *
 * 2) Vercel CLI 직접 배포 (환경변수 VERCEL_ORG_ID, VERCEL_PROJECT_ID 설정 시)
 *    npm run deploy -- --vercel
 */

require("dotenv").config({ path: require("path").join(__dirname, "..", ".env") });
const { execSync, spawn } = require("child_process");
const path = require("path");

function run(cmd, args, opts = {}) {
  return new Promise((resolve, reject) => {
    const proc = spawn(cmd, args, { stdio: "inherit", shell: true, ...opts });
    proc.on("close", (code) => (code === 0 ? resolve() : reject(new Error(`exit ${code}`))));
  });
}

function exec(cmd, opts = {}) {
  return execSync(cmd, { encoding: "utf-8", ...opts }).trim();
}

async function main() {
  const useVercelCli = process.argv.includes("--vercel");
  const hasVercelEnv = process.env.VERCEL_ORG_ID && process.env.VERCEL_PROJECT_ID;

  if (useVercelCli && hasVercelEnv) {
    console.log("[deploy] Vercel CLI 직접 배포 (환경변수 사용)\n");
    try {
      await run("npx", ["vercel", "deploy", "--prod", "--yes"]);
      console.log("\n[deploy] ✅ Vercel 배포 완료");
    } catch (e) {
      console.error("[deploy] Vercel CLI 오류:", e.message);
      process.exit(1);
    }
    return;
  }

  if (useVercelCli && !hasVercelEnv) {
    console.warn("[deploy] VERCEL_ORG_ID, VERCEL_PROJECT_ID 환경변수가 없습니다.");
    console.warn("         .env.example 참고 후 .env에 설정하세요.\n");
  }

  // 기본: git push
  console.log("[deploy] git push → Vercel Git 연동 배포\n");
  let remoteUrl = "";
  try {
    remoteUrl = exec("git config --get remote.origin.url");
  } catch {
    /* ignore */
  }
  if (remoteUrl) {
    console.log("  origin:", remoteUrl);
    console.log("  → Vercel Git 연동이 이 저장소를 보고 있어야 배포됩니다.\n");
  }

  try {
    execSync("git add .", { stdio: "inherit" });
    const status = exec("git status --short");
    if (!status) {
      console.log("[deploy] 변경 없음, push 스킵");
      return;
    }
    execSync("git commit -m \"auto: vercel deploy\"", { stdio: "inherit" });
    await run("git", ["push"]);
    console.log("\n[deploy] ✅ push 완료");
    // Deploy Hook 또는 VERCEL_TOKEN 있으면 배포 트리거 (Git webhook 미동작 시 대비)
    if (process.env.VERCEL_DEPLOY_HOOK || process.env.VERCEL_TOKEN) {
      try {
        const { spawnSync } = require("child_process");
        const r = spawnSync("node", ["scripts/vercel-redeploy.js"], {
          stdio: "inherit",
          env: process.env,
        });
        if (r.status === 0) console.log("[deploy] Vercel 배포 트리거 완료");
      } catch (_) {
        /* ignore */
      }
    } else {
      console.log("[deploy] Vercel Git 연동으로 배포 트리거됨");
      if (process.env.VERCEL_ORG_ID && process.env.VERCEL_PROJECT_ID) {
        console.log("[deploy] 배포가 안 되면: npm run deploy:cli (로컬→Vercel 직접 배포)");
      }
    }
  } catch (e) {
    console.error("[deploy] 오류:", e.message);
    process.exit(1);
  }
}

main();
