/**
 * 블로그 CMS 신규 SEO/전환 필드 공용 유틸 (클라이언트·서버 공용, prisma 의존 없음).
 *
 * - 글 유형(postType) 옵션
 * - 콤마 구분 문자열 ↔ 배열 변환
 * - CTA 내부 URL 검증
 * - 신규 필드 fallback 해석 (seoTitle/metaDescription/coverAlt/ogImage 등)
 *
 * 모든 신규 필드는 optional 이며, 비어 있으면 기존 값/기본값으로 fallback 한다.
 */

export type BlogPostType =
  | "guide"
  | "comparison"
  | "area"
  | "stay"
  | "faq"
  | "tips"
  | "review"
  | "notice";

export const BLOG_POST_TYPES: { id: BlogPostType; label: string }[] = [
  { id: "guide", label: "브랜드 안내" },
  { id: "faq", label: "FAQ" },
  { id: "comparison", label: "비교 글" },
  { id: "area", label: "지역 가이드" },
  { id: "stay", label: "숙소 추천" },
  { id: "tips", label: "여행 팁" },
  { id: "review", label: "숙소 후기/소개" },
  { id: "notice", label: "공지" },
];

const POST_TYPE_IDS = new Set(BLOG_POST_TYPES.map((t) => t.id));

export function isValidPostType(v: string | null | undefined): v is BlogPostType {
  return !!v && POST_TYPE_IDS.has(v as BlogPostType);
}

/** category id → 합리적인 postType fallback */
export function postTypeFromCategory(category: string | null | undefined): BlogPostType | null {
  switch (category) {
    case "stay":
      return "stay";
    case "area":
      return "area";
    case "tips":
    case "transport":
      return "tips";
    case "guide":
      return "guide";
    case "season":
      return "guide";
    default:
      return null;
  }
}

/** URL slug 생성 (클라이언트·서버 공용, prisma 의존 없음) */
export function slugify(title: string): string {
  return (
    title
      .trim()
      .toLowerCase()
      .replace(/\s+/g, "-")
      .replace(/[^a-z0-9가-힣-]/g, "")
      .replace(/-+/g, "-")
      .replace(/^-|-$/g, "") || "post"
  );
}

/** 콤마 구분 문자열 → 정리된 배열 */
export function splitCsv(value: string | null | undefined): string[] {
  if (!value) return [];
  return value
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
}

/** 배열 → 콤마 구분 문자열 (빈 배열이면 null) */
export function joinCsv(items: (string | null | undefined)[] | null | undefined): string | null {
  if (!items) return null;
  const cleaned = items.map((s) => (s ?? "").trim()).filter(Boolean);
  return cleaned.length ? cleaned.join(",") : null;
}

/** CTA/내부 링크로 허용되는 URL 인지 (존재하지 않는 /recommendation 차단) */
export function isAllowedCtaUrl(url: string | null | undefined): boolean {
  const u = (url ?? "").trim();
  if (!u) return true; // 비어 있으면 fallback 이므로 허용
  if (/\/recommendation(\/|$|\?)/.test(u)) return false; // 존재하지 않는 라우트
  if (u.startsWith("/")) return true; // 내부 링크
  if (u.startsWith("https://") || u.startsWith("http://")) return true; // 외부 링크
  return false;
}

/** 추천 CTA URL (관리자 입력 가이드용) */
export const RECOMMENDED_CTA_URLS: { url: string; label: string }[] = [
  { url: "/recommend", label: "맞춤 숙소 추천" },
  { url: "/trust", label: "안심예약센터" },
  { url: "/search", label: "숙소 검색" },
  { url: "/blog/what-is-tokyominbak", label: "도쿄민박이란?" },
  { url: "/blog/tokyo-minbak-vs-hotel", label: "민박 vs 호텔" },
  { url: "/blog/shinjuku-family-accommodation-guide", label: "신주쿠 가족 숙소" },
  { url: "/blog/shibuya-ku-area-guide", label: "시부야구 가이드" },
];

/** SEO 제목 권장 길이 */
export const SEO_TITLE_RANGE = { min: 28, max: 40 } as const;
/** 메타 설명 권장 길이 */
export const META_DESCRIPTION_RANGE = { min: 80, max: 140 } as const;

/** 신규/기존 필드를 합쳐 실제 사용할 값으로 해석 (모두 fallback 포함) */
export type ResolvedBlogMeta = {
  seoTitle: string;
  metaDescription: string | null;
  coverImageAlt: string;
  relatedPostSlugs: string[];
  relatedListingIds: string[];
  noindex: boolean;
};

export function resolveBlogMeta(input: {
  title: string;
  excerpt?: string | null;
  seoTitle?: string | null;
  metaDescription?: string | null;
  coverImageAlt?: string | null;
  relatedPostSlugs?: string | null;
  relatedListingIds?: string | null;
  noindex?: boolean | null;
  /** override 가 있으면 우선 (기존 BLOG_SEO_OVERRIDES 호환) */
  overrideTitle?: string | null;
  overrideDescription?: string | null;
  overrideCoverAlt?: string | null;
}): ResolvedBlogMeta {
  const seoTitle =
    input.seoTitle?.trim() || input.overrideTitle?.trim() || input.title.trim();
  const metaDescription =
    input.metaDescription?.trim() ||
    input.overrideDescription?.trim() ||
    input.excerpt?.trim() ||
    null;
  const coverImageAlt =
    input.coverImageAlt?.trim() ||
    input.overrideCoverAlt?.trim() ||
    input.title.trim();
  return {
    seoTitle,
    metaDescription,
    coverImageAlt,
    relatedPostSlugs: splitCsv(input.relatedPostSlugs),
    relatedListingIds: splitCsv(input.relatedListingIds),
    noindex: !!input.noindex,
  };
}
