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
} as const;

export const BLOG_SHORTCODE_HELP = [
  "LISTING_ID는 숙소 상세 URL의 /listing/ 뒤 ID를 그대로 사용합니다.",
  "카드·비교표·JSON-LD는 코드 수정 없이 본문 shortcode만으로 동작합니다.",
  "[BLOG_COMPARE]만 넣으면, 그 위에 있는 [LISTING_CARD] 순서로 비교표를 만듭니다.",
  "추천 이유·주의는 shortcode에 넣지 않으면 DB 숙소 정보·설명에서 자동 채웁니다.",
] as const;
