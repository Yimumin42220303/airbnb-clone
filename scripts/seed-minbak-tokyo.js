/**
 * minbak.tokyo 숙소 11개를 DB에 직접 등록
 * 기존 숙소는 삭제하지 않음 (추가만)
 *
 * 사용법: npm run seed:minbak-tokyo
 * (DATABASE_URL이 .env에 설정되어 있어야 함)
 */

require("dotenv").config({ path: ".env" });
require("dotenv").config({ path: ".env.local" });

const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

const ROOMS = [
  { title: "[다카다노바바역 도보6분]|리버사이드_신주쿠|〜4인・31㎡ 여유로운 공간", location: "다카다노바바역 도보 6분, 신주쿠", maxGuests: 4, bedrooms: 1, beds: 4, baths: 1 },
  { title: "[신주쿠 10분] 도심 속 힐링, 통창 햇살이 가득한 감성 로프트 아파트", location: "신주쿠", maxGuests: 4, bedrooms: 1, beds: 2, baths: 1 },
  { title: "[신축/무료건조기] 야마노테선 다카다노바바 도보권, 신주쿠/시부야 최적의 접근성", location: "다카다노바바, 신주쿠", maxGuests: 4, bedrooms: 1, beds: 2, baths: 1 },
  { title: "[Wide-Stay] 후지산 아트와 모던함이 공존하는 도쿄의 은신처 (신주쿠 5분)", location: "신주쿠", maxGuests: 4, bedrooms: 1, beds: 2, baths: 1 },
  { title: "가족 여행 추천! 이케부쿠로 인근 2층 독채 스테이 (최대 6인/오츠카역 근처)", location: "토시마(이케부쿠로), 오츠카역", maxGuests: 6, bedrooms: 2, beds: 4, baths: 1 },
  { title: "시부야역 도보 10분! 도심 한복판에서 즐기는 세련된 감성 스테이", location: "시부야", maxGuests: 4, bedrooms: 1, beds: 2, baths: 1 },
  { title: "도쿄 여행의 최중심! 신주쿠 30㎡ 넓은 객실 | 취사 가능·무료 세탁기 (최대 5인)", location: "신주쿠", maxGuests: 5, bedrooms: 1, beds: 3, baths: 1 },
  { title: "(독채사용&셀프체크인)도쿄타워, 아자부다이힐즈 도보거리! 쾌적한 5인실 독채 Asahistay-Roppongi", location: "미나토(롯폰기, 도쿄타워)", maxGuests: 5, bedrooms: 1, beds: 3, baths: 1 },
  { title: "[High-Floor] 신주쿠 야경이 보이는 발코니 | 히가시신주쿠역 도보 3분 & 세탁건조기 완비", location: "히가시신주쿠역 도보 3분, 신주쿠", maxGuests: 3, bedrooms: 1, beds: 2, baths: 1 },
  { title: "도쿄 로컬 감성 가득한 아사쿠사 인근 숙소 | 혼조아즈마바시역 도보 8분 (건조기 완비)", location: "스미다(스카이트리), 혼조아즈마바시역", maxGuests: 4, bedrooms: 1, beds: 2, baths: 1 },
  { title: "[Work & Stay] 듀얼 모니터 완비! 신주쿠 1정거장, 디지털 노마드를 위한 완벽한 아지트", location: "시부야", maxGuests: 4, bedrooms: 1, beds: 2, baths: 1 },
];

async function main() {
  const admin = await prisma.user.findFirst({
    where: { role: "admin" },
    select: { id: true, email: true },
  });
  const host = admin ?? (await prisma.user.findFirst({ select: { id: true, email: true } }));
  if (!host) {
    throw new Error("DB에 사용자가 없습니다. 먼저 db:seed를 실행하세요.");
  }

  let created = 0;
  for (let i = 0; i < ROOMS.length; i++) {
    const r = ROOMS[i];
    const desc = `${r.title} - 도쿄민박에서 엄선한 도쿄 현지 숙소입니다.`;
    const imageUrl = `https://picsum.photos/seed/minbak${i + 1}/800/600`;

    const existing = await prisma.listing.findFirst({
      where: { title: r.title, userId: host.id },
    });
    if (existing) {
      console.log(`⏭️  이미 존재: ${r.title}`);
      continue;
    }

    const listing = await prisma.listing.create({
      data: {
        userId: host.id,
        title: r.title,
        location: r.location,
        description: desc,
        pricePerNight: 100000,
        cleaningFee: 0,
        imageUrl,
        baseGuests: 2,
        maxGuests: r.maxGuests,
        bedrooms: r.bedrooms,
        beds: r.beds,
        baths: r.baths,
      },
    });

    await prisma.listingImage.createMany({
      data: [
        { listingId: listing.id, url: imageUrl, sortOrder: 0 },
        { listingId: listing.id, url: `https://picsum.photos/seed/minbak${i + 1}-2/800/600`, sortOrder: 1 },
        { listingId: listing.id, url: `https://picsum.photos/seed/minbak${i + 1}-3/800/600`, sortOrder: 2 },
      ],
    });
    created++;
    console.log(`✅ ${r.title}`);
  }

  console.log(`\n✅ minbak.tokyo 숙소 ${created}개 등록 완료 (호스트: ${host.email})`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
