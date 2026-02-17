const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

const listingsData = [
  {
    title: "신주쿠 중심가 모던 아파트",
    location: "신주쿠구, 도쿄",
    imageUrl: "https://picsum.photos/seed/listing1/400/300",
    pricePerNight: 85000,
    maxGuests: 4,
    bedrooms: 2,
    beds: 2,
    baths: 1,
    description: "신주쿠역에서 가까운 모던한 아파트입니다.",
  },
  {
    title: "한적한 시부야 로프트",
    location: "시부야구, 도쿄",
    imageUrl: "https://picsum.photos/seed/listing2/400/300",
    pricePerNight: 120000,
    maxGuests: 2,
    bedrooms: 1,
    beds: 1,
    baths: 1,
    description: "시부야의 한적한 로프트 스타일 숙소.",
  },
  {
    title: "아사쿠사 전통 게스트하우스",
    location: "다이토구, 도쿄",
    imageUrl: "https://picsum.photos/seed/listing3/400/300",
    pricePerNight: 65000,
    maxGuests: 6,
    bedrooms: 3,
    beds: 3,
    baths: 2,
    description: "아사쿠사 근처 전통적인 게스트하우스.",
  },
  {
    title: "오사카 도톤보리 뷰",
    location: "츄오구, 오사카",
    imageUrl: "https://picsum.photos/seed/listing4/400/300",
    pricePerNight: 95000,
    maxGuests: 4,
    bedrooms: 2,
    beds: 2,
    baths: 1,
    description: "도톤보리 전경이 보이는 숙소.",
  },
  {
    title: "교토 아라시야마 한옥",
    location: "우쿄구, 교토",
    imageUrl: "https://picsum.photos/seed/listing5/400/300",
    pricePerNight: 150000,
    maxGuests: 4,
    bedrooms: 2,
    beds: 2,
    baths: 1,
    description: "아라시야마 인근 한옥 스타일 숙소.",
  },
  {
    title: "요코하마 미나토미라이 루프탑",
    location: "니시구, 요코하마",
    imageUrl: "https://picsum.photos/seed/listing6/400/300",
    pricePerNight: 110000,
    maxGuests: 2,
    bedrooms: 1,
    beds: 1,
    baths: 1,
    description: "미나토미라이 전경 루프탑 숙소.",
  },
];

// 한국인 게스트 맞춤 편의시설 (scripts/add-airbnb-amenities.js와 동일)
const amenityNames = [
  "무료 WiFi", "포켓 WiFi 대여",
  "에어컨", "난방", "공기청정기", "가습기", "선풍기",
  "욕조 (바스타브)", "샤워실", "비데", "수건", "바디워시", "샴푸 / 린스", "치약 / 칫솔", "헤어드라이어", "화장지",
  "주방 (취사 가능)", "냉장고", "전자레인지", "전기포트", "밥솥", "식기세트", "조리기구", "정수기",
  "세탁기", "건조기", "세탁용 세제", "다리미",
  "침대", "이불 / 침구류", "옷걸이", "수납공간 (클로젯)",
  "TV", "넷플릭스 / OTT",
  "역세권 (도보 5분 이내)", "무료 주차", "자전거 대여",
  "엘리베이터", "셀프 체크인", "키패드 / 스마트락", "전용 출입구", "편의점 도보권", "한국어 안내문",
  "화재경보기", "소화기", "구급상자", "일산화탄소 경보기",
  "발코니 / 베란다", "테라스", "BBQ 시설",
  "아기침대", "유아용 식기", "어린이 안전장치",
  "반려동물 동반 가능",
  "온천 / 대욕장", "유카타 제공", "슬리퍼 제공", "우산 대여", "짐 보관 서비스",
  "한국어 가능 호스트", "공항 픽업 가능", "관광지도 / 가이드북",
  "110V 콘센트 (한국 플러그 호환)", "변압기 / 어댑터 제공",
];

