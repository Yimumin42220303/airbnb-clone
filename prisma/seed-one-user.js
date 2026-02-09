/**
 * DB에 사용자 1명만 추가 (로그인 없이 숙소 등록 시 대체 소유자용)
 * 실행: node prisma/seed-one-user.js
 */
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function main() {
  const user = await prisma.user.upsert({
    where: { email: "dev@example.com" },
    update: {},
    create: {
      email: "dev@example.com",
      name: "개발용 사용자",
      role: "user",
    },
  });
  console.log("✅ 사용자 추가됨:", user.email, "(id:", user.id, ")");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
