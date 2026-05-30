import { getPostsForFeed } from "@/lib/blog";
import {
  RSS_DEFAULT_LIMIT,
  RSS_RESPONSE_HEADERS,
  RSS_SITE_URL,
  buildBlogRssXml,
} from "@/lib/blog-rss";

export const revalidate = 3600;

export async function GET() {
  let posts: Awaited<ReturnType<typeof getPostsForFeed>> = [];
  try {
    posts = await getPostsForFeed(RSS_DEFAULT_LIMIT);
  } catch (e) {
    console.error("[rss.xml] DB fetch failed:", e instanceof Error ? e.message : e);
  }

  const xml = buildBlogRssXml(posts, `${RSS_SITE_URL}/rss.xml`);

  return new Response(xml, { headers: RSS_RESPONSE_HEADERS });
}
