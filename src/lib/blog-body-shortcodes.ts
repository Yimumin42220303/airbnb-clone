/** 어드민 본문 편집용 shortcode 안내 */

export const BLOG_SHORTCODE_EXAMPLES = {
  internalLink: "[숙소명 자세히 보기](/listing/LISTING_ID)",
  listingCard:
    "[LISTING_CARD:LISTING_ID|4~8인 대가족|히가시신주쿠역 도보 5분·침대 7개|엘리베이터·세탁기 예약 전 확인]",
  listingCardMinimal: "[LISTING_CARD:LISTING_ID]",
  compareTable:
    "[BLOG_COMPARE:LISTING_ID_1,LISTING_ID_2,LISTING_ID_3]",
  compareAuto: "[BLOG_COMPARE]",
  imagePlain: "[IMG:https://res.cloudinary.com/.../photo.jpg]",
  imageListing:
    "[IMG:https://res.cloudinary.com/.../photo.jpg|listing:LISTING_ID|숙소 사진 alt]",
  conclusion: `[BLOG_CONCLUSION]
도입 한 줄 요약
2~3인 소가족|LISTING_ID|숙소 표시명
[/BLOG_CONCLUSION]`,
} as const;

/** 본문 작성 템플릿 (heading 골격). 본문 시작은 항상 ## H2 부터. */
export const BLOG_BODY_TEMPLATES: { id: string; label: string; body: string }[] = [
  {
    id: "comparison",
    label: "비교 가이드",
    body: [
      "## 결론부터 보면",
      "## A가 잘 맞는 여행자",
      "## B가 잘 맞는 여행자",
      "## 가격만 보고 고르면 안 되는 이유",
      "## 체크리스트",
      "## 도쿄민박에서 확인하면 좋은 항목",
      "## 자주 묻는 질문",
      "## 마무리",
    ].join("\n\n"),
  },
  {
    id: "area",
    label: "지역 가이드",
    body: [
      "## 결론부터 보면",
      "## 이 지역은 어떤 여행자에게 잘 맞나요?",
      "## 주요 이동 동선",
      "## 숙소 선택 시 확인할 점",
      "## 가족·친구 여행자 체크리스트",
      "## 도쿄민박에서 이 지역 숙소를 찾는 방법",
      "## 자주 묻는 질문",
      "## 마무리",
    ].join("\n\n"),
  },
  {
    id: "stay",
    label: "숙소 추천",
    body: [
      "## 결론부터 보면",
      "## 이런 여행자에게 추천합니다",
      "## 숙소를 고를 때 확인할 점",
      "## 인원수별 숙소 선택 기준",
      "## 추천 숙소",
      "## 예약 전 체크리스트",
      "## 자주 묻는 질문",
      "## 마무리",
    ].join("\n\n"),
  },
  {
    id: "faq",
    label: "FAQ",
    body: [
      "## 자주 묻는 질문",
      "### Q. 질문 1",
      "### Q. 질문 2",
      "### Q. 질문 3",
      "## 처음 이용 전 확인하면 좋은 점",
      "## 마무리",
    ].join("\n\n"),
  },
  {
    id: "tips",
    label: "여행 팁",
    body: [
      "## 결론부터 보면",
      "## 이런 상황에서 필요합니다",
      "## 선택 가능한 방법",
      "## 주의할 점",
      "## 숙소 선택과 연결되는 부분",
      "## 체크리스트",
      "## 자주 묻는 질문",
      "## 마무리",
    ].join("\n\n"),
  },
];

export const BLOG_SHORTCODE_HELP = [
  "LISTING_ID는 숙소 상세 URL의 /listing/ 뒤 ID를 그대로 사용합니다.",
  "카드·비교표·JSON-LD는 코드 수정 없이 본문 shortcode만으로 동작합니다.",
  "[BLOG_COMPARE]만 넣으면, 그 위에 있는 [LISTING_CARD] 순서로 비교표를 만듭니다.",
  "추천 이유·주의는 shortcode에 넣지 않으면 DB 숙소 정보·설명에서 자동 채웁니다.",
  "[BLOG_CONCLUSION]…[/BLOG_CONCLUSION]으로 결론 요약 박스(AEO용)를 넣을 수 있습니다.",
  "FAQ는 ## 자주 묻는 질문 + ### Q. 질문? 형식으로 작성하면 FAQPage JSON-LD와 연동됩니다.",
] as const;
