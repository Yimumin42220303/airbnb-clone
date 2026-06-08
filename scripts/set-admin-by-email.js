require("dotenv").config();
const { PrismaClient } = require("@prisma/client");

const email = process.argv[2];
if (!email) {
  console.error("Usage: node scripts/set-admin-by-email.js <email>");
  process.exit(1);
}

const prisma = new PrismaClient();

async function main() {
  const normalized = email.trim().toLowerCase();
  const user = await prisma.user.upsert({
    where: { email: normalized },
    create: { email: normalized, role: "admin" },
    update: { role: "admin" },
    select: { id: true, email: true, role: true },
  });
  console.log(`OK: ${user.email} is now admin (id: ${user.id})`);
  console.log(
    "If this was a new row, sign in with Google/Kakao using this email once to link OAuth."
  );
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
