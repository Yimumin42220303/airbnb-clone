import type { ListingFilters } from "@/lib/listings";

export type OrganicLandingConfig = {
  path: string;
  h1: string;
  title: string;
  description: string;
  intro: string[];
  recommendedFor: string[];
  checklist: string[];
  faq: { q: string; a: string }[];
  filters: ListingFilters;
  listingLimit?: number;
  relatedBlogSlugs: string[];
  internalLinks: { label: string; href: string }[];
  primaryCta: { label: string; href: string };
  secondaryCta: { label: string; href: string };
  keywords: string[];
};

export const ORGANIC_LANDING_PATHS = [
  "/tokyo-family-accommodation",
  "/tokyo-4-person-accommodation",
  "/tokyo-5-person-accommodation",
  "/shinjuku-family-accommodation",
  "/tokyo-korean-minbak",
] as const;

const COMMON_INTERNAL = [
  { label: "도쿄민박이란? 서비스 소개", href: "/blog/what-is-tokyominbak" },
  { label: "도쿄 민박 vs 호텔 비교", href: "/blog/tokyo-minbak-vs-hotel" },
  { label: "한국어 문의 가능한 도쿄 숙소 찾기", href: "/search" },
  { label: "안심예약센터 보기", href: "/trust" },
];

export const TOKYO_FAMILY_ACCOMMODATION: OrganicLandingConfig = {
  path: "/tokyo-family-accommodation",
  h1: "도쿄 가족 숙소 찾기",
  title: "도쿄 가족 숙소｜가족여행에 맞는 도쿄민박 숙소",
  description:
    "도쿄 가족여행에 맞는 숙소를 인원·지역·침구 구성 기준으로 비교하세요. 한국어 문의와 체크인 안내가 가능한 도쿄민박 등록 숙소를 확인할 수 있습니다.",
  keywords: ["도쿄 가족 숙소", "도쿄 가족여행 숙소"],
  intro: [
    "도쿄 가족여행에서는 호텔보다 넓은 거실·주방·세탁기를 갖춘 숙소가 체감 만족도를 높이는 경우가 많습니다.",
    "아이와 부모님이 함께한다면 침대 수, 엘리베이터, 역까지 동선, 짐 보관 방법까지 함께 비교하는 것이 좋습니다.",
    "도쿄민박은 예약 전 문의부터 체크인 안내까지 한국어로 안내하는 등록 숙소를 비교할 수 있습니다.",
  ],
  recommendedFor: [
    "4~6인 가족 여행",
    "아이·부모님 동반 도쿄 여행",
    "호텔보다 넓은 공간이 필요한 경우",
    "한국어로 예약·체크인 안내가 필요한 경우",
  ],
  checklist: [
    "최대 인원·침대·침실 구성 확인",
    "엘리베이터·계단·짐 이동 난이도",
    "주방·세탁기·와이파이 등 생활 편의",
    "역·관광지까지 이동 동선",
    "취소·환불 규정",
  ],
  faq: [
    {
      q: "도쿄 가족 숙소는 몇 명 기준으로 찾으면 좋나요?",
      a: "일행 전원이 편하게 머물 수 있는 최대 인원과 침구 구성을 기준으로 보세요. 4인 가족이라면 최대 4~6인 숙소를 함께 비교하는 것이 일반적입니다.",
    },
    {
      q: "가족 여행에 민박이 유리한 경우는?",
      a: "여러 명이 한 공간에서 생활하거나, 간단한 식사·세탁이 필요할 때 민박·아파트형 숙소가 유리할 수 있습니다. 다만 층수·소음 규정은 숙소마다 다릅니다.",
    },
    {
      q: "예약 전 무엇을 문의하면 좋나요?",
      a: "체크인 방식, 침구 배치, 추가 인원 요금, 짐 보관, 주차·유모차 이동 등을 한국어로 문의해 보세요.",
    },
  ],
  filters: { guests: 4 },
  listingLimit: 8,
  relatedBlogSlugs: [
    "shinjuku-family-accommodation-guide",
    "tokyo-minbak-vs-hotel",
    "tokyo-travel-luggage-tips",
    "what-is-tokyominbak",
  ],
  internalLinks: [
    { label: "신주쿠 가족 숙소 추천 글", href: "/blog/shinjuku-family-accommodation-guide" },
    { label: "도쿄 4인 숙소 랜딩", href: "/tokyo-4-person-accommodation" },
    ...COMMON_INTERNAL,
  ],
  primaryCta: { label: "가족 인원에 맞는 도쿄 숙소 추천받기", href: "/recommend" },
  secondaryCta: { label: "도쿄민박 등록 숙소 둘러보기", href: "/search?adults=4" },
};

