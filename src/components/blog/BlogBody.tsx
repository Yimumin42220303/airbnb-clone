/**
 * 블로그 본문 렌더링.
 *
 * - 링크 [텍스트](url) → <a href="">
 * - [IMG:url|listing:ID|alt] · [LISTING_CARD:ID|...] · [BLOG_COMPARE:ID,ID] · [BLOG_COMPARE]
 */

import Link from "next/link";
import BlogConclusionBox, { type BlogConclusionItem } from "@/components/blog/BlogConclusionBox";
import BlogFaqSection from "@/components/blog/BlogFaqSection";
import BlogListingCard from "@/components/blog/BlogListingCard";
import BlogListingCompareTable from "@/components/blog/BlogListingCompareTable";
import type { BlogListingCardData } from "@/lib/blog-listing-data";
import {
  buildCompareRowFromListing,
  buildListingCardDisplay,
  listingIdsFromCardsBeforeCompare,
  listingPath,
  parseCompareListingIds,
  parseListingCardToken,
  collectListingIdsInOrder,
  isListingId,
  type BlogListingCardOverrides,
} from "@/lib/blog-listing-shortcode";

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

function renderInline(raw: string): string {
  let s = escapeHtml(raw);
  s = s.replace(/`([^`]+)`/g, (_m, code) => `<code>${code}</code>`);
  s = s.replace(/\[([^\]]+)\]\(([^)\s]+)\)/g, (_m, text, url) => {
    const u = String(url);
    if (!isAllowedLinkUrl(u)) return text;
    if (/cloudinary\.com/i.test(u) && !u.includes("/listing/")) return text;
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
  | { type: "listing_card"; listingId: string; overrides: BlogListingCardOverrides }
  | { type: "compare_table"; listingIds: string[] | "auto" }
  | { type: "conclusion"; intro: string; items: BlogConclusionItem[]; footer?: string }
  | { type: "faq"; items: { q: string; a: string }[] };

function stripHtmlToText(html: string): string {
  return html
    .replace(/<br\s*\/?>/gi, " ")
    .replace(/<[^>]+>/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function parseConclusionBlock(inner: string): BlogBodyBlock | null {
  const lines = inner
    .replace(/\r\n/g, "\n")
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean);
  if (lines.length === 0) return null;

  const items: BlogConclusionItem[] = [];
  const introLines: string[] = [];
  const footerLines: string[] = [];
  let phase: "intro" | "items" | "footer" = "intro";

  for (const line of lines) {
    const parts = line.split("|").map((p) => p.trim());
    if (parts.length >= 3 && isListingId(parts[1])) {
      phase = "items";
      items.push({ label: parts[0], listingId: parts[1], name: parts.slice(2).join("|") });
      continue;
    }
    if (phase === "intro") introLines.push(line);
    else footerLines.push(line);
  }

  if (items.length === 0) return null;
  return {
    type: "conclusion",
    intro: introLines.join(" "),
    items,
    footer: footerLines.length ? footerLines.join(" ") : undefined,
  };
}

/** ## 자주 묻는 질문 + ### Q. 블록을 FAQ 섹션으로 묶음 */
function collapseFaqBlocks(blocks: BlogBodyBlock[]): BlogBodyBlock[] {
  const out: BlogBodyBlock[] = [];
  let i = 0;
  while (i < blocks.length) {
    const b = blocks[i];
    if (
      b.type === "heading" &&
      b.level === 2 &&
      stripHtmlToText(b.html).includes("자주 묻는 질문")
    ) {
      const items: { q: string; a: string }[] = [];
      i += 1;
      while (i < blocks.length) {
        const cur = blocks[i];
        if (cur.type === "heading" && cur.level === 2) break;
        if (cur.type === "heading" && cur.level === 3) {
          const raw = stripHtmlToText(cur.html);
          const q = raw.replace(/^Q\.\s*/i, "").trim();
          i += 1;
          const answerParts: string[] = [];
          while (i < blocks.length) {
            const next = blocks[i];
            if (next.type === "heading" && (next.level === 2 || next.level === 3)) break;
            if (next.type === "paragraph") answerParts.push(stripHtmlToText(next.html));
            if (next.type === "list") {
              for (const item of next.items) answerParts.push(stripHtmlToText(item));
            }
            i += 1;
          }
          if (q && answerParts.length) items.push({ q, a: answerParts.join(" ") });
          continue;
        }
        i += 1;
      }
      if (items.length) out.push({ type: "faq", items });
      continue;
    }
    out.push(b);
    i += 1;
  }
  return out;
}

function parseImgToken(inner: string): BlogBodyBlock | null {
  const parts = inner.split("|").map((p) => p.trim());
  const url = parts[0];
  if (!isAllowedImageUrl(url)) return null;

  let linkHref: string | undefined;
  let alt: string | undefined;

  for (let i = 1; i < parts.length; i++) {
    const p = parts[i];
    if (p.startsWith("listing:")) {
      const id = p.slice("listing:".length);
      linkHref = listingPath(id);
    } else if (p.startsWith("/listing/")) {
      linkHref = p.split("?")[0];
    } else if (p) {
      alt = p;
    }
  }

  return { type: "image", url, linkHref, alt };
}

function parseTextBlocks(text: string): BlogBodyBlock[] {
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
      const parsed = parseListingCardToken(listingCard[1]);
      if (parsed) {
        blocks.push({
          type: "listing_card",
          listingId: parsed.listingId,
          overrides: parsed.overrides,
        });
      }
      i += 1;
      continue;
    }

    const compareMatch = trimmed.match(/^\[BLOG_COMPARE(?::([^\]]*))?\]$/i);
    if (compareMatch) {
      flushParagraph();
      blocks.push({
        type: "compare_table",
        listingIds: parseCompareListingIds(compareMatch[1]),
      });
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

export function parseBlogBody(body: string): BlogBodyBlock[] {
  const blocks: BlogBodyBlock[] = [];
  const re =
    /\[BLOG_CONCLUSION\]([\s\S]*?)\[\/BLOG_CONCLUSION\]|\[IMG:([^\]]+)\]|\[LISTING_CARD:([^\]]+)\]|\[BLOG_COMPARE(?::[^\]]*)?\]/gi;
  let lastIndex = 0;
  let m: RegExpExecArray | null;

  while ((m = re.exec(body)) !== null) {
    if (m.index > lastIndex) {
      blocks.push(...parseTextBlocks(body.slice(lastIndex, m.index)));
    }
    const full = m[0];
    if (full.toUpperCase().startsWith("[BLOG_CONCLUSION")) {
      const conclusion = parseConclusionBlock(m[1] ?? "");
      if (conclusion) blocks.push(conclusion);
    } else if (full.toUpperCase().startsWith("[IMG:")) {
      const img = parseImgToken(m[2]);
      if (img) blocks.push(img);
      else blocks.push(...parseTextBlocks(full));
    } else if (full.toUpperCase().startsWith("[LISTING_CARD:")) {
      const parsed = parseListingCardToken(m[3]);
      if (parsed) {
        blocks.push({
          type: "listing_card",
          listingId: parsed.listingId,
          overrides: parsed.overrides,
        });
      }
    } else if (full.toUpperCase().startsWith("[BLOG_COMPARE")) {
      const inner = full.match(/\[BLOG_COMPARE(?::([^\]]*))?\]/i)?.[1];
      blocks.push({
        type: "compare_table",
        listingIds: parseCompareListingIds(inner),
      });
    }
    lastIndex = re.lastIndex;
  }

  if (lastIndex < body.length) {
    blocks.push(...parseTextBlocks(body.slice(lastIndex)));
  }
  return collapseFaqBlocks(blocks);
}

export function collectListingIdsFromBlocks(blocks: BlogBodyBlock[]): string[] {
  const fromBody = blocks.flatMap((block) => {
    if (block.type === "listing_card") return [block.listingId];
    if (block.type === "image" && block.linkHref?.startsWith("/listing/")) {
      return [block.linkHref.replace("/listing/", "").split("?")[0]];
    }
    if (block.type === "compare_table" && Array.isArray(block.listingIds)) {
      return block.listingIds;
    }
    return [];
  });
  return Array.from(new Set(fromBody));
}

export function collectListingIdsForPage(body: string, blocks?: BlogBodyBlock[]): string[] {
  const parsed = blocks ?? parseBlogBody(body);
  const ordered = collectListingIdsInOrder(body);
  const fromBlocks = collectListingIdsFromBlocks(parsed);
  const merged = [...ordered];
  for (const id of fromBlocks) {
    if (!merged.includes(id)) merged.push(id);
  }
  return merged;
}

function resolveCompareIds(blocks: BlogBodyBlock[], blockIndex: number): string[] {
  const block = blocks[blockIndex];
  if (block.type !== "compare_table") return [];
  if (Array.isArray(block.listingIds) && block.listingIds.length > 0) {
    return block.listingIds;
  }
  return listingIdsFromCardsBeforeCompare(
    blocks.map((b) =>
      b.type === "listing_card" ? { type: b.type, listingId: b.listingId } : { type: b.type }
    ),
    blockIndex
  );
}

type BlogBodyProps = {
  body?: string;
  blocks?: BlogBodyBlock[];
  listingsMap?: Map<string, BlogListingCardData>;
  className?: string;
  defaultImageAlt?: string;
};

export default function BlogBody({
  body,
  blocks: blocksProp,
  listingsMap = new Map(),
  className = "",
  defaultImageAlt = "",
}: BlogBodyProps) {
  const blocks = blocksProp ?? parseBlogBody(body ?? "");

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
            const linkHref =
              block.linkHref?.startsWith("/listing/") ? block.linkHref : undefined;
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
                {linkHref ? (
                  <Link
                    href={linkHref}
                    className="block focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-minbak-primary"
                    data-blog-link-type="listing_image"
                    data-listing-id={linkHref.replace("/listing/", "").split("?")[0]}
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
            const listing = listingsMap.get(block.listingId);
            if (!listing) return null;
            const display = buildListingCardDisplay(listing, block.overrides);
            return <BlogListingCard key={i} listing={listing} display={display} />;
          }
          case "compare_table": {
            const ids = resolveCompareIds(blocks, i);
            if (!ids.length) return null;
            const rows = ids
              .map((id) => {
                const listing = listingsMap.get(id);
                if (!listing) return null;
                return buildCompareRowFromListing(listing);
              })
              .filter((r): r is NonNullable<typeof r> => !!r);
            if (!rows.length) return null;
            return <BlogListingCompareTable key={i} rows={rows} />;
          }
          case "conclusion":
            return (
              <BlogConclusionBox
                key={i}
                intro={block.intro}
                items={block.items}
                footer={block.footer}
              />
            );
          case "faq":
            return <BlogFaqSection key={i} items={block.items} />;
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
