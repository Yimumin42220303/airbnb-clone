import { getPosts } from "@/lib/blog";
import { BASE_URL } from "@/lib/site-url";

export const revalidate = 3600;

function escapeXml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

export async function GET() {
  let posts: Awaited<ReturnType<typeof getPosts>> = [];
  try {
    posts = await getPosts({ publishedOnly: true });
  } catch (e) {
    console.error("[blog/feed.xml] DB fetch failed:", e instanceof Error ? e.message : e);
  }

  const siteTitle = "도쿄민박 블로그";
  const siteDesc = "도쿄 숙소, 일본 여행 꿀팁, 민박 이용 후기와 운영 소식";
  const feedUrl = `${BASE_URL}/blog/feed.xml`;
  const lastBuild = posts[0]?.publishedAt ?? posts[0]?.createdAt ?? new Date();

  const items = posts
    .map((post) => {
      const url = `${BASE_URL}/blog/${encodeURIComponent(post.slug)}`;
      const pubDate = (post.publishedAt ?? post.createdAt).toUTCString();
      const description = post.excerpt || "";
      return `    <item>
      <title>${escapeXml(post.title)}</title>
      <link>${escapeXml(url)}</link>
      <guid isPermaLink="true">${escapeXml(url)}</guid>
      <pubDate>${pubDate}</pubDate>
      <description>${escapeXml(description)}</description>
    </item>`;
    })
    .join("\n");

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>${escapeXml(siteTitle)}</title>
    <link>${BASE_URL}/blog</link>
    <description>${escapeXml(siteDesc)}</description>
    <language>ko</language>
    <lastBuildDate>${new Date(lastBuild).toUTCString()}</lastBuildDate>
    <atom:link href="${feedUrl}" rel="self" type="application/rss+xml" />
${items}
  </channel>
</rss>`;

  return new Response(xml, {
    headers: {
      "Content-Type": "application/rss+xml; charset=utf-8",
      "Cache-Control": "public, max-age=3600, s-maxage=3600",
    },
  });
}
