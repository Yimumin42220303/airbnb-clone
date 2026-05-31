/**
 * 블로그 게시 전 SEO/품질 검사 (클라이언트·서버 공용 순수 함수).
 *
 * - error: 게시(published) 차단 사유
 * - warning: 게시는 가능하나 권장사항
 *
 * 초안 저장은 error 가 있어도 허용한다. 게시 상태로 전환할 때만 error 로 차단한다.
 */

import {
  isAllowedCtaUrl,
  splitCsv,
  SEO_TITLE_RANGE,
  META_DESCRIPTION_RANGE,
} from "@/lib/blog-post-fields";
import { isValidCategory } from "@/lib/blog-categories";

export type BlogCheck = {
  id: string;
  level: "error" | "warning";
  label: string;
};

export type BlogCheckInput = {
  title: string;
  slug: string;
  category: string | null | undefined;
  body: string;
  excerpt: string | null | undefined;
  seoTitle: string | null | undefined;
  metaDescription: string | null | undefined;
  coverImage: string | null | undefined;
  coverImageAlt: string | null | undefined;
  ogImage: string | null | undefined;
  primaryCtaUrl: string | null | undefined;
  secondaryCtaUrl: string | null | undefined;
  relatedPostSlugs: string | null | undefined;
  noindex: boolean | null | undefined;
  /** 게시 의도 여부 (true=공개 게시) */
  published: boolean;
};

/** 본문 안에 단독 H1("# ")이 있는지 (## ~ #### 은 허용) */
export function bodyHasH1(body: string): boolean {
  return /^#(?!#)\s+\S/m.test(body);
}

/** 깨진/빈 이미지 토큰([IMG:] 또는 URL 형식이 아님)이 본문에 남아 있는지 */
export function bodyHasBrokenImageToken(body: string): boolean {
  const re = /\[IMG:([^\]]*)\]/gi;
  let m: RegExpExecArray | null;
  while ((m = re.exec(body)) !== null) {
    const url = (m[1] ?? "").split("|")[0]?.trim() ?? "";
    if (!url) return true;
    if (!(url.startsWith("https://") || url.startsWith("http://") || url.startsWith("/")))
      return true;
  }
  return false;
}

/** 공개 노출 금지 placeholder 가 본문에 있는지 */
export function bodyHasPlaceholder(body: string): {
  todo: boolean;
  imageInsert: boolean;
  brokenImg: boolean;
  recommendation: boolean;
} {
  return {
    todo: /TODO/.test(body),
    imageInsert: body.includes("[이미지 삽입]"),
    brokenImg: bodyHasBrokenImageToken(body),
    recommendation: /\/recommendation(\/|$|\?|\)|"|')/.test(body),
  };
}

