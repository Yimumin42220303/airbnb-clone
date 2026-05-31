import { BASE_URL } from "@/lib/site-url";
import type { BlogPostListingEmbed } from "@/lib/blog-listing-embeds";

/** 글에서 소개하는 숙소 ItemList (검색·AI가 글↔숙소 관계 파악용) */
export function buildBlogListingItemListJsonLd(
  postTitle: string,
  pageUrl: string,
  embed: BlogPostListingEmbed
) {
  const items = Object.values(embed.listings);
  return {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: `${postTitle} — 추천 숙소`,
    description: "이 블로그 글에서 소개하는 도쿄민박 등록 숙소 목록입니다.",
    url: pageUrl,
    numberOfItems: items.length,
    itemListElement: items.map((meta, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: meta.displayName,
      url: `${BASE_URL}/listing/${meta.listingId}`,
      item: {
        "@type": "LodgingBusiness",
        "@id": `${BASE_URL}/listing/${meta.listingId}`,
        name: meta.displayName,
        url: `${BASE_URL}/listing/${meta.listingId}`,
        description: meta.recommendReason,
      },
    })),
  };
}

/** BlogPosting.mentions — 본문과 동일한 숙소 URL 연결 */
export function buildBlogPostingMentions(
  embed: BlogPostListingEmbed
): Array<{ "@type": "LodgingBusiness"; name: string; url: string; "@id": string }> {
  return Object.values(embed.listings).map((meta) => ({
    "@type": "LodgingBusiness" as const,
    "@id": `${BASE_URL}/listing/${meta.listingId}`,
    name: meta.displayName,
    url: `${BASE_URL}/listing/${meta.listingId}`,
  }));
}
