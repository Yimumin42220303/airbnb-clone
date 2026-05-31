import BlogBody from "@/components/blog/BlogBody";
import { parseBlogBody, collectListingIdsFromBlocks } from "@/components/blog/BlogBody";
import { getListingsForBlogCards } from "@/lib/blog-listing-data";
import { getBlogPostListingEmbed } from "@/lib/blog-listing-embeds";

type Props = {
  body: string;
  slug: string;
  className?: string;
  defaultImageAlt?: string;
};

/** slug별 숙소 임베드·카드 데이터를 조회한 뒤 본문 렌더 */
export default async function BlogArticleBody({
  body,
  slug,
  className,
  defaultImageAlt = "",
}: Props) {
  const embed = getBlogPostListingEmbed(slug);
  const blocks = parseBlogBody(body, { embed });
  const listingIds = collectListingIdsFromBlocks(blocks, embed);
  const listingsMap = await getListingsForBlogCards(listingIds);

  return (
    <BlogBody
      blocks={blocks}
      slug={slug}
      embed={embed}
      listingsMap={listingsMap}
      className={className}
      defaultImageAlt={defaultImageAlt}
    />
  );
}