/** 본문 H2 개수 (정확히 ## , ### 제외) */
export function countH2(body: string): number {
  return (body.match(/^##(?!#)\s+\S/gm) || []).length;
}

/** 본문 내부 링크 개수 (마크다운 내부 링크 + 숙소 카드/비교/숙소연결 이미지) */
export function countInternalLinks(body: string): number {
  const markdownInternal = (body.match(/\]\(\/[^)\s]+\)/g) || []).length;
  const listingCards = (body.match(/\[LISTING_CARD:/gi) || []).length;
  const compares = (body.match(/\[BLOG_COMPARE/gi) || []).length;
  const listingImages = (body.match(/\|listing:[A-Za-z0-9_-]+/gi) || []).length;
  return markdownInternal + listingCards + compares + listingImages;
}

export function bodyHasFaq(body: string): boolean {
  return body.includes("자주 묻는 질문");
}

/** 메타 설명 실제 값 (metaDescription || excerpt) */
export function effectiveMetaDescription(input: BlogCheckInput): string {
  return (input.metaDescription?.trim() || input.excerpt?.trim() || "").trim();
}

/** 검색 노출 제목 실제 값 (seoTitle || title) */
export function effectiveSeoTitle(input: BlogCheckInput): string {
  return (input.seoTitle?.trim() || input.title?.trim() || "").trim();
}

export type BlogCheckResult = {
  errors: BlogCheck[];
  warnings: BlogCheck[];
  /** error 가 1개 이상이면 게시 차단 */
  canPublish: boolean;
};

export function checkBlogPost(input: BlogCheckInput): BlogCheckResult {
  const errors: BlogCheck[] = [];
  const warnings: BlogCheck[] = [];

  const title = input.title?.trim() ?? "";
  const body = input.body ?? "";
  const ph = bodyHasPlaceholder(body);
  const metaDesc = effectiveMetaDescription(input);
  const seoTitle = effectiveSeoTitle(input);

  // ---------------- 필수 / 오류 ----------------
  if (!title) errors.push({ id: "title", level: "error", label: "제목을 입력하세요." });
  if (!body.trim()) errors.push({ id: "body", level: "error", label: "본문을 입력하세요." });

  if (ph.todo) errors.push({ id: "todo", level: "error", label: "본문에 TODO 가 남아 있습니다." });
  if (ph.imageInsert)
    errors.push({ id: "image-insert", level: "error", label: "본문에 [이미지 삽입] placeholder 가 있습니다." });
  if (ph.brokenImg)
    errors.push({ id: "broken-img", level: "error", label: "본문에 깨진 이미지 태그([IMG:])가 있습니다." });
  if (ph.recommendation)
    errors.push({ id: "recommendation", level: "error", label: "본문에 존재하지 않는 /recommendation 링크가 있습니다." });
  if (bodyHasH1(body))
    errors.push({ id: "h1", level: "error", label: "본문에 H1(\"# \")이 있습니다. 제목이 H1이므로 본문은 ## 부터 시작하세요." });

  if (!isAllowedCtaUrl(input.primaryCtaUrl))
    errors.push({ id: "primary-cta-url", level: "error", label: "주 CTA URL 이 허용되지 않습니다(내부 경로 또는 http(s)만)." });
  if (!isAllowedCtaUrl(input.secondaryCtaUrl))
    errors.push({ id: "secondary-cta-url", level: "error", label: "보조 CTA URL 이 허용되지 않습니다(내부 경로 또는 http(s)만)." });

  // 게시 상태에서만 적용되는 오류
  if (input.published) {
    if (!isValidCategory((input.category ?? "").trim()))
      errors.push({ id: "category", level: "error", label: "게시하려면 카테고리를 미분류가 아닌 값으로 선택하세요." });
    if (!metaDesc)
      errors.push({ id: "meta-desc", level: "error", label: "게시하려면 메타 설명(또는 요약)을 입력하세요." });
  }

  // ---------------- 권장 / 경고 ----------------
  if (seoTitle) {
    if (seoTitle.length < SEO_TITLE_RANGE.min)
      warnings.push({ id: "seo-title-short", level: "warning", label: `SEO 제목이 짧습니다(${seoTitle.length}자, 권장 ${SEO_TITLE_RANGE.min}~${SEO_TITLE_RANGE.max}자).` });
    else if (seoTitle.length > SEO_TITLE_RANGE.max)
      warnings.push({ id: "seo-title-long", level: "warning", label: `SEO 제목이 깁니다(${seoTitle.length}자, 권장 ${SEO_TITLE_RANGE.min}~${SEO_TITLE_RANGE.max}자).` });
  }

  if (metaDesc) {
    if (metaDesc.length < META_DESCRIPTION_RANGE.min)
      warnings.push({ id: "meta-desc-short", level: "warning", label: `메타 설명이 짧습니다(${metaDesc.length}자, 권장 ${META_DESCRIPTION_RANGE.min}~${META_DESCRIPTION_RANGE.max}자).` });
    else if (metaDesc.length > META_DESCRIPTION_RANGE.max)
      warnings.push({ id: "meta-desc-long", level: "warning", label: `메타 설명이 깁니다(${metaDesc.length}자, 권장 ${META_DESCRIPTION_RANGE.min}~${META_DESCRIPTION_RANGE.max}자).` });
  } else if (!input.published) {
    warnings.push({ id: "meta-desc-empty", level: "warning", label: "메타 설명/요약이 비어 있습니다." });
  }

  if (!input.coverImage?.trim())
    warnings.push({ id: "cover", level: "warning", label: "대표 이미지가 없습니다." });
  else if (!input.coverImageAlt?.trim())
    warnings.push({ id: "cover-alt", level: "warning", label: "대표 이미지 alt 가 비어 있습니다." });

  const h2 = countH2(body);
  if (h2 < 3) warnings.push({ id: "h2", level: "warning", label: `H2 소제목이 ${h2}개입니다(3개 이상 권장).` });

  const links = countInternalLinks(body);
  if (links < 3) warnings.push({ id: "links", level: "warning", label: `내부 링크가 ${links}개입니다(3개 이상 권장).` });

  if (!bodyHasFaq(body))
    warnings.push({ id: "faq", level: "warning", label: "FAQ(자주 묻는 질문) 섹션이 없습니다." });

  const hasPrimaryCta = !!input.primaryCtaUrl?.trim() || !!input.secondaryCtaUrl?.trim();
  if (!hasPrimaryCta)
    warnings.push({ id: "cta", level: "warning", label: "글별 CTA 가 비어 있습니다(기본 CTA 사용)." });

  if (splitCsv(input.relatedPostSlugs).length === 0)
    warnings.push({ id: "related", level: "warning", label: "관련글이 설정되지 않았습니다(자동 관련글 사용)." });

  if (input.noindex && input.published)
    warnings.push({ id: "noindex", level: "warning", label: "noindex 가 켜진 채로 게시됩니다(검색 비노출)." });

  return { errors, warnings, canPublish: errors.length === 0 };
}