export const TOKYO_4_PERSON_ACCOMMODATION: OrganicLandingConfig = {
  path: "/tokyo-4-person-accommodation",
  h1: "도쿄 4인 숙소 찾기",
  title: "도쿄 4인 숙소｜친구·가족 4명 여행 숙소",
  description:
    "도쿄 4인 여행에 맞는 숙소를 침대·거실·역 접근성 기준으로 비교하세요. 최대 4인 이상 수용 가능한 도쿄민박 등록 숙소를 한국어로 문의할 수 있습니다.",
  keywords: ["도쿄 4인 숙소"],
  intro: [
    "4인 여행은 침대 수와 거실·주방 공간이 만족도를 좌우합니다. 호텔 2실 예약과 한 공간 숙소 중 무엇이 동선·비용에 맞는지 비교해 보세요.",
    "신주쿠·시부야 등 거점 역과의 거리, 늦은 귀가 시 소음 규정, 엘리베이터 유무도 함께 확인하는 것이 좋습니다.",
    "아래는 도쿄민박에 등록된 숙소 중 최대 4인 이상 이용 가능한 후보입니다.",
  ],
  recommendedFor: [
    "친구 4명 여행",
    "부부+아이 2명 등 4인 가족",
    "한 공간에서 머물고 싶은 경우",
    "호텔 2실 대신 넓은 숙소를 찾는 경우",
  ],
  checklist: [
    "최대 4인 이상 수용 가능 여부",
    "침대·소파베드·추가 침구 구성",
    "욕실·화장실 분리 여부",
    "역 도보 거리·심야 이동",
    "최종 결제 총액(청소비·추가 인원)",
  ],
  faq: [
    {
      q: "4인 숙소는 몇 침대 기준이 좋나요?",
      a: "더블 2개 또는 침실 2개 구성이 흔합니다. 소파베드 포함 여부는 숙소마다 다르므로 예약 전 확인하세요.",
    },
    {
      q: "4인 여행에 신주쿠와 시부야 중 어디가 좋나요?",
      a: "관광·쇼핑 중심이면 신주쿠·시부야 모두 후보가 됩니다. 이동 동선과 숙소별 역 거리를 함께 비교하세요.",
    },
    {
      q: "가격은 어떻게 비교하나요?",
      a: "1박 요금뿐 아니라 청소비·추가 인원 요금·최소 숙박 일수를 포함한 총액으로 비교하는 것이 좋습니다.",
    },
  ],
  filters: { guests: 4 },
  listingLimit: 8,
  relatedBlogSlugs: ["tokyo-minbak-vs-hotel", "shinjuku-family-accommodation-guide", "what-is-tokyominbak"],
  internalLinks: [
    { label: "도쿄 가족 숙소 랜딩", href: "/tokyo-family-accommodation" },
    { label: "도쿄 5인 숙소 랜딩", href: "/tokyo-5-person-accommodation" },
    ...COMMON_INTERNAL,
  ],
  primaryCta: { label: "4인 일정에 맞는 도쿄 숙소 추천받기", href: "/recommend" },
  secondaryCta: { label: "4인 기준 숙소 검색", href: "/search?adults=4" },
};

