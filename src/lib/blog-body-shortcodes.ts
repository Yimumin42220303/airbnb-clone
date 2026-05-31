import { getBlogPostListingEmbed } from "@/lib/blog-listing-embeds";

/** 어드민 본문 편집용 shortcode 안내 */
export const BLOG_SHORTCODE_EXAMPLES = {
  internalLink:
    "[신주쿠 클래식 하우스 자세히 보기](/listing/LISTING_ID)",
  listingCard: "[LISTING_CARD:classic]",
  compareTable: "[BLOG_COMPARE]",
  imagePlain: "[IMG:https://res.cloudinary.com/.../photo.jpg]",
  imageListing:
    "[IMG:https://res.cloudinary.com/.../photo.jpg|listing:LISTING_ID|숙소 사진 설명 alt]",
} as const;

export function getListingCardInsertOptions(slug: string): { key: string; label: string }[] {
  const embed = getBlogPostListingEmbed(slug.trim());
  if (!embed) return [];
  return Object.entries(embed.listings).map(([key, meta]) => ({
    key,
    label: meta.displayName,
  }));
}

export function hasBlogListingEmbed(slug: string): boolean {
  return getBlogPostListingEmbed(slug.trim()) != null;
}
