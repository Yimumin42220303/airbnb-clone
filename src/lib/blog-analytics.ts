/**
 * 블로그 내부 링크·CTA 클릭 (GTM dataLayer). gtag/dataLayer 없으면 no-op.
 * 자유 입력·개인정보는 payload에 넣지 않음.
 */

export type BlogAnalyticsEventName =
  | "blog_internal_link_click"
  | "blog_listing_card_click"
  | "blog_recommend_cta_click"
  | "blog_related_post_click";

export type BlogLinkType =
  | "inline_markdown"
  | "listing_card"
  | "listing_image"
  | "compare_table"
  | "recommend_cta"
  | "related_post"
  | "nav";

export type BlogDestinationType = "listing" | "recommend" | "blog" | "internal" | "external";

export type BlogAnalyticsParams = {
  post_slug: string;
  link_type: BlogLinkType;
  destination_type: BlogDestinationType;
  destination_url: string;
  listing_id?: string;
  anchor_text?: string;
};

declare global {
  interface Window {
    dataLayer?: unknown[];
  }
}

export function trackBlogEvent(name: BlogAnalyticsEventName, params: BlogAnalyticsParams) {
  try {
    if (typeof window !== "undefined" && Array.isArray(window.dataLayer)) {
      window.dataLayer.push({ event: name, ...params });
    }
    if (process.env.NODE_ENV === "development") {
      console.log(`[blog-analytics] ${name}`, params);
    }
  } catch {
    // no-op
  }
}
