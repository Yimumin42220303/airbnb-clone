#!/usr/bin/env node
/**
 * Listing 신뢰 필드 5개만 idempotent 추가 (기존 데이터 변경 없음).
 * migrate deploy 전체가 위험한 환경(baseline 불일치)에서도 안전하게 적용.
 *
 * 사용: npm run db:apply-trust-fields
 * 여러 env(.env / .env.local / Vercel) 점검: npm run db:verify-trust-env [-- --apply]
 */
require("dotenv").config({ path: require("path").join(__dirname, "..", ".env") });
const { PrismaClient } = require("@prisma/client");

const STATEMENTS = [
  `ALTER TABLE "Listing" ADD COLUMN IF NOT EXISTS "checkInMethod" TEXT`,
  `ALTER TABLE "Listing" ADD COLUMN IF NOT EXISTS "infoVerifiedAt" TIMESTAMP(3)`,
  `ALTER TABLE "Listing" ADD COLUMN IF NOT EXISTS "verifiedAt" TIMESTAMP(3)`,
  `ALTER TABLE "Listing" ADD COLUMN IF NOT EXISTS "licenseType" TEXT`,
  `ALTER TABLE "Listing" ADD COLUMN IF NOT EXISTS "licenseNumber" TEXT`,
];

async function main() {
  const url = process.env.DATABASE_URL || "";
  if (!url) {
    console.error("[apply-trust-fields] DATABASE_URL이 없습니다.");
    process.exit(1);
  }
  let host = "(unknown)";
  try {
    host = new URL(url.replace(/^postgres(ql)?:\/\//, "https://")).hostname;
  } catch {
    /* ignore */
  }
  console.log(`[apply-trust-fields] 대상 DB 호스트: ${host}`);
  console.log("[apply-trust-fields] Listing 테이블에 nullable 컬럼 5개만 추가합니다 (기존 행 값 유지).");

  const prisma = new PrismaClient();
  try {
    for (const sql of STATEMENTS) {
      await prisma.$executeRawUnsafe(sql);
      console.log(`  OK: ${sql.slice(0, 60)}...`);
    }

    const cols = await prisma.$queryRaw`
      SELECT column_name
      FROM information_schema.columns
      WHERE table_schema = 'public'
        AND table_name = 'Listing'
        AND column_name IN (
          'checkInMethod', 'infoVerifiedAt', 'verifiedAt', 'licenseType', 'licenseNumber'
        )
      ORDER BY column_name`;
    console.log("[apply-trust-fields] 확인된 컬럼:", cols.map((r) => r.column_name).join(", "));
    if (cols.length !== 5) {
      console.warn("[apply-trust-fields] 경고: 5개 컬럼이 모두 보이지 않습니다. 수동 확인이 필요합니다.");
      process.exit(1);
    }
    console.log("[apply-trust-fields] 완료.");
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((e) => {
  console.error("[apply-trust-fields] 실패:", e.message);
  process.exit(1);
});