export const TOKYO_5_PERSON_ACCOMMODATION: OrganicLandingConfig = {
  path: "/tokyo-5-person-accommodation",
  h1: "도쿄 5인 숙소 찾기",
  title: "도쿄 5인 숙소｜5명 여행·가족 숙소",
  description:
    "도쿄 5인 여행에 맞는 숙소를 최대 인원·침실·거실 기준으로 비교하세요. 5인 이상 수용 가능한 도쿄민박 등록 숙소를 확인할 수 있습니다.",
  keywords: ["도쿄 5인 숙소"],
  intro: [
    "5인 여행은 호텔 여러 객실보다 한 공간 숙소가 편한 경우가 많지만, 침구·욕실·수면 공간을 반드시 확인해야 합니다.",
    "단체·대가족이라면 엘리베이터, 주방·세탁기, 짐 보관, 역까지 이동 시간을 우선 비교하세요.",
    "아래 숙소는 등록 정보상 최대 5인 이상 이용 가능한 도쿄민박 숙소입니다.",
  ],
  recommendedFor: [
    "5명 친구·동아리 여행",
    "3세대 또는 대가족 일부",
    "한 공간에서 모여 쉬고 싶은 경우",
    "장기·단체 체류 검토",
  ],
  checklist: [
    "최대 5인 이상 명시 여부",
    "침실·거실·추가 매트리스 구성",
    "욕실 1개 vs 분리 여부",
    "소음·파티 규정 (house rules)",
    "단체 예약 시 체크인 안내",
  ],
  faq: [
    {
      q: "5인 숙소는 반드시 5침대가 있나요?",
      a: "아닙니다. 더블+소파베드·복층·매트리스 등 구성은 숙소마다 다릅니다. 사진과 설명, 문의로 확인하세요.",
    },
    {
      q: "5인 여행에 적합한 지역은?",
      a: "신주쿠·이케부쿠로 등 교통 허브 인근 숙소가 이동 분담에 유리한 경우가 많습니다. 일정에 맞게 선택하세요.",
    },
    {
      q: "예약 전 꼭 확인할 점은?",
      a: "최대 인원 초과 시 패널티, 추가 침구 비용, 체크인 인원 등록 방식을 확인하세요.",
    },
  ],
  filters: { guests: 5 },
  listingLimit: 8,
  relatedBlogSlugs: ["shinjuku-family-accommodation-guide", "tokyo-minbak-vs-hotel", "what-is-tokyominbak"],
  internalLinks: [
    { label: "도쿄 4인 숙소 랜딩", href: "/tokyo-4-person-accommodation" },
    { label: "신주쿠 가족 숙소", href: "/shinjuku-family-accommodation" },
    ...COMMON_INTERNAL,
  ],
  primaryCta: { label: "5인 일정 맞춤 숙소 추천받기", href: "/recommend" },
  secondaryCta: { label: "5인 기준 숙소 검색", href: "/search?adults=5" },
};

export const SHINJUKU_FAMILY_ACCOMMODATION: OrganicLandingConfig = {
  path: "/shinjuku-family-accommodation",
  h1: "신주쿠 가족 숙소 찾기",
  title: "신주쿠 가족 숙소｜신주쿠 4인·가족여행 숙소",
  description:
    "신주쿠·신주쿠역 인근 가족 숙소를 비교하세요. 4인 이상, 한국어 문의 가능한 도쿄민박 등록 숙소를 확인할 수 있습니다.",
  keywords: ["신주쿠 가족 숙소", "신주쿠 4인 숙소"],
  intro: [
    "신주쿠는 도쿄 여행에서 이동·쇼핑·식당 접근성이 좋은 거점입니다. 가족 여행이라면 역 도보 거리와 엘리베이터·침구 구성을 우선 보세요.",
    "야마노테선·주요 노선 환승이 편한 역 근처 숙소는 일정 변경에도 유리할 수 있습니다.",
    "아래는 등록 위치에 신주쿠가 포함된 도쿄민박 숙소 중 가족·4인 이상 이용 가능 후보입니다.",
  ],
  recommendedFor: [
    "신주쿠를 거점으로 도쿄 여행",
    "4~6인 가족·친구",
    "첫 도쿄 여행",
    "한국어 체크인 안내가 필요한 경우",
  ],
  checklist: [
    "신주쿠·히가시신주쿠 등 역 도보 거리",
    "최대 인원·침실 구성",
    "엘리베이터·계단",
    "주방·세탁기",
    "야간 소음·귀가 시간",
  ],
  faq: [
    {
      q: "신주쿠 가족 숙소는 어디가 편한가요?",
      a: "여행 스타일마다 다릅니다. 쇼핑·야경 중심이면 신주쿠역 인근, 조용한 주거지는 역에서 조금 떨어진 곳을 검토하세요.",
    },
    {
      q: "신주쿠 숙소 관련 글도 있나요?",
      a: "도쿄민박 블로그에 신주쿠 가족 숙소 추천 가이드가 있습니다. 아래 관련 글에서 함께 확인하세요.",
    },
    {
      q: "4인 가족 기준으로 찾으려면?",
      a: "최대 4인 이상 필터와 신주쿠 지역 검색을 함께 사용하거나, 30초 숙소추천을 이용해 보세요.",
    },
  ],
  filters: { location: "신주쿠", guests: 4 },
  listingLimit: 8,
  relatedBlogSlugs: ["shinjuku-family-accommodation-guide", "tokyo-minbak-vs-hotel", "what-is-tokyominbak"],
  internalLinks: [
    { label: "신주쿠 가족 숙소 추천 블로그", href: "/blog/shinjuku-family-accommodation-guide" },
    { label: "도쿄 가족 숙소 랜딩", href: "/tokyo-family-accommodation" },
    { label: "신주쿠 지역 숙소 검색", href: "/search?location=신주쿠&adults=4" },
    ...COMMON_INTERNAL,
  ],
  primaryCta: { label: "신주쿠 맞춤 숙소 추천받기", href: "/recommend" },
  secondaryCta: { label: "신주쿠 숙소 검색", href: "/search?location=신주쿠" },
};

