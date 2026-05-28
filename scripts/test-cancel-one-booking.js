require("dotenv").config({ path: require("path").join(__dirname, "..", ".env") });

async function main() {
  // Dynamic import for TS module - use compiled approach via tsx or direct prisma
  const { PrismaClient } = require("@prisma/client");
  const prisma = new PrismaClient();
  const bookingId = "cmoufdf1y00012mzpks4pg0bu";
  const MS48 = 48 * 60 * 60 * 1000;
  const now = new Date();
  const cancelCutoff = new Date(now.getTime() - MS48);

  const b = await prisma.booking.findUnique({
    where: { id: bookingId },
    select: {
      id: true,
      status: true,
      paymentStatus: true,
      paymentMethod: true,
      confirmedAt: true,
      createdAt: true,
    },
  });
  console.log("Before:", b);
  console.log("cancelCutoff:", cancelCutoff.toISOString());
  console.log("eligible:", b?.confirmedAt && b.confirmedAt <= cancelCutoff);

  const { count } = await prisma.booking.updateMany({
    where: {
      id: bookingId,
      status: "confirmed",
      paymentStatus: "pending",
      paymentMethod: { not: "deferred" },
    },
    data: { status: "cancelled" },
  });
  console.log("updateMany count (dry run logic):", count);

  await prisma.$disconnect();
}

main().catch(console.error);
