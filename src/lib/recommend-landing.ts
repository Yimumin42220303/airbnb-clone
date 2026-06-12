/** /recommend 랜딩 전용 카피 (게스트 UX 단순화) */

export const RECOMMEND_HERO = {
  h1: "내 조건에 맞는 도쿄 숙소 3곳 추천받기",
  sub: "일정·인원·동행 유형을 입력하면 조건에 맞는 후보 숙소 3곳을 먼저 확인할 수 있습니다.\n예약 전 한국어 스태프가 최종 요금과 예약 가능 여부를 한 번 더 확인해드려요.",
  helper: "",
  cta: "숙소 3곳 추천받기",
  disclaimer:
    "입력하신 조건은 숙소 추천 목적으로만 사용됩니다.",
} as const;

export const RECOMMEND_RESULTS_TITLE = "조건에 맞는 후보 숙소 3곳";

export const RECOMMEND_AUDIENCE_ITEMS = [
  "도쿄 숙소 지역을 아직 못 정한 분",
  "가족·친구와 함께 묵을 숙소를 찾는 분",
  "숙소가 너무 많아 비교가 어려운 분",
] as const;

export const RECOMMEND_FAQ = [
  {
    q: "추천 결과는 어떻게 정해지나요?",
    a: "입력한 일정, 인원, 희망 위치, 중요 조건과 숙소 정보를 바탕으로 조건에 맞는 숙소를 골라 보여드립니다.",
  },
  {
    q: "추천받은 숙소를 바로 예약해야 하나요?",
    a: "아닙니다. 상세페이지에서 요금·예약 가능 여부를 확인한 뒤 예약하시면 됩니다.",
  },
  {
    q: "추천이 마음에 들지 않으면 어떻게 하나요?",
    a: "조건을 바꿔 다시 추천받거나, 상담 시작하기로 도쿄민박에 문의해 주세요.",
  },
] as const;

export const RECOMMEND_MID_BANNER = {
  title: "숙소가 많아 고르기 어렵다면?",
  body: "일정과 인원만 넣어도 조건에 맞는 숙소 3곳을 골라드려요.",
  button: "도쿄 숙소 3곳 추천",
} as const;

export const BLOG_RECOMMEND_CTA = {
  title: "도쿄 숙소가 아직 고민된다면?",
  body: "일정·인원·희망 조건을 입력해 숙소 3곳을 추천받아 보세요.",
  button: "숙소 3곳 추천받기",
} as const;