const blogPostsData = [
  {
    slug: "tokyo-minbak-first-time-guide",
    title: "도쿄 민박 처음 이용하시나요? 예약부터 체크인까지 가이드",
    excerpt:
      "도쿄민박은 에어비앤비보다 합리적인 가격에 한국어 서포트까지. 첫 이용자를 위한 예약·결제·체크인 방법을 안내합니다.",
    body: `도쿄 여행, 숙소 고민되시죠? 호텔은 비싸고 에어비앤비는 수수료 부담이 크다면, 도쿄민박을 한번 이용해 보세요.

도쿄민박은 도쿄 현지 숙소를 직접 확인하고 엄선해, 중간 수수료 없이 합리적인 가격으로 제공합니다. 문의부터 체크아웃까지 한국인 스태프가 한국어로 도와드립니다.

예약 방법
1) 원하는 숙소를 골라 날짜·인원을 선택하세요.
2) 결제 완료 후 예약이 확정됩니다.
3) 체크인 전에 호스트와 메시지로 연락 가능합니다.

도쿄민박과 함께 편하고 저렴한 도쿄 여행을 시작해 보세요.`,
    coverImage: "https://picsum.photos/seed/blog1/800/450",
    publishedAt: new Date("2025-01-15T09:00:00.000Z"),
  },
  {
    slug: "shinjuku-stay-tips",
    title: "신주쿠 숙소 골라보기 – 교통·쇼핑·밤놀기 모두 좋은 곳",
    excerpt:
      "신주쿠에 묵을 때 고려할 점과 도쿄민박 추천 숙소 포인트를 소개합니다.",
    body: `신주쿠는 도쿄 여행의 허브입니다. JR·지하철·버스가 모여 있어 이동이 편하고, 쇼핑·맛집·밤문화까지 한곳에서 즐길 수 있어 숙소로 인기 있는 동네예요.

신주쿠 숙소 고를 때 포인트
• 역에서 도보 10분 이내: 짐 있을 때 편합니다.
• 조용한 골목: 번화가와 조금만 떨어져도 숙면에 도움이 됩니다.
• 세탁기·주방 있으면 장기 투숙 시 유리합니다.

도쿄민박에는 신주쿠 근처 엄선 숙소가 여러 곳 등록되어 있습니다. 가격·위치·편의시설을 비교해 보시고, 궁금한 점은 예약 전에 메시지로 문의해 보세요.`,
    coverImage: "https://picsum.photos/seed/blog2/800/450",
    publishedAt: new Date("2025-01-20T10:00:00.000Z"),
  },
];

async function main() {
  // 호스트 사용자 1명 생성
  const host = await prisma.user.upsert({
    where: { email: "host@example.com" },
    update: {},
    create: {
      email: "host@example.com",
      name: "테스트 호스트",
    },
  });

  // 예약용 게스트 사용자 (로그인 없이 예약 시 사용)
  await prisma.user.upsert({
    where: { email: "guest@example.com" },
    update: {},
    create: {
      email: "guest@example.com",
      name: "게스트",
    },
  });

  // 어드민 (리뷰·블로그 작성 권한 등)
  const admin = await prisma.user.upsert({
    where: { email: "admin@example.com" },
    update: { role: "admin" },
    create: {
      email: "admin@example.com",
      name: "관리자",
      role: "admin",
    },
  });

  // 도쿄민박 공식 계정 (예약/승인 시 채팅 자동 메시지 발신자, 채팅창에 "도쿄민박 운영자"로 표시)
  await prisma.user.upsert({
    where: { email: "official@tokyominbak.com" },
    update: { name: "도쿄민박 운영자" },
    create: {
      email: "official@tokyominbak.com",
      name: "도쿄민박 운영자",
      role: "user",
    },
  });

  // 블로그 샘플 글 (관리자 작성, 공개)
  for (const post of blogPostsData) {
    await prisma.post.upsert({
      where: { slug: post.slug },
      update: {
        title: post.title,
        excerpt: post.excerpt,
        body: post.body,
        coverImage: post.coverImage,
        publishedAt: post.publishedAt,
      },
      create: {
        authorId: admin.id,
        slug: post.slug,
        title: post.title,
        excerpt: post.excerpt,
        body: post.body,
        coverImage: post.coverImage,
        publishedAt: post.publishedAt,
      },
    });
  }

  // 편의시설 생성
  const amenities = await Promise.all(
    amenityNames.map((name) =>
      prisma.amenity.upsert({
        where: { name },
        update: {},
        create: { name },
      })
    )
  );

  // 기존 숙소 삭제 후 시드 (idempotent 하게)
  await prisma.listingAmenity.deleteMany({});
  await prisma.review.deleteMany({});
  await prisma.booking.deleteMany({});
  await prisma.listingImage.deleteMany({});
  await prisma.listing.deleteMany({});

  for (let i = 0; i < listingsData.length; i++) {
    const data = listingsData[i];
    const listing = await prisma.listing.create({
      data: {
        ...data,
        userId: host.id,
      },
    });
    // 각 숙소에 이미지 여러 장 (상세 페이지 갤러리용)
    const imageUrls = [
      data.imageUrl,
      `https://picsum.photos/seed/${listing.id}-2/800/600`,
      `https://picsum.photos/seed/${listing.id}-3/800/600`,
      `https://picsum.photos/seed/${listing.id}-4/800/600`,
    ];
    await prisma.listingImage.createMany({
      data: imageUrls.map((url, sortOrder) => ({
        listingId: listing.id,
        url,
        sortOrder,
      })),
    });
    // 각 숙소에 편의시설 2~4개 랜덤 연결
    const count = 2 + (i % 3);
    for (let j = 0; j < count; j++) {
      await prisma.listingAmenity.create({
        data: {
          listingId: listing.id,
          amenityId: amenities[j % amenities.length].id,
        },
      });
    }
  }

  // 리뷰 샘플 (선택)
  const listings = await prisma.listing.findMany({ take: 3 });
  for (const listing of listings) {
    await prisma.review.create({
      data: {
        listingId: listing.id,
        userId: host.id,
        rating: 4 + (listing.id.charCodeAt(0) % 2),
        body: "매우 만족스러운 숙소였습니다.",
      },
    });
  }

  console.log(
    "✅ 시드 완료: User(호스트+게스트+관리자), Listings 6개, Amenities, Reviews, Blog 2편"
  );
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