export const TOKYO_KOREAN_MINBAK: OrganicLandingConfig = {
  path: "/tokyo-korean-minbak",
  h1: "도쿄 한인민박·한국어 안내 숙소",
  title: "도쿄 한인민박｜한국어 문의 가능한 도쿄 숙소",
  description:
    "한국어로 예약 전 문의·체크인 안내가 가능한 도쿄민박 숙소를 비교하세요. 도쿄 민박·현지 숙소를 한국어 고객지원과 함께 이용할 수 있습니다.",
  keywords: ["도쿄 한인민박", "도쿄 민박", "한국어 문의 가능한 도쿄 숙소"],
  intro: [
    "해외 숙소 예약에서 가장 큰 불안은 언어와 문제 발생 시 연락 창구입니다. 도쿄민박은 한국어 고객지원을 통해 예약 전·체크인·숙박 중 문의를 안내합니다.",
    "에어비앤비 등 개별 예약과 달리, 도쿄민박은 등록 숙소에 대해 한국어로 운영 대응하는 채널을 제공합니다.",
    "아래는 도쿄민박에 등록된 도쿄 현지 숙소입니다. 민박·아파트형 숙소를 비교해 보세요.",
  ],
  recommendedFor: [
    "첫 도쿄 여행",
    "한국어로 문의·안내가 필요한 경우",
    "호텔·민박 비교 중인 경우",
    "예약·체크인·문제 접수 창구가 필요한 경우",
  ],
  checklist: [
    "한국어 문의 가능 여부 (도쿄민박 고객지원)",
    "체크인 방식·열쇠 수령",
    "취소·환불 규정",
    "숙소 위치·역 접근성",
    "최종 결제 총액",
  ],
  faq: [
    {
      q: "도쿄민박은 에어비앤비와 무엇이 다른가요?",
      a: "도쿄민박은 한국어 고객지원과 등록 숙소 큐레이션에 초점을 둔 서비스입니다. 자세한 비교는 관련 블로그 글을 참고하세요.",
    },
    {
      q: "한국어로 어디까지 문의할 수 있나요?",
      a: "예약 전 상담, 체크인 안내, 숙박 중 문제 접수, 환불·민원 접수 등을 한국어로 안내합니다.",
    },
    {
      q: "민박과 호텔 중 무엇이 좋나요?",
      a: "인원·일정·예산·짐·주방 필요 여부에 따라 다릅니다. 민박 vs 호텔 비교 글을 함께 확인하세요.",
    },
  ],
  filters: {},
  listingLimit: 8,
  relatedBlogSlugs: ["what-is-tokyominbak", "tokyo-minbak-vs-hotel", "shibuya-ku-area-guide"],
  internalLinks: [
    { label: "도쿄민박이란?", href: "/blog/what-is-tokyominbak" },
    { label: "호텔보다 넓은 도쿄 숙소 비교", href: "/blog/tokyo-minbak-vs-hotel" },
    { label: "안심예약센터", href: "/trust" },
    ...COMMON_INTERNAL,
  ],
  primaryCta: { label: "한국어 맞춤 도쿄 숙소 추천받기", href: "/recommend" },
  secondaryCta: { label: "등록 숙소 전체 보기", href: "/search" },
};

export const ALL_ORGANIC_LANDINGS: OrganicLandingConfig[] = [
  TOKYO_FAMILY_ACCOMMODATION,
  TOKYO_4_PERSON_ACCOMMODATION,
  TOKYO_5_PERSON_ACCOMMODATION,
  SHINJUKU_FAMILY_ACCOMMODATION,
  TOKYO_KOREAN_MINBAK,
];

export function getOrganicLandingByPath(path: string): OrganicLandingConfig | undefined {
  return ALL_ORGANIC_LANDINGS.find((c) => c.path === path);
}

export function buildLandingMetadata(config: OrganicLandingConfig) {
  return {
    title: config.title,
    description: config.description,
    alternates: { canonical: config.path },
    openGraph: {
      title: config.title,
      description: config.description,
      type: "website" as const,
      url: config.path,
    },
  };
}
