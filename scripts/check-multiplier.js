require("dotenv").config();
const { PrismaClient } = require("@prisma/client");

async function main() {
  const p = new PrismaClient();
  try {
    const listing = await p.listing.findUnique({
      where: { id: "cmlqncu3000015a3wlri78qae" },
      select: {
        id: true,
        title: true,
        beds24Enabled: true,
        beds24PropId: true,
        beds24RoomId: true,
        beds24PriceMultiplier: true,
        pricePerNight: true,
        cleaningFee: true,
      },
    });
    console.log("=== Listing ===");
    console.log(JSON.stringify(listing, null, 2));

    const rows = await p.listingAvailability.findMany({
      where: {
        listingId: "cmlqncu3000015a3wlri78qae",
        date: { in: ["2026-05-10", "2026-05-11", "2026-05-12"] },
      },
    });
    console.log("\n=== ListingAvailability (5/10-5/12) ===");
    console.log(JSON.stringify(rows, null, 2));

    const allRows = await p.listingAvailability.findMany({
      where: {
        listingId: "cmlqncu3000015a3wlri78qae",
        date: { gte: "2026-05-01", lte: "2026-05-15" },
      },
      orderBy: { date: "asc" },
    });
    console.log("\n=== ListingAvailability (5/1-5/15) ===");
    console.log(JSON.stringify(allRows, null, 2));
  } finally {
    await p.$disconnect();
  }
}

main().catch(console.error);
