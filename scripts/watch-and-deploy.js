/**
 * 파일 변경 감지 → 자동 git commit & push → Vercel 자동 배포
 *
 * 사용법: npm run deploy:watch
 * (백그라운드 실행 권장. Ctrl+C로 중지)
 *
 * 감시 대상: src/, prisma/, next.config, tailwind, package.json 등
 * 변경 후 5초 대기 후 자동 push (연속 수정 시 마지막 변경 기준)
 */

const { spawn } = require("child_process");
const path = require("path");
const fs = require("fs");

const WATCH_DIRS = ["src", "prisma", "public"];
const WATCH_FILES = ["next.config.mjs", "tailwind.config.ts", "package.json"];
const DEBOUNCE_MS = 5000;

let debounceTimer = null;

function run(cmd, args, cwd = process.cwd()) {
  return new Promise((resolve, reject) => {
    const proc = spawn(cmd, args, { cwd, stdio: "inherit", shell: true });
    proc.on("close", (code) => (code === 0 ? resolve() : reject(new Error(`exit ${code}`))));
  });
}

async function deploy() {
  console.log("\n[deploy] 변경 감지 → push 시작...");
  try {
    const { execSync } = require("child_process");
    await run("git", ["add", "."]);
    const out = execSync("git status --short", { encoding: "utf-8", cwd: process.cwd() });
    if (!out.trim()) {
      console.log("[deploy] 변경 없음, 스킵");
      return;
    }

    await run("git", ["commit", "-m", "auto: vercel deploy"]);
    await run("git", ["push"]);
    console.log("[deploy] ✅ push 완료 → Vercel 배포 트리거됨");
  } catch (e) {
    console.error("[deploy] 오류:", e.message);
  }
}

function scheduleDeploy() {
  if (debounceTimer) clearTimeout(debounceTimer);
  debounceTimer = setTimeout(deploy, DEBOUNCE_MS);
}

function watchDir(dir) {
  const full = path.join(process.cwd(), dir);
  if (!fs.existsSync(full)) return;
  fs.watch(full, { recursive: true }, (ev, name) => {
    if (name && !name.includes("node_modules")) {
      console.log(`[watch] ${dir}/${name}`);
      scheduleDeploy();
    }
  });
}

function watchFile(file) {
  const full = path.join(process.cwd(), file);
  if (!fs.existsSync(full)) return;
  fs.watch(full, (ev, name) => {
    console.log(`[watch] ${file}`);
    scheduleDeploy();
  });
}

console.log("👀 Cursor 수정 → 5초 후 자동 push → Vercel 배포");
console.log("   감시: src/, prisma/, public/, next.config, tailwind, package.json");
console.log("   중지: Ctrl+C\n");

WATCH_DIRS.forEach(watchDir);
WATCH_FILES.forEach(watchFile);
