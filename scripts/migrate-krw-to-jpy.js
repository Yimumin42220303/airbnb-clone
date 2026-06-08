/**
 * Phase 2: KRW → JPY 마이그레이션 스크립트
 *
 * 기존 DB의 가격 필드를 KRW에서 JPY로 변환합니다.
 * 실행 전 백업 필수! 실행: node scripts/migrate-krw-to-jpy.js
 *
 * 환율: 1 JPY = EXCHANGE_RATE_JPY_TO_KRW KRW (기본 10)
 * 변환: newValue = Math.round(oldValue / JPY_TO_KRW)
 */

require("dotenv").config({ path: ".env.local" });
require("dotenv").config();

const { PrismaClient } = require("@prisma/client");

const JPY_TO_KRW =
  typeof process.env.EXCHANGE_RATE_JPY_TO_KRW !== "undefined"
    ? parseFloat(process.env.EXCHANGE_RATE_JPY_TO_KRW)
    : 10;

function krwToJpy(krw) {
  return Math.round(krw / JPY_TO_KRW);
}

const prisma = new PrismaClient();

async function main() {

  console.log(`환율: 1 JPY = ${JPY_TO_KRW} KRW`);
  console.log("Listing, ListingAvailability, Booking 금액을 KRW→JPY 변환합니다...\n");

  const listings = await prisma.listing.findMany({
    select: { id: true, pricePerNight: true, cleaningFee: true, extraGuestFee: true },
  });
  let updatedListings = 0;
  for (const l of listings) {
    const newPrice = krwToJpy(l.pricePerNight);
    const newCleaning = krwToJpy(l.cleaningFee);
    const newExtra = krwToJpy(l.extraGuestFee);
    if (newPrice !== l.pricePerNight || newCleaning !== l.cleaningFee || newExtra !== l.extraGuestFee) {
      await prisma.listing.update({
        where: { id: l.id },
        data: {
          pricePerNight: newPrice,
          cleaningFee: newCleaning,
          extraGuestFee: newExtra,
        },
      });
      updatedListings++;
      console.log(`Listing ${l.id}: ${l.pricePerNight}→${newPrice}, ${l.cleaningFee}→${newCleaning}`);
    }
  }
  console.log(`\nListing ${updatedListings}건 업데이트`);

  const availabilities = await prisma.listingAvailability.findMany({
    where: { pricePerNight: { not: null } },
    select: { id: true, listingId: true, date: true, pricePerNight: true },
  });
  let updatedAvail = 0;
  for (const a of availabilities) {
    const p = a.pricePerNight;
    if (p != null) {
      const newP = krwToJpy(p);
      if (newP !== p) {
        await prisma.listingAvailability.update({
          where: { id: a.id },
          data: { pricePerNight: newP },
        });
        updatedAvail++;
      }
    }
  }
  console.log(`ListingAvailability ${updatedAvail}건 업데이트`);

  const bookings = await prisma.booking.findMany({
    select: { id: true, totalPrice: true },
  });
  let updatedBookings = 0;
  for (const b of bookings) {
    const newTotal = krwToJpy(b.totalPrice);
    if (newTotal !== b.totalPrice) {
      await prisma.booking.update({
        where: { id: b.id },
        data: { totalPrice: newTotal },
      });
      updatedBookings++;
      console.log(`Booking ${b.id}: ${b.totalPrice}→${newTotal}`);
    }
  }
  console.log(`\nBooking ${updatedBookings}건 업데이트`);

  console.log("\n마이그레이션 완료.");
  console.log("PaymentTransaction.amount는 결제당시 KRW이므로 변환하지 않습니다.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
