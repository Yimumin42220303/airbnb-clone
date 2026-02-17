/**
 * 시드로 생성된 숙소 6개만 DB에서 삭제 (host@example.com 소유)
 *
 * 사용법: npm run db:remove-seed-listings
 * 대상 DB: .env의 DATABASE_URL (로컬/프로덕션 구분 없이 현재 연결된 DB)
 *
 * 다른 호스트가 등록한 숙소는 삭제하지 않습니다.
 */

const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

const SEED_HOST_EMAIL = "host@example.com";

async function main() {
  const host = await prisma.user.findUnique({
    where: { email: SEED_HOST_EMAIL },
    select: { id: true },
  });

  if (!host) {
    console.log("시드 호스트(host@example.com)가 없습니다. 삭제할 시드 숙소가 없어요.");
    return;
  }

  const listingIds = await prisma.listing
    .findMany({
      where: { userId: host.id },
      select: { id: true },
    })
    .then((rows) => rows.map((r) => r.id));

  if (listingIds.length === 0) {
    console.log("시드 호스트 소유 숙소가 없습니다.");
    return;
  }

  // FK 순서대로 삭제 (시드 숙소 관련만)
  const bookingIds = await prisma.booking
    .findMany({
      where: { listingId: { in: listingIds } },
      select: { id: true },
    })
    .then((rows) => rows.map((r) => r.id));

  if (bookingIds.length > 0) {
    const convIds = await prisma.conversation
      .findMany({
        where: { bookingId: { in: bookingIds } },
        select: { id: true },
      })
      .then((rows) => rows.map((r) => r.id));
    if (convIds.length > 0) {
      await prisma.message.deleteMany({ where: { conversationId: { in: convIds } } });
      await prisma.conversation.deleteMany({ where: { id: { in: convIds } } });
    }
    await prisma.paymentTransaction.deleteMany({ where: { bookingId: { in: bookingIds } } });
    await prisma.booking.deleteMany({ where: { id: { in: bookingIds } } });
  }

  await prisma.review.deleteMany({ where: { listingId: { in: listingIds } } });
  await prisma.listingAmenity.deleteMany({ where: { listingId: { in: listingIds } } });
  await prisma.listingImage.deleteMany({ where: { listingId: { in: listingIds } } });
  await prisma.listingAvailability.deleteMany({ where: { listingId: { in: listingIds } } });
  await prisma.wishlist.deleteMany({ where: { listingId: { in: listingIds } } });
  const result = await prisma.listing.deleteMany({
    where: { userId: host.id },
  });

  console.log(`✅ 시드 숙소 ${result.count}개 삭제 완료 (host@example.com 소유)`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
