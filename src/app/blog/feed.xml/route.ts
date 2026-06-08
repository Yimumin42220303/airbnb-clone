import { getPostsForFeed } from "@/lib/blog";
import {
  RSS_DEFAULT_LIMIT,
  RSS_RESPONSE_HEADERS,
  buildBlogRssXml,
} from "@/lib/blog-rss";

export const revalidate = 3600;

/** 레거시 RSS 경로 — /rss.xml 과 동일 피드 (하위 호환) */
export async function GET() {
  let posts: Awaited<ReturnType<typeof getPostsForFeed>> = [];
  try {
    posts = await getPostsForFeed(RSS_DEFAULT_LIMIT);
  } catch (e) {
    console.error("[blog/feed.xml] DB fetch failed:", e instanceof Error ? e.message : e);
  }

  const xml = buildBlogRssXml(posts, "/blog/feed.xml");

  return new Response(xml, { headers: RSS_RESPONSE_HEADERS });
}
