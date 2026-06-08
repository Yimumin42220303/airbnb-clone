require("dotenv").config({ path: require("path").join(__dirname, "..", ".env"), quiet: true });
const { PrismaClient } = require("@prisma/client");
const fs = require("fs");
const path = require("path");

async function main() {
  const prisma = new PrismaClient();
  const rows = await prisma.$queryRaw`
    SELECT tablename FROM pg_tables WHERE schemaname = 'public' AND tablename = 'ConversationRead'
  `;
  if (Array.isArray(rows) && rows.length > 0) {
    console.log("ConversationRead 테이블 이미 존재");
    await prisma.$disconnect();
    return;
  }

  const sql = fs.readFileSync(
    path.join(__dirname, "..", "prisma", "migrations", "20260601000000_add_conversation_read", "migration.sql"),
    "utf8"
  );
  const statements = sql
    .split(";")
    .map((s) => s.trim())
    .filter(Boolean);

  for (const stmt of statements) {
    await prisma.$executeRawUnsafe(stmt);
    console.log("OK:", stmt.slice(0, 60).replace(/\n/g, " ") + "...");
  }
  console.log("✓ ConversationRead 테이블 생성 완료");
  await prisma.$disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
