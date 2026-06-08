require("dotenv").config({ path: require("path").join(__dirname, "..", ".env") });
const { PrismaClient } = require("@prisma/client");

const MS48 = 48 * 60 * 60 * 1000;
const prisma = new PrismaClient();

async function main() {
  const now = Date.now();
  const stale = await prisma.booking.findMany({
    where: {
      paymentStatus: "pending",
      status: { in: ["confirmed", "pending"] },
      createdAt: { lte: new Date(now - MS48) },
    },
    select: {
      id: true,
      status: true,
      paymentStatus: true,
      paymentMethod: true,
      confirmedAt: true,
      createdAt: true,
      listing: { select: { instantBooking: true, title: true } },
    },
    orderBy: { createdAt: "asc" },
    take: 20,
  });

  console.log("Stale unpaid bookings (created 48h+ ago):", stale.length);
  for (const b of stale) {
    const wouldCancel =
      b.status === "confirmed" &&
      b.confirmedAt &&
      now - b.confirmedAt.getTime() > MS48 &&
      b.paymentMethod !== "deferred";

    let skipReason = "eligible";
    if (b.status !== "confirmed") skipReason = "status_not_confirmed (host approval pending?)";
    else if (!b.confirmedAt) skipReason = "confirmedAt_null";
    else if (b.paymentMethod === "deferred") skipReason = "deferred";
    else if (now - b.confirmedAt.getTime() <= MS48) skipReason = "within_48h_of_confirmedAt";

    console.log({
      id: b.id,
      listing: b.listing.title?.slice(0, 30),
      instant: b.listing.instantBooking,
      status: b.status,
      confirmedAt: b.confirmedAt?.toISOString() ?? null,
      createdAt: b.createdAt.toISOString(),
      daysSinceCreate: ((now - b.createdAt.getTime()) / 86400000).toFixed(1),
      wouldAutoCancel: wouldCancel,
      skipReason,
    });
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
