/**
 * 블로그 본문 렌더링.
 *
 * - 경량 마크다운: 제목, 목록, 링크 [텍스트](url) → crawlable <a href="">
 * - [IMG:url] · [IMG:url|listing:ID|alt] · [LISTING_CARD:key] · [BLOG_COMPARE]
 */

import Link from "next/link";
import BlogListingCard from "@/components/blog/BlogListingCard";
import BlogListingCompareTable from "@/components/blog/BlogListingCompareTable";
import type { BlogListingCardData } from "@/lib/blog-listing-data";
import type { BlogPostListingEmbed } from "@/lib/blog-listing-embeds";
import { listingPath } from "@/lib/blog-listing-embeds";

function isAllowedImageUrl(url: string): boolean {
  const t = url.trim();
  return t.startsWith("https://") || t.startsWith("http://") || t.startsWith("/");
}

function isAllowedLinkUrl(url: string): boolean {
  const t = url.trim();
  return (
    t.startsWith("https://") ||
    t.startsWith("http://") ||
    t.startsWith("/") ||
    t.startsWith("mailto:") ||
    t.startsWith("#")
  );
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/** 한 줄 인라인 마크다운 → HTML (<a href> 포함) */
function renderInline(raw: string): string {
  let s = escapeHtml(raw);

  s = s.replace(/`([^`]+)`/g, (_m, code) => `<code>${code}</code>`);

  s = s.replace(/\[([^\]]+)\]\(([^)\s]+)\)/g, (_m, text, url) => {
    const u = String(url);
    if (!isAllowedLinkUrl(u)) return text;
    const external = u.startsWith("http");
    const rel = external ? ' target="_blank" rel="noopener noreferrer nofollow"' : "";
    return `<a href="${u}"${rel}>${text}</a>`;
  });

  s = s.replace(/\*\*([^*]+)\*\*/g, (_m, t) => `<strong>${t}</strong>`);
  s = s.replace(/(^|[^*])\*([^*\s][^*]*?)\*(?!\*)/g, (_m, pre, t) => `${pre}<em>${t}</em>`);
  s = s.replace(/(^|[^_])_([^_\s][^_]*?)_(?!_)/g, (_m, pre, t) => `${pre}<em>${t}</em>`);

  return s;
}

export type BlogBodyBlock =
  | { type: "heading"; level: 2 | 3 | 4; html: string }
  | { type: "paragraph"; html: string }
  | { type: "list"; ordered: boolean; items: string[] }
  | { type: "quote"; html: string }
  | { type: "hr" }
  | { type: "image"; url: string; linkHref?: string; alt?: string }
  | { type: "listing_card"; listingKey: string }
  | { type: "compare_table" };

type ParseOptions = {
  embed?: BlogPostListingEmbed | null;
};

function parseImgToken(inner: string, embed?: BlogPostListingEmbed | null): BlogBodyBlock | null {
  const parts = inner.split("|").map((p) => p.trim());
  const url = parts[0];
  if (!isAllowedImageUrl(url)) return null;

  let linkHref: string | undefined;
  let alt: string | undefined;

  for (let i = 1; i < parts.length; i++) {
    const p = parts[i];
    if (p.startsWith("listing:")) {
      linkHref = listingPath(p.slice("listing:".length));
    } else if (p.startsWith("/listing/")) {
      linkHref = p.split("?")[0];
    } else if (p) {
      alt = p;
    }
  }
  if (!linkHref && embed) {
    const key = Object.keys(embed.listings).find(
      (k) =>
        embed.listings[k].imageUrlHint && url.includes(embed.listings[k].imageUrlHint!)
    );
    if (key) linkHref = listingPath(embed.listings[key].listingId);
  }

  return { type: "image", url, linkHref, alt };
}

function resolveListingCardKey(token: string, embed?: BlogPostListingEmbed | null): string | null {
  const t = token.trim();
  if (embed?.listings[t]) return t;
  if (embed) {
    const found = Object.entries(embed.listings).find(([, m]) => m.listingId === t);
    if (found) return found[0];
  }
  return null;
}

/** 텍스트 청크 파싱 */
function parseTextBlocks(text: string, opts?: ParseOptions): BlogBodyBlock[] {
  const blocks: BlogBodyBlock[] = [];
  const lines = text.replace(/\r\n/g, "\n").split("\n");
  let i = 0;
  let paragraph: string[] = [];

  function flushParagraph() {
    if (paragraph.length === 0) return;
    const joined = paragraph.map((l) => renderInline(l)).join("<br />");
    if (joined.trim()) blocks.push({ type: "paragraph", html: joined });
    paragraph = [];
  }

  while (i < lines.length) {
    const line = lines[i];
    const trimmed = line.trim();

    if (trimmed === "") {
      flushParagraph();
      i += 1;
      continue;
    }

    const listingCard = trimmed.match(/^\[LISTING_CARD:([^\]]+)\]$/i);
    if (listingCard) {
      flushParagraph();
      const key = resolveListingCardKey(listingCard[1], opts?.embed);
      if (key) blocks.push({ type: "listing_card", listingKey: key });
      i += 1;
      continue;
    }

    if (/^\[BLOG_COMPARE(?::[^\]]*)?\]$/i.test(trimmed)) {
      flushParagraph();
      blocks.push({ type: "compare_table" });
      i += 1;
      continue;
    }

    if (/^(-{3,}|\*{3,}|_{3,})$/.test(trimmed)) {
      flushParagraph();
      blocks.push({ type: "hr" });
      i += 1;
      continue;
    }

    const heading = trimmed.match(/^(#{1,4})\s+(.*)$/);
    if (heading) {
      flushParagraph();
      const hashes = heading[1].length;
      const level = (hashes <= 2 ? 2 : hashes === 3 ? 3 : 4) as 2 | 3 | 4;
      blocks.push({ type: "heading", level, html: renderInline(heading[2].trim()) });
      i += 1;
      continue;
    }

    if (/^>\s?/.test(trimmed)) {
      flushParagraph();
      const quoteLines: string[] = [];
      while (i < lines.length && /^>\s?/.test(lines[i].trim())) {
        quoteLines.push(lines[i].trim().replace(/^>\s?/, ""));
        i += 1;
      }
      blocks.push({
        type: "quote",
        html: quoteLines.map((l) => renderInline(l)).join("<br />"),
      });
      continue;
    }

    if (/^[-*]\s+/.test(trimmed)) {
      flushParagraph();
      const items: string[] = [];
      while (i < lines.length && /^[-*]\s+/.test(lines[i].trim())) {
        items.push(renderInline(lines[i].trim().replace(/^[-*]\s+/, "")));
        i += 1;
      }
      blocks.push({ type: "list", ordered: false, items });
      continue;
    }

    if (/^\d+\.\s+/.test(trimmed)) {
      flushParagraph();
      const items: string[] = [];
      while (i < lines.length && /^\d+\.\s+/.test(lines[i].trim())) {
        items.push(renderInline(lines[i].trim().replace(/^\d+\.\s+/, "")));
        i += 1;
      }
      blocks.push({ type: "list", ordered: true, items });
      continue;
    }

    paragraph.push(line);
    i += 1;
  }

  flushParagraph();
  return blocks;
}

/** 본문 → 블록 배열 */
export function parseBlogBody(body: string, opts?: ParseOptions): BlogBodyBlock[] {
  const blocks: BlogBodyBlock[] = [];
  const re = /\[IMG:([^\]]+)\]|\[LISTING_CARD:([^\]]+)\]|\[BLOG_COMPARE(?::[^\]]*)?\]/gi;
  let lastIndex = 0;
  let m: RegExpExecArray | null;

  while ((m = re.exec(body)) !== null) {
    if (m.index > lastIndex) {
      blocks.push(...parseTextBlocks(body.slice(lastIndex, m.index), opts));
    }
    const full = m[0];
    if (full.toUpperCase().startsWith("[IMG:")) {
      const img = parseImgToken(m[1], opts?.embed);
      if (img) blocks.push(img);
      else blocks.push(...parseTextBlocks(full, opts));
    } else if (full.toUpperCase().startsWith("[LISTING_CARD:")) {
      const key = resolveListingCardKey(m[2], opts?.embed);
      if (key) blocks.push({ type: "listing_card", listingKey: key });
    } else if (full.toUpperCase().startsWith("[BLOG_COMPARE")) {
      blocks.push({ type: "compare_table" });
    }
    lastIndex = re.lastIndex;
  }

  if (lastIndex < body.length) {
    blocks.push(...parseTextBlocks(body.slice(lastIndex), opts));
  }
  return blocks;
}

export function collectListingIdsFromBlocks(
  blocks: BlogBodyBlock[],
  embed?: BlogPostListingEmbed | null
): string[] {
  const ids = new Set<string>();
  for (const block of blocks) {
    if (block.type === "image" && block.linkHref?.startsWith("/listing/")) {
      ids.add(block.linkHref.replace("/listing/", "").split("?")[0]);
    }
    if (block.type === "listing_card") {
      const meta = embed?.listings[block.listingKey];
      if (meta) ids.add(meta.listingId);
      else if (/^c[a-z0-9]{20,}$/i.test(block.listingKey)) ids.add(block.listingKey);
    }
    if (block.type === "compare_table" && embed) {
      for (const row of embed.compareRows) {
        const meta = embed.listings[row.listingKey];
        if (meta) ids.add(meta.listingId);
      }
    }
  }
  return Array.from(ids);
}

type BlogBodyProps = {
  body?: string;
  blocks?: BlogBodyBlock[];
  slug?: string;
  embed?: BlogPostListingEmbed | null;
  listingsMap?: Map<string, BlogListingCardData>;
  className?: string;
  defaultImageAlt?: string;
};

export default function BlogBody({
  body,
  blocks: blocksProp,
  embed = null,
  listingsMap = new Map(),
  className = "",
  defaultImageAlt = "",
}: BlogBodyProps) {
  const blocks = blocksProp ?? parseBlogBody(body ?? "", { embed });

  return (
    <div className={`prose prose-neutral max-w-none text-minbak-body text-minbak-black ${className}`}>
      {blocks.map((block, i) => {
        switch (block.type) {
          case "heading": {
            const cls =
              block.level === 2
                ? "text-minbak-h2 font-semibold text-minbak-black mt-8 mb-3"
                : block.level === 3
                  ? "text-minbak-h3 font-semibold text-minbak-black mt-6 mb-2"
                  : "text-minbak-title font-semibold text-minbak-black mt-5 mb-2";
            if (block.level === 2)
              return <h2 key={i} className={cls} dangerouslySetInnerHTML={{ __html: block.html }} />;
            if (block.level === 3)
              return <h3 key={i} className={cls} dangerouslySetInnerHTML={{ __html: block.html }} />;
            return <h4 key={i} className={cls} dangerouslySetInnerHTML={{ __html: block.html }} />;
          }
          case "list":
            return block.ordered ? (
              <ol key={i} className="list-decimal pl-6 my-4 space-y-1.5">
                {block.items.map((item, j) => (
                  <li key={j} dangerouslySetInnerHTML={{ __html: item }} />
                ))}
              </ol>
            ) : (
              <ul key={i} className="list-disc pl-6 my-4 space-y-1.5">
                {block.items.map((item, j) => (
                  <li key={j} dangerouslySetInnerHTML={{ __html: item }} />
                ))}
              </ul>
            );
          case "quote":
            return (
              <blockquote
                key={i}
                className="border-l-4 border-minbak-light-gray pl-4 my-4 text-minbak-gray italic"
                dangerouslySetInnerHTML={{ __html: block.html }}
              />
            );
          case "hr":
            return <hr key={i} className="my-8 border-minbak-light-gray" />;
          case "image": {
            const alt = block.alt || defaultImageAlt;
            const imgEl = (
              /* eslint-disable-next-line @next/next/no-img-element */
              <img
                src={block.url}
                alt={alt}
                className="w-full h-auto max-w-full object-contain"
                loading="lazy"
                decoding="async"
              />
            );
            return (
              <figure key={i} className="my-6 rounded-minbak overflow-hidden bg-minbak-light-gray">
                {block.linkHref ? (
                  <Link
                    href={block.linkHref}
                    className="block focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-minbak-primary"
                    data-blog-link-type="listing_image"
                    data-listing-id={block.linkHref.replace("/listing/", "").split("?")[0]}
                  >
                    {imgEl}
                  </Link>
                ) : (
                  imgEl
                )}
              </figure>
            );
          }
          case "listing_card": {
            const meta = embed?.listings[block.listingKey];
            if (!meta) return null;
            const listing = listingsMap.get(meta.listingId);
            if (!listing) return null;
            return <BlogListingCard key={i} listing={listing} meta={meta} />;
          }
          case "compare_table":
            if (!embed?.compareRows.length) return null;
            return <BlogListingCompareTable key={i} rows={embed.compareRows} listings={embed.listings} />;
          case "paragraph":
          default:
            return (
              <p
                key={i}
                className="[&:not(:last-child)]:mb-4 leading-relaxed"
                dangerouslySetInnerHTML={{ __html: block.html }}
              />
            );
        }
      })}
    </div>
  );
}
