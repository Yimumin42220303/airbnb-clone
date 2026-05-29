/**
 * 블로그 분류(카테고리) 정의.
 * Post.category 에는 아래 id 값이 저장됩니다. null/미정의 값은 "미분류"로 취급.
 */
export type BlogCategory = {
  id: string;
  label: string;
  /** 목록/SEO용 짧은 설명 */
  description: string;
};

export const BLOG_CATEGORIES: BlogCategory[] = [
  { id: "stay", label: "숙소 추천", description: "지역·예산별 도쿄 숙소·민박 추천" },
  { id: "area", label: "지역 가이드", description: "신주쿠·시부야·아사쿠사 등 지역별 정보" },
  { id: "transport", label: "교통·공항", description: "공항 이동, 전철·패스 등 교통 정보" },
  { id: "tips", label: "여행 꿀팁", description: "도쿄 여행에 도움 되는 실전 팁" },
  { id: "season", label: "시즌·예약", description: "성수기·시즌별 가격과 예약 시기" },
  { id: "guide", label: "이용 안내", description: "예약·체크인·취소 등 이용 방법" },
];

const CATEGORY_MAP: Record<string, BlogCategory> = Object.fromEntries(
  BLOG_CATEGORIES.map((c) => [c.id, c])
);

/** id 가 유효한 카테고리인지 */
export function isValidCategory(id: string | null | undefined): id is string {
  return !!id && id in CATEGORY_MAP;
}

/** id → 라벨 (없으면 null) */
export function getCategoryLabel(id: string | null | undefined): string | null {
  return id && CATEGORY_MAP[id] ? CATEGORY_MAP[id].label : null;
}

/** id → 카테고리 객체 (없으면 null) */
export function getCategory(id: string | null | undefined): BlogCategory | null {
  return id && CATEGORY_MAP[id] ? CATEGORY_MAP[id] : null;
}
