#!/usr/bin/env node
/**
 * DB 복원 스크립트 — 백업 파일에서 데이터베이스 복원
 *
 * 사용법:
 *   npm run db:restore -- backups/backup-2026-03-30-153000.sql.gz
 *   node scripts/db-restore.js backups/backup-2026-03-30-153000.sql.gz
 */

require("dotenv").config();
const { execSync } = require("child_process");
const fs = require("fs");
const path = require("path");
const readline = require("readline");

function getDbUrl() {
  const url = process.env.DIRECT_URL || process.env.DATABASE_URL;
  if (!url) {
    console.error(
      "ERROR: DATABASE_URL 또는 DIRECT_URL이 .env에 설정되어 있지 않습니다."
    );
    process.exit(1);
  }
  return url;
}

function askConfirm(question) {
  return new Promise((resolve) => {
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
    });
    rl.question(question, (answer) => {
      rl.close();
      resolve(answer.toLowerCase().trim());
    });
  });
}

async function main() {
  const backupFile = process.argv[2];
  if (!backupFile) {
    console.error("사용법: node scripts/db-restore.js <백업파일경로>");
    console.error("예시:   node scripts/db-restore.js backups/backup-2026-03-30-153000.sql.gz");
    process.exit(1);
  }

  const fullPath = path.resolve(backupFile);
  if (!fs.existsSync(fullPath)) {
    console.error(`파일을 찾을 수 없습니다: ${fullPath}`);
    process.exit(1);
  }

  const dbUrl = getDbUrl();
  const host = new URL(dbUrl).hostname;

  console.log(`\n⚠️  경고: 이 작업은 현재 데이터베이스의 데이터를 덮어씁니다!`);
  console.log(`   대상 DB: ${host}`);
  console.log(`   백업 파일: ${path.basename(fullPath)}`);

  const answer = await askConfirm("\n계속하시겠습니까? (yes/no): ");
  if (answer !== "yes" && answer !== "y") {
    console.log("취소되었습니다.");
    process.exit(0);
  }

  let sqlFile = fullPath;
  const isGzipped = fullPath.endsWith(".gz");

  if (isGzipped) {
    console.log("🔄 gzip 압축 해제 중...");
    const zlib = require("zlib");
    const compressed = fs.readFileSync(fullPath);
    const decompressed = zlib.gunzipSync(compressed);
    sqlFile = fullPath.replace(/\.gz$/, "");
    fs.writeFileSync(sqlFile, decompressed);
  }

  console.log("🔄 데이터베이스 복원 중...");

  try {
    execSync(`psql "${dbUrl}" -f "${sqlFile}"`, { stdio: "inherit" });
    console.log("\n✅ 복원 완료!");
  } catch {
    console.error("\n❌ 복원 실패. psql이 설치되어 있는지 확인하세요.");
    process.exit(1);
  } finally {
    if (isGzipped && fs.existsSync(sqlFile)) {
      fs.unlinkSync(sqlFile);
    }
  }
}

main();
