#!/usr/bin/env node
/**
 * DATABASE_URL 호스트 비교 + Listing 신뢰 컬럼 5개 존재 여부 (비밀번호 미출력)
 * 로컬 .env / .env.local / (선택) Vercel production
 */
const fs = require("fs");
const path = require("path");
const { spawnSync } = require("child_process");

require("dotenv").config({
  path: path.join(__dirname, "..", ".env"),
  override: true,
});

const TRUST_COLS = [
  "checkInMethod",
  "infoVerifiedAt",
  "verifiedAt",
  "licenseType",
  "licenseNumber",
];

const STATEMENTS = [
  `ALTER TABLE "Listing" ADD COLUMN IF NOT EXISTS "checkInMethod" TEXT`,
  `ALTER TABLE "Listing" ADD COLUMN IF NOT EXISTS "infoVerifiedAt" TIMESTAMP(3)`,
  `ALTER TABLE "Listing" ADD COLUMN IF NOT EXISTS "verifiedAt" TIMESTAMP(3)`,
  `ALTER TABLE "Listing" ADD COLUMN IF NOT EXISTS "licenseType" TEXT`,
  `ALTER TABLE "Listing" ADD COLUMN IF NOT EXISTS "licenseNumber" TEXT`,
];

function parseHost(databaseUrl) {
  if (!databaseUrl?.trim()) return null;
  try {
    const u = new URL(
      databaseUrl.trim().replace(/^["']|["']$/g, "").replace(/^postgres(ql)?:\/\//, "https://")
    );
    return u.hostname;
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

async function checkAndMaybeApply(label, databaseUrl, apply) {
  const host = parseHost(databaseUrl);
  if (!databaseUrl) {
    console.log(`  [${label}] DATABASE_URL 없음 — 건너뜀`);
    return { label, host, ok: false, skipped: true };
  }
  console.log(`  [${label}] 호스트: ${host}`);

  const { PrismaClient } = require("@prisma/client");
  const prisma = new PrismaClient({
    datasources: { db: { url: databaseUrl } },
  });

  try {
    let cols = await prisma.$queryRaw`
      SELECT column_name FROM information_schema.columns
      WHERE table_schema = 'public' AND table_name = 'Listing'
        AND column_name IN (
          'checkInMethod', 'infoVerifiedAt', 'verifiedAt', 'licenseType', 'licenseNumber'
        )
      ORDER BY column_name`;

    const names = cols.map((r) => r.column_name);
    const missing = TRUST_COLS.filter((c) => !names.includes(c));

    if (missing.length === 0) {
      console.log(`    ✅ 신뢰 컬럼 5/5 존재`);
      return { label, host, ok: true, applied: false };
    }

    console.log(`    ⚠ 누락: ${missing.join(", ")} (${names.length}/5)`);

    if (!apply) {
      return { label, host, ok: false, missing };
    }

    for (const sql of STATEMENTS) {
      await prisma.$executeRawUnsafe(sql);
    }
    cols = await prisma.$queryRaw`
      SELECT column_name FROM information_schema.columns
      WHERE table_schema = 'public' AND table_name = 'Listing'
        AND column_name IN (
          'checkInMethod', 'infoVerifiedAt', 'verifiedAt', 'licenseType', 'licenseNumber'
        )`;
    const after = cols.map((r) => r.column_name);
    const stillMissing = TRUST_COLS.filter((c) => !after.includes(c));
    if (stillMissing.length) {
      console.log(`    ❌ 적용 후에도 누락: ${stillMissing.join(", ")}`);
      return { label, host, ok: false, applied: true };
    }
    console.log(`    ✅ 적용 완료 (5/5)`);
    return { label, host, ok: true, applied: true };
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
    {
      encoding: "utf-8",
      shell: true,
      cwd: path.join(__dirname, ".."),
    }
  );
  if (r.status !== 0) {
    console.log("  [Vercel] env pull 실패 (토큰/권한 확인)");
    return null;
  }
  const tmp = path.join(__dirname, "..", ".env.vercel.tmp");
  if (!fs.existsSync(tmp)) return null;
  const parsed = readDatabaseUrlFromFile(".env.vercel.tmp");
  try {
    fs.unlinkSync(tmp);
  } catch {
    /* ignore */
  }
  return parsed.url;
}

async function main() {
  const apply = process.argv.includes("--apply");

  console.log("\n=== DB 신뢰 필드 환경 점검 (호스트만 표시) ===\n");

  const sources = [
    readDatabaseUrlFromFile(".env"),
    readDatabaseUrlFromFile(".env.local"),
  ];

  const hosts = new Set();
  for (const s of sources) {
    if (s.host) hosts.add(s.host);
    console.log(`  ${s.file}: ${s.host ?? "(없음)"}`);
  }

  let vercelUrl = null;
  try {
    vercelUrl = fetchVercelProductionDatabaseUrl();
  } catch (e) {
    console.log("  Vercel production: 조회 생략 —", e.message);
  }
  if (vercelUrl) {
    const vHost = parseHost(vercelUrl);
    hosts.add(vHost);
    console.log(`  Vercel production: ${vHost}`);
  } else if (process.env.VERCEL_TOKEN?.trim()) {
    console.log("  Vercel production: DATABASE_URL 조회 실패");
  } else {
    console.log("  Vercel production: VERCEL_TOKEN 없어 생략");
  }

  if (hosts.size > 1) {
    console.log("\n⚠ 서로 다른 DB 호스트가 있습니다. 각 DB에 신뢰 컬럼이 있어야 합니다.\n");
  } else if (hosts.size === 1) {
    console.log("\n✓ 로컬 env 파일들의 DB 호스트가 동일합니다.\n");
  }

  console.log(apply ? "=== 컬럼 확인 및 누락 시 적용 (--apply) ===\n" : "=== 컬럼 확인만 (적용: --apply) ===\n");

  const results = [];
  const seenHosts = new Set();

  for (const s of sources) {
    if (!s.url || seenHosts.has(s.host)) continue;
    seenHosts.add(s.host);
    results.push(await checkAndMaybeApply(s.file, s.url, apply));
  }

  if (vercelUrl) {
    const vHost = parseHost(vercelUrl);
    if (!seenHosts.has(vHost)) {
      seenHosts.add(vHost);
      results.push(await checkAndMaybeApply("Vercel production", vercelUrl, apply));
    } else {
      console.log("  [Vercel production] 호스트가 로컬과 동일 — 중복 적용 생략");
    }
  }

  const failed = results.filter((r) => !r.skipped && !r.ok);
  console.log("");
  if (failed.length) {
    console.log("❌ 일부 DB에 신뢰 컬럼이 없습니다. 실행: npm run db:verify-trust-env -- --apply\n");
    process.exit(1);
  }
  console.log("✅ 확인한 DB에 신뢰 컬럼이 모두 있습니다.\n");
  if (!apply && results.some((r) => r.missing?.length)) {
    process.exit(1);
  }
}

main().catch((e) => {
  console.error(e.message);
  process.exit(1);
});
