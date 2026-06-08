/** 블로그 저장 API 공용 헬퍼: 요청 페이로드 → BlogMetaInput 정리 */
import type { BlogMetaInput } from "@/lib/blog";
import { isValidPostType, isAllowedCtaUrl } from "@/lib/blog-post-fields";

export type BlogPayload = Record<string, unknown> & {
  title?: unknown;
  slug?: unknown;
  excerpt?: unknown;
  body?: unknown;
  coverImage?: unknown;
  category?: unknown;
  publishedAt?: unknown;
};

function str(v: unknown): string | null {
  return typeof v === "string" && v.trim() ? v.trim() : null;
}

/**
 * 요청 페이로드에서 신규 메타 필드만 추출.
 * - 값이 들어온 키만 포함(undefined 는 생략 → PATCH 시 미변경 유지)
 * - 허용되지 않는 CTA URL 은 무시(null) — 서버 검증에서 별도 오류 처리
 */
export function extractBlogMetaInput(payload: BlogPayload): BlogMetaInput {
  const meta: BlogMetaInput = {};
  const strFields: (keyof BlogMetaInput)[] = [
    "seoTitle",
    "metaDescription",
    "focusKeyword",
    "secondaryKeywords",
    "coverImageAlt",
    "coverImageCaption",
    "ogImage",
    "primaryCtaLabel",
    "secondaryCtaLabel",
    "relatedPostSlugs",
    "relatedListingIds",
  ];
  for (const key of strFields) {
    if (key in payload) (meta as Record<string, unknown>)[key] = str(payload[key]);
  }

  if ("postType" in payload) {
    const v = str(payload.postType);
    meta.postType = isValidPostType(v ?? undefined) ? v : null;
  }
  if ("primaryCtaUrl" in payload) {
    const v = str(payload.primaryCtaUrl);
    meta.primaryCtaUrl = isAllowedCtaUrl(v) ? v : null;
  }
  if ("secondaryCtaUrl" in payload) {
    const v = str(payload.secondaryCtaUrl);
    meta.secondaryCtaUrl = isAllowedCtaUrl(v) ? v : null;
  }
  if ("noindex" in payload) meta.noindex = payload.noindex === true || payload.noindex === "true";

  return meta;
}
