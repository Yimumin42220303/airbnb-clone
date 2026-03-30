#!/usr/bin/env node
/**
 * DB 백업 스크립트 — pg_dump로 전체 데이터베이스를 로컬에 백업
 *
 * 사용법:
 *   npm run db:backup
 *   node scripts/db-backup.js
 *
 * 결과:
 *   backups/backup-2026-03-30-153000.sql.gz
 */

require("dotenv").config();
const { execSync } = require("child_process");
const fs = require("fs");
const path = require("path");

const BACKUP_DIR = path.join(__dirname, "..", "backups");

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

function timestamp() {
  const d = new Date();
  const pad = (n) => String(n).padStart(2, "0");
  return [
    d.getFullYear(),
    pad(d.getMonth() + 1),
    pad(d.getDate()),
    "-",
    pad(d.getHours()),
    pad(d.getMinutes()),
    pad(d.getSeconds()),
  ].join("");
}

function main() {
  if (!fs.existsSync(BACKUP_DIR)) {
    fs.mkdirSync(BACKUP_DIR, { recursive: true });
    console.log(`📁 백업 디렉터리 생성: ${BACKUP_DIR}`);
  }

  const ts = timestamp();
  const sqlFile = path.join(BACKUP_DIR, `backup-${ts}.sql`);
  const gzFile = `${sqlFile}.gz`;
  const dbUrl = getDbUrl();

  console.log(`🔄 pg_dump 실행 중...`);

  try {
    execSync(`pg_dump "${dbUrl}" --no-owner --no-acl -f "${sqlFile}"`, {
      stdio: "inherit",
    });
  } catch {
    console.error("\n❌ pg_dump 실패. PostgreSQL 클라이언트가 설치되어 있는지 확인하세요:");
    console.error("   Windows: https://www.postgresql.org/download/windows/");
    console.error("   Mac: brew install postgresql");
    process.exit(1);
  }

  const sqlSize = fs.statSync(sqlFile).size;
  console.log(`📄 SQL 덤프 완료: ${(sqlSize / 1024 / 1024).toFixed(2)} MB`);

  try {
    const zlib = require("zlib");
    const input = fs.readFileSync(sqlFile);
    const compressed = zlib.gzipSync(input);
    fs.writeFileSync(gzFile, compressed);
    fs.unlinkSync(sqlFile);
    const gzSize = fs.statSync(gzFile).size;
    console.log(
      `✅ 백업 완료: ${path.basename(gzFile)} (${(gzSize / 1024 / 1024).toFixed(2)} MB)`
    );
  } catch {
    console.log(`✅ 백업 완료 (비압축): ${path.basename(sqlFile)}`);
  }
}

main();
