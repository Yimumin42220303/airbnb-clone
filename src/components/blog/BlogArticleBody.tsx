import BlogBody, {
  collectListingIdsForPage,
  parseBlogBody,
} from "@/components/blog/BlogBody";
import { getListingsForBlogCards } from "@/lib/blog-listing-data";

type Props = {
  body: string;
  className?: string;
  defaultImageAlt?: string;
};

export default async function BlogArticleBody({
  body,
  className,
  defaultImageAlt = "",
}: Props) {
  const blocks = parseBlogBody(body);
  const listingIds = collectListingIdsForPage(body, blocks);
  const listingsMap = await getListingsForBlogCards(listingIds);

  return (
    <BlogBody
      blocks={blocks}
      listingsMap={listingsMap}
      className={className}
      defaultImageAlt={defaultImageAlt}
    />
  );
}
