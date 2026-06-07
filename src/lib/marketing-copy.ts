/**
 * 도쿄민박 마케팅 카피 SSOT (Single Source of Truth)
 * 홈 히어로 · 상단 배너 · SEO/OG · Meta 광고 · /trust 와 톤을 맞출 때 이 파일을 기준으로 한다.
 */

/** 브랜드 한 줄 (내부·기획용) */
export const BRAND_ONE_LINER =
  "합리적인 가격 + 예약 전후를 한국어로 안내하는 도쿄 숙소 예약 창구";

/** 핵심 약속 2축 — 모든 채널에서 이 순서 유지: ① 가격·합리 ② 신뢰·운영대응 */
export const BRAND_PILLARS = {
  value: "대형 플랫폼 대비 합리적인 요금(항상 최저가 보장 아님)",
  trust:
    "예약 전 문의·체크인 안내·숙박 중 문제·환불·민원까지 도쿄민박이 한국어로 직접 대응",
} as const;

/** 쓰지 말 것 (광고·홈·배너 공통) */
export const COPY_DONT = [
  "프리릴리스 / 테스트 결제만",
  "최저가 보장 / 무조건 환불 / 전액 보상",
  "에어비앤비보다 무조건 ○○% 저렴 (숙소·일정마다 다름)",
  "무한 책임 / 모든 문제 100% 해결",
] as const;

/** 홈 히어로 (ko) — translations.ts guest.hero* 와 동기화 */
export const HOME_HERO_KO = {
  title1: "도쿄 숙소, 합리적인 가격으로",
  title2: "예약 전후를 한국어로 안내하는 도쿄 숙소 예약",
  sub: "예약 전 문의부터 체크인 안내, 숙박 중 문제 접수까지 한국어로 안내합니다. 합리적인 요금으로 도쿄 현지 숙소를 확인해 보세요.",
  bullet1: "대형 플랫폼 대비 합리적인 요금",
  bullet2: "예약 전후를 한국어로 안내하는 도쿄 현지 숙소",
  bullet3: "예약 전후·숙박 중 한국어 고객지원 안내",
} as const;

/** 상단 안내 배너 (ko) */
export const HOME_STATUS_BANNER_KO = {
  text: "KG이니시스 안전결제 · 예약 전 취소·환불 조건 확인 · 한국어 고객지원 안내",
  linkLabel: "안심예약센터",
  linkHref: "/trust",
} as const;

/** SEO / OG 기본 (홈·루트) */
export const SITE_META_KO = {
  title: "도쿄민박 | 합리적인 가격, 한국어로 안내하는 도쿄 숙소",
  description:
    "도쿄 현지 숙소를 합리적인 요금으로 예약하세요. 예약 전 문의부터 체크인 안내, 숙박 중 문제 접수까지 한국어로 안내합니다.",
  ogTitle: "도쿄민박 — 합리적인 가격, 한국어 고객지원 안내",
  ogDescription:
    "예약 전 문의부터 체크인 안내, 숙박 중 문제 접수까지 도쿄민박 고객지원 창구에서 한국어로 안내합니다.",
} as const;

/** Meta 광고 카피 초안 (한국어) */
export type MetaAdVariant = {
  id: string;
  objective: string;
  primaryText: string;
  headline: string;
  description: string;
  cta: string;
  landing: string;
};

export const META_AD_VARIANTS_KO: MetaAdVariant[] = [
  {
    id: "trust-conversion",
    objective: "전환 (신뢰+가격)",
    primaryText:
      "처음 보는 해외 숙소 플랫폼, 불안하시죠?\n도쿄민박은 예약 전 문의부터 체크인·숙박 중 문제·환불까지 한국어로 직접 대응합니다. 합리적인 요금으로 도쿄 현지 숙소를 확인해 보세요.",
    headline: "도쿄 숙소, 한국어 고객지원으로 안내합니다",
    description: "안심예약센터에서 결제·환불·운영 방식을 확인할 수 있습니다.",
    cta: "지금 둘러보기",
    landing: "/trust",
  },
  {
    id: "value-search",
    objective: "유입 (가격 관심)",
    primaryText:
      "도쿄 여행 숙소, 가격만 보고 결제하기 전에 한 번 더 확인하세요.\n도쿄민박은 합리적인 요금과 한국어 운영대응을 함께 제공합니다. 취소·환불 조건은 예약 전에 확인할 수 있습니다.",
    headline: "합리적인 가격으로 도쿄 숙소 예약",
    description: "에어비앤비와 총액 기준으로 비교해 보세요.",
    cta: "숙소 보기",
    landing: "/search",
  },
  {
    id: "consideration-faq",
    objective: "고려 (비교·민원 불안)",
    primaryText:
      "결제하면 연락이 끊기는 게 걱정되시나요?\n결제 후에도 도쿄민박 고객지원팀이 한국어로 안내합니다. KG이니시스 안전결제, 숙소별 환불 일정도 예약 전에 확인 가능합니다.",
    headline: "결제 후에도 도쿄민박이 함께합니다",
    description: "안심예약센터 · 사업자 정보 공개",
    cta: "자세히 보기",
    landing: "/trust",
  },
  {
    id: "retarget-warm",
    objective: "리타겟 (방문 후)",
    primaryText:
      "아까 보신 도쿄 숙소, 아직 고민 중이신가요?\n취소·환불 날짜와 예약 확정 방식은 예약 화면에서 확인할 수 있습니다. 궁금한 점은 한국어로 문의해 주세요.",
    headline: "예약 전에 조건부터 확인하세요",
    description: "도쿄민박 한국어 고객지원 안내",
    cta: "예약 계속하기",
    landing: "/search",
  },
];
