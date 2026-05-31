import { BASE_URL } from "@/lib/site-url";
import type { BlogListingCardData } from "@/lib/blog-listing-data";
import { buildListingCardDisplay } from "@/lib/blog-listing-shortcode";

/** 글에서 소개하는 숙소 ItemList */
export function buildBlogListingItemListJsonLd(
  postTitle: string,
  pageUrl: string,
  listingIds: string[],
  listingsMap: Map<string, BlogListingCardData>
) {
  const items = listingIds
    .map((id) => listingsMap.get(id))
    .filter((l): l is BlogListingCardData => !!l);

  return {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: `${postTitle} — 추천 숙소`,
    description: "이 블로그 글에서 소개하는 도쿄민박 등록 숙소 목록입니다.",
    url: pageUrl,
    numberOfItems: items.length,
    itemListElement: items.map((listing, index) => {
      const display = buildListingCardDisplay(listing);
      return {
        "@type": "ListItem",
        position: index + 1,
        name: display.displayName,
        url: `${BASE_URL}/listing/${listing.id}`,
        item: {
          "@type": "LodgingBusiness",
          "@id": `${BASE_URL}/listing/${listing.id}`,
          name: display.displayName,
          url: `${BASE_URL}/listing/${listing.id}`,
          description: display.recommendReason,
        },
      };
    }),
  };
}

export function buildBlogPostingMentions(
  listingIds: string[],
  listingsMap: Map<string, BlogListingCardData>
): Array<{ "@type": "LodgingBusiness"; name: string; url: string; "@id": string }> {
  return listingIds
    .map((id) => listingsMap.get(id))
    .filter((l): l is BlogListingCardData => !!l)
    .map((listing) => {
      const display = buildListingCardDisplay(listing);
      return {
        "@type": "LodgingBusiness" as const,
        "@id": `${BASE_URL}/listing/${listing.id}`,
        name: display.displayName,
        url: `${BASE_URL}/listing/${listing.id}`,
      };
    });
}
