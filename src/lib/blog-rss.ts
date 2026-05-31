import { parseBlogBody } from "@/components/blog/BlogBody";
import { getBlogSeoOverride } from "@/lib/blog";
import { getCategoryLabel } from "@/lib/blog-categories";

/** 네이버 서치어드바이저 제출용 — RSS 내 URL은 항상 운영 도메인으로 고정 */
export const RSS_SITE_URL = "https://tokyominbak.net";

export const RSS_CHANNEL = {
  title: "도쿄민박 블로그",
  link: `${RSS_SITE_URL}/blog`,
  description:
    "한국인을 위한 도쿄 숙소 예약 플랫폼 도쿄민박의 공식 블로그입니다. 도쿄 숙소 선택, 지역 가이드, 예약 전후 안내, 한국어 운영대응 정보를 제공합니다.",
  language: "ko-KR",
} as const;

export const RSS_DEFAULT_LIMIT = 30;

export type BlogRssPost = {
  title: string;
  slug: string;
  excerpt: string | null;
  metaDescription?: string | null;
  body: string;
  category: string | null;
  publishedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
};

type BodyBlock = ReturnType<typeof parseBlogBody>[number];

export function escapeXml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

/** CDATA 내부 ]]> 시퀀스 안전 분리 */
export function wrapCdata(content: string): string {
  return `<![CDATA[${content.replace(/]]>/g, "]]]]><![CDATA[>")}]]>`;
}

function blocksToHtml(blocks: BodyBlock[]): string {
  return blocks
    .map((block) => {
      switch (block.type) {
        case "heading":
          return `<h${block.level}>${block.html}</h${block.level}>`;
        case "paragraph":
          return `<p>${block.html}</p>`;
        case "list": {
          const tag = block.ordered ? "ol" : "ul";
          const items = block.items.map((item) => `<li>${item}</li>`).join("");
          return `<${tag}>${items}</${tag}>`;
        }
        case "quote":
          return `<blockquote>${block.html}</blockquote>`;
        case "hr":
          return "<hr />";
        case "image": {
          const src = block.url.startsWith("/")
            ? `${RSS_SITE_URL}${block.url}`
            : block.url;
          const alt = escapeXml(block.alt || "");
          const img = `<img src="${escapeXml(src)}" alt="${alt}" loading="lazy" />`;
          if (block.linkHref) {
            const href = block.linkHref.startsWith("/")
              ? `${RSS_SITE_URL}${block.linkHref}`
              : block.linkHref;
            return `<figure><a href="${escapeXml(href)}">${img}</a></figure>`;
          }
          return `<figure>${img}</figure>`;
        }
        default:
          return "";
      }
    })
    .filter(Boolean)
    .join("\n");
}

function resolveItemDescription(post: BlogRssPost): string {
  const seo = getBlogSeoOverride(post.slug);
  if (seo?.description?.trim()) return seo.description.trim();
  if (post.metaDescription?.trim()) return post.metaDescription.trim();
  if (post.excerpt?.trim()) return post.excerpt.trim();
  const plain = post.body
    .replace(/\[IMG:[^\]]+\]/g, "")
    .replace(/\s+/g, " ")
    .trim();
  return plain.slice(0, 300) + (plain.length > 300 ? "…" : "");
}

function resolveItemContentHtml(post: BlogRssPost): string {
  return blocksToHtml(parseBlogBody(post.body));
}

export function buildBlogRssXml(posts: BlogRssPost[], feedSelfPath: string): string {
  const feedUrl = feedSelfPath.startsWith("http")
    ? feedSelfPath
    : `${RSS_SITE_URL}${feedSelfPath.startsWith("/") ? feedSelfPath : `/${feedSelfPath}`}`;

  const lastBuild = posts[0]?.publishedAt ?? posts[0]?.createdAt ?? new Date();

  const items =
    posts.length > 0
      ? posts
          .map((post) => {
            const url = `${RSS_SITE_URL}/blog/${encodeURIComponent(post.slug)}`;
            const pubDate = (post.publishedAt ?? post.createdAt).toUTCString();
            const description = resolveItemDescription(post);
            const contentHtml = resolveItemContentHtml(post);
            const categoryLabel = getCategoryLabel(post.category);
            const categoryXml = categoryLabel
              ? `\n      <category>${escapeXml(categoryLabel)}</category>`
              : "";

            return `    <item>
      <title>${escapeXml(post.title)}</title>
      <link>${escapeXml(url)}</link>
      <guid isPermaLink="true">${escapeXml(url)}</guid>
      <pubDate>${pubDate}</pubDate>
      <description>${escapeXml(description)}</description>${categoryXml}
      <content:encoded>${wrapCdata(contentHtml)}</content:encoded>
    </item>`;
          })
          .join("\n")
      : "";

  return `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:content="http://purl.org/rss/1.0/modules/content/" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>${escapeXml(RSS_CHANNEL.title)}</title>
    <link>${RSS_CHANNEL.link}</link>
    <description>${escapeXml(RSS_CHANNEL.description)}</description>
    <language>${RSS_CHANNEL.language}</language>
    <lastBuildDate>${new Date(lastBuild).toUTCString()}</lastBuildDate>
    <atom:link href="${escapeXml(feedUrl)}" rel="self" type="application/rss+xml" />
${items}
  </channel>
</rss>`;
}

export const RSS_RESPONSE_HEADERS = {
  "Content-Type": "application/rss+xml; charset=utf-8",
  "Cache-Control": "public, max-age=3600, s-maxage=3600",
} as const;
