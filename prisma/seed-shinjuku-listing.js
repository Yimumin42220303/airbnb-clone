/**
 * 신주쿠 다카다노바바 숙소 등록 스크립트
 * 실행: node prisma/seed-shinjuku-listing.js
 */

const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function main() {
  // 1. admin 계정 조회
  const admin = await prisma.user.findFirst({
    where: { role: "admin" },
    select: { id: true, email: true },
  });

  if (!admin) {
    throw new Error("admin 계정을 찾을 수 없습니다. DB에 role이 'admin'인 사용자가 있는지 확인해주세요.");
  }
  console.log("✅ admin 계정:", admin.email, "(id:", admin.id + ")");

  // 2. 숙소 등록
  const listing = await prisma.listing.create({
    data: {
      title: "[NEW OPEN] 신주쿠 다카다노바바역 도보 5분 / 최대 4명 / 한국어 대응",
      hostDisplayName: "Gray",
      location: "신주쿠구, 도쿄 (다카다노바바역 도보 5분)",
      description: `다카다노바바역 도보 5분, 신주쿠까지 전철 5분
도쿄 중심에서 레트로 감성을 그대로 느낄 수 있는 숙소입니다.

원목 천장과 따뜻한 조명, 일본 전통 공간 구조가 어우러진 이곳에서 '도쿄 현지인의 집에서 하루를 살아보는 경험'을 할 수 있습니다.

✔ 일본 로컬 감성을 느끼고 싶은 분
✔ 신주쿠 중심으로 이동하는 여행자
✔ 저렴하면서 접근성 좋은 숙소를 찾는 분

【교통】
다카다노바바역 (JR 야마노테선 / 도자이선 / 세이부 신주쿠선)
・신주쿠: JR 5분 (환승 없음)
・신오쿠보(코리아타운): JR 2분 / 도보 15분
・시부야: JR 15분

【숙소 안내】
23㎡ 규모의 프라이빗 공간으로 최대 4인까지 이용 가능합니다.
침실, 수납 공간, 욕실, 화장실, 간이 주방까지 모두 단독으로 사용하실 수 있습니다.

에어컨, 미니 냉장고, 전자레인지, 전기 포트, 욕실 어메니티가 준비되어 있으며
은은한 우드 향의 디퓨저로 편안한 분위기를 제공합니다.

・24시간 디지털 도어락으로 자유로운 비대면 체크인
・싱글 침대 4개 구성으로 최대 4인 숙박 가능
・일본 전통 공간 구조로 로컬 분위기 경험
・일본 감성 브랜드의 어메니티 제공

【주변 환경】
와세다대학교 학생들로 활기찬 거리, 저렴하고 맛있는 현지 식당들, 그리고 걸어서 2분 거리의 사카에도오리 상점가에서 진짜 도쿄 서민 골목의 감성을 경험해보세요!

【이용 안내】
・체크인: 오후 2:00 이후
・체크아웃: 오전 10:00 전
・최대 4명`,
      houseRules: `체크인 전 디지털 도어락 비밀번호를 안내드립니다.
세탁기는 제공되지 않으며, 도보 3분 거리에 코인 세탁소를 이용하실 수 있습니다. 숙소에 런드리 백을 준비해두었으니 자유롭게 이용해 주세요.
건물 특성상 전력 용량이 낮아 여러 전자기기를 동시에 사용할 경우 차단기가 내려갈 수 있습니다. 이 경우 현관 옆 차단기 스위치를 올리면 바로 복구됩니다.`,
      imageUrl: "https://a0.muscache.com/im/pictures/hosting/Hosting-1651985081695489115/original/641aacc4-d6e6-45a7-bd92-b6220ef4a9d8.png?im_w=720",
      pricePerNight: 20000,
      cleaningFee: 0,
      baseGuests: 2,
      maxGuests: 4,
      extraGuestFee: 0,
      bedrooms: 1,
      beds: 4,
      baths: 1,
      areaSqm: 23,
      bathroomToiletSeparate: false,
      propertyType: "apartment",
      instantBooking: false,
      cancellationPolicy: "flexible",
      isPromoted: false,
      isVerified: false,
      status: "approved",
      approvedAt: new Date(),
      hidden: false,
      userId: admin.id,
    },
  });
  console.log("✅ 숙소 등록 완료:", listing.id, "-", listing.title);

  // 3. 대표 이미지 ListingImage에도 추가
  await prisma.listingImage.create({
    data: {
      listingId: listing.id,
      url: "https://a0.muscache.com/im/pictures/hosting/Hosting-1651985081695489115/original/641aacc4-d6e6-45a7-bd92-b6220ef4a9d8.png?im_w=720",
      sortOrder: 0,
    },
  });
  console.log("✅ 대표 이미지 등록 완료");

  // 4. 편의시설 등록 (DB에 없는 경우 upsert로 생성)
  const amenities = [
    "무료 WiFi",
    "에어컨",
    "주방 (취사 가능)",
    "냉장고",
    "전자레인지",
    "전기포트",
    "헤어드라이어",
    "셀프 체크인",
    "키패드 / 스마트락",
    "역세권 (도보 5분 이내)",
    "화재경보기",
    "일산화탄소 경보기",
    "장기 숙박 가능",
  ];

  for (const name of amenities) {
    const amenity = await prisma.amenity.upsert({
      where: { name },
      update: {},
      create: { name },
    });
    await prisma.listingAmenity.upsert({
      where: { listingId_amenityId: { listingId: listing.id, amenityId: amenity.id } },
      update: {},
      create: { listingId: listing.id, amenityId: amenity.id },
    });
  }
  console.log("✅ 편의시설 등록 완료 (" + amenities.length + "개)");

  console.log("\n🎉 등록 완료! 숙소 ID:", listing.id);
  console.log("👉 호스트 대시보드에서 확인: /host/listings/" + listing.id);
}

main()
  .catch((e) => {
    console.error("❌ 오류:", e.message);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
