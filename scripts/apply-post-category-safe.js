#!/usr/bin/env node
/**
 * Post.category nullable 컬럼만 idempotent 추가 (기존 글 값 변경 없음).
 * .env / .env.local / (선택) Vercel production DATABASE_URL 모두 점검·적용.
 * migrate deploy 전체가 위험한 환경(baseline 불일치)에서도 안전하게 적용.
 *
 * 점검만: npm run db:apply-post-category
 * (이 스크립트는 누락 시 자동 적용합니다. ADD COLUMN IF NOT EXISTS 라 재실행 안전)
 */
const fs = require("fs");
const path = require("path");
const { spawnSync } = require("child_process");

require("dotenv").config({
  path: path.join(__dirname, "..", ".env"),
  override: true,
});

const STATEMENTS = [
  `ALTER TABLE "Post" ADD COLUMN IF NOT EXISTS "category" TEXT`,
  `CREATE INDEX IF NOT EXISTS "Post_category_idx" ON "Post"("category")`,
];

function parseHost(databaseUrl) {
  if (!databaseUrl?.trim()) return null;
  try {
    return new URL(
      databaseUrl.trim().replace(/^["']|["']$/g, "").replace(/^postgres(ql)?:\/\//, "https://")
    ).hostname;
  } catch {
    return "(parse_error)";
  }
}

function readDatabaseUrlFromFile(relPath) {
  const full = path.join(__dirname, "..", relPath);
  if (!fs.existsSync(full)) return { file: relPath, url: null, host: null };
  const text = fs.readFileSync(full, "utf8");
  const m = text.match(/^DATABASE_URL\s*=\s*(.+)$/m);
  const raw = m ? m[1].trim().replace(/^["']|["']$/g, "") : null;
  return { file: relPath, url: raw, host: parseHost(raw) };
}

async function applyTo(label, databaseUrl) {
  const host = parseHost(databaseUrl);
  console.log(`  [${label}] 호스트: ${host}`);

  const { PrismaClient } = require("@prisma/client");
  const prisma = new PrismaClient({ datasources: { db: { url: databaseUrl } } });
  try {
    for (const sql of STATEMENTS) {
      await prisma.$executeRawUnsafe(sql);
    }
    const cols = await prisma.$queryRaw`
      SELECT column_name FROM information_schema.columns
      WHERE table_schema = 'public' AND table_name = 'Post' AND column_name = 'category'`;
    if (cols.length === 1) {
      console.log(`    ✅ category 컬럼 확인`);
      return true;
    }
    console.log(`    ❌ category 컬럼이 보이지 않습니다`);
    return false;
  } finally {
    await prisma.$disconnect();
  }
}

function fetchVercelProductionDatabaseUrl() {
  const token = process.env.VERCEL_TOKEN?.trim();
  const projectId = process.env.VERCEL_PROJECT_ID?.trim();
  if (!token || !projectId) return null;
  const r = spawnSync(
    "npx",
    ["vercel", "env", "pull", ".env.vercel.tmp", "--environment=production", "--yes", "--token", token],
    { encoding: "utf-8", shell: true, cwd: path.join(__dirname, "..") }
  );
  if (r.status !== 0) return null;
  const parsed = readDatabaseUrlFromFile(".env.vercel.tmp");
  try {
    fs.unlinkSync(path.join(__dirname, "..", ".env.vercel.tmp"));
  } catch {
    /* ignore */
  }
  return parsed.url;
}

async function main() {
  console.log("\n=== Post.category 안전 적용 (nullable 컬럼 추가, 기존 글 값 유지) ===\n");

  const sources = [readDatabaseUrlFromFile(".env"), readDatabaseUrlFromFile(".env.local")];
  const vercelUrl = fetchVercelProductionDatabaseUrl();
  if (vercelUrl) sources.push({ file: "Vercel production", url: vercelUrl, host: parseHost(vercelUrl) });
  else if (process.env.VERCEL_TOKEN?.trim()) console.log("  (Vercel production DATABASE_URL 조회 실패 — 건너뜀)");
  else console.log("  (VERCEL_TOKEN 없어 Vercel production 점검 생략)\n");

  const seen = new Set();
  const results = [];
  for (const s of sources) {
    if (!s.url) {
      console.log(`  [${s.file}] DATABASE_URL 없음 — 건너뜀`);
      continue;
    }
    if (seen.has(s.host)) {
      console.log(`  [${s.file}] 호스트가 이미 처리됨(${s.host}) — 생략`);
      continue;
    }
    seen.add(s.host);
    results.push(await applyTo(s.file, s.url));
  }

  console.log("");
  if (results.length && results.every(Boolean)) {
    console.log("✅ 점검한 모든 DB에 category 컬럼이 있습니다.\n");
  } else {
    console.log("⚠ 일부 DB 적용에 실패했습니다. 위 로그를 확인하세요.\n");
    process.exit(1);
  }
}

main().catch((e) => {
  console.error("[apply-post-category] 실패:", e.message);
  process.exit(1);
});
