/**
 * 기존 Listing 행의 status를 'approved'로 한 번만 실행
 * node scripts/backfill-listing-status.js
 */
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function main() {
  const result = await prisma.listing.updateMany({
    where: { status: "pending" },
    data: { status: "approved", approvedAt: new Date() },
  });
  console.log("Updated", result.count, "listings to approved");
}

main()
  .then(() => process.exit(0))
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
