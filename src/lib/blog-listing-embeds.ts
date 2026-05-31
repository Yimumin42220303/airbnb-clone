/**
 * 블로그 글별 숙소 임베드 메타 (본문 shortcode·비교표·카드용).
 * DB 스키마 변경 없음 — Post.body shortcode + 여기 정적 메타만 사용.
 */

export type BlogListingEmbedMeta = {
  listingId: string;
  /** 카드·앵커용 짧은 이름 */
  displayName: string;
  anchorLabel: string;
  recommendedFor: string;
  recommendReason: string;
  caution: string;
  /** 인원 구간 라벨 */
  guestRange: string;
  /** 본문 이미지 alt */
  imageAlt: string;
  /** [IMG:...|listing:ID] 매칭용 cloudinary path 일부 */
  imageUrlHint?: string;
};

export type BlogCompareRow = {
  guestRange: string;
  listingKey: string;
  station: string;
  feature: string;
  caution: string;
};

export type BlogPostListingEmbed = {
  listings: Record<string, BlogListingEmbedMeta>;
  compareRows: BlogCompareRow[];
};

const SHINJUKU_FAMILY: BlogPostListingEmbed = {
  listings: {
    classic: {
      listingId: "cmo74q3da004e5uv4wdnqo3sy",
      displayName: "신주쿠 클래식 하우스",
      anchorLabel: "신주쿠 클래식 하우스 자세히 보기",
      recommendedFor: "4~8인 대가족·3대 가족·두 가족 동반 여행",
      recommendReason:
        "최대 8명·침실 2개·침대 7개로 한 숙소에 함께 머물기 좋고, 니시신주쿠고초메역 도보 5분",
      caution: "엘리베이터·세탁기 여부는 예약 전 상세페이지에서 확인",
      guestRange: "4~8인",
      imageAlt: "신주쿠 클래식 하우스 거실과 침실",
      imageUrlHint: "rsd0g9ctnbtarr2kmdrw",
    },
    apartment: {
      listingId: "cmo74ef3l00345uv4hafvr7l7",
      displayName: "신주쿠역 도보 거리 내의 편리한 아파트",
      anchorLabel: "신주쿠역 도보 거리 내의 편리한 아파트 자세히 보기",
      recommendedFor: "3~5인 가족·아이 1~2명·신주쿠 중심 접근성 중시",
      recommendReason: "히가시신주쿠역 도보 5분, 31㎡·침대 4개로 3~5인 가족에 맞는 구성",
      caution: "호텔보다 넓은 공간이 필요한지 일정·짐 양과 함께 비교",
      guestRange: "3~5인",
      imageAlt: "신주쿠역 인근 패밀리 아파트 실내",
      imageUrlHint: "rygawqb6l3m9eobehqv6",
    },
    riverside: {
      listingId: "cmpbamgil0001m9motgb7aptv",
      displayName: "리버사이드_신주쿠",
      anchorLabel: "리버사이드_신주쿠 자세히 보기",
      recommendedFor: "3~4인 가족·친구 가족·생활 편의시설 활용",
      recommendReason: "다카다노바바역 도보 6분, 주방·세탁기·건조기 등 가족 여행 편의",
      caution: "4층·엘리베이터 없음 — 유모차·큰 캐리어 동반 시 확인",
      guestRange: "3~4인",
      imageAlt: "리버사이드_신주쿠 거실",
      imageUrlHint: "zjbmoaabyqnvzt0qflan",
    },
    asahi: {
      listingId: "cmncytjx30001mvd6qszlltf5",
      displayName: "AsahiStay -Shinjuku",
      anchorLabel: "AsahiStay -Shinjuku 자세히 보기",
      recommendedFor: "2~3인 소가족·부부+아이 1명·역 접근성 최우선",
      recommendReason: "히가시신주쿠역 도보 3분, 엘리베이터·욕조·세탁·건조기",
      caution: "4인 이상·분리 침실 필요 시 다른 숙소와 비교",
      guestRange: "2~3인",
      imageAlt: "AsahiStay -Shinjuku 객실",
      imageUrlHint: "v4fru0au9ds4eovvdmkb",
    },
  },
  compareRows: [
    {
      guestRange: "4~8인",
      listingKey: "classic",
      station: "니시신주쿠고초메역 도보 5분",
      feature: "건물 전체·침실 2·침대 7",
      caution: "엘리베이터·세탁기 확인",
    },
    {
      guestRange: "3~5인",
      listingKey: "apartment",
      station: "히가시신주쿠역 도보 5분",
      feature: "31㎡·침대 4·신주쿠 중심",
      caution: "좁게 느껴지면 인원 재확인",
    },
    {
      guestRange: "3~4인",
      listingKey: "riverside",
      station: "다카다노바바역 도보 6분",
      feature: "주방·세탁·건조기",
      caution: "4층·엘리베이터 없음",
    },
    {
      guestRange: "2~3인",
      listingKey: "asahi",
      station: "히가시신주쿠역 도보 3분",
      feature: "엘리베이터·욕조·세탁",
      caution: "4인 이상 부적합",
    },
  ],
};

const EMBEDS_BY_SLUG: Record<string, BlogPostListingEmbed> = {
  "shinjuku-family-accommodation-guide": SHINJUKU_FAMILY,
};

export function getBlogPostListingEmbed(slug: string): BlogPostListingEmbed | null {
  return EMBEDS_BY_SLUG[slug] ?? null;
}

export function listingPath(id: string): string {
  return `/listing/${id}`;
}
