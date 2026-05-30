/**
 * 블로그 본문 렌더링.
 *
 * - 경량 마크다운 지원: 제목(##~####), 목록(-, *, 1.), 인용(>), 구분선(---),
 *   굵게(**), 기울임(*,_), 인라인 코드(`), 링크([텍스트](url)).
 * - 커스텀 이미지 문법: [IMG:url] (기존 글과 호환). url은 https/http/ 로 시작하는 것만 허용.
 * - 외부 라이브러리 없이 동작하며, 모든 텍스트는 HTML 이스케이프 후 우리가 허용한
 *   태그만 주입하므로 원문 HTML(스크립트 등)은 렌더되지 않습니다(XSS 방지).
 */

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

/** 한 줄(또는 문단)의 인라인 마크다운을 안전한 HTML로 변환 */
function renderInline(raw: string): string {
  let s = escapeHtml(raw);

  // 인라인 코드 `code`
  s = s.replace(/`([^`]+)`/g, (_m, code) => `<code>${code}</code>`);

  // 링크 [텍스트](url)
  s = s.replace(/\[([^\]]+)\]\(([^)\s]+)\)/g, (_m, text, url) => {
    const u = String(url);
    if (!isAllowedLinkUrl(u)) return text;
    const external = u.startsWith("http");
    const rel = external ? ' target="_blank" rel="noopener noreferrer nofollow"' : "";
    return `<a href="${u}"${rel}>${text}</a>`;
  });

  // 굵게 **text**
  s = s.replace(/\*\*([^*]+)\*\*/g, (_m, t) => `<strong>${t}</strong>`);

  // 기울임 *text* 또는 _text_
  s = s.replace(/(^|[^*])\*([^*\s][^*]*?)\*(?!\*)/g, (_m, pre, t) => `${pre}<em>${t}</em>`);
  s = s.replace(/(^|[^_])_([^_\s][^_]*?)_(?!_)/g, (_m, pre, t) => `${pre}<em>${t}</em>`);

  return s;
}

type Block =
  | { type: "heading"; level: 2 | 3 | 4; html: string }
  | { type: "paragraph"; html: string }
  | { type: "list"; ordered: boolean; items: string[] }
  | { type: "quote"; html: string }
  | { type: "hr" }
  | { type: "image"; url: string };

/** 텍스트 청크(이미지 제외)를 블록 단위로 파싱 */
function parseTextBlocks(text: string): Block[] {
  const blocks: Block[] = [];
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

    // 구분선
    if (/^(-{3,}|\*{3,}|_{3,})$/.test(trimmed)) {
      flushParagraph();
      blocks.push({ type: "hr" });
      i += 1;
      continue;
    }

    // 제목 #, ##, ###, #### (단일 #는 페이지 h1과 중복되므로 h2로)
    const heading = trimmed.match(/^(#{1,4})\s+(.*)$/);
    if (heading) {
      flushParagraph();
      const hashes = heading[1].length;
      const level = (hashes <= 2 ? 2 : hashes === 3 ? 3 : 4) as 2 | 3 | 4;
      blocks.push({ type: "heading", level, html: renderInline(heading[2].trim()) });
      i += 1;
      continue;
    }

    // 인용 >
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

    // 순서 없는 목록 - 또는 *
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

    // 순서 있는 목록 1. 2. ...
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

/** 본문 전체를 블록 배열로 파싱 ([IMG:url]을 기준으로 분리 후 텍스트는 마크다운 파싱) */
export function parseBlogBody(body: string): Block[] {
  const blocks: Block[] = [];
  const re = /\[IMG:([^\]]+)\]/g;
  let lastIndex = 0;
  let m: RegExpExecArray | null;

  while ((m = re.exec(body)) !== null) {
    if (m.index > lastIndex) {
      blocks.push(...parseTextBlocks(body.slice(lastIndex, m.index)));
    }
    const url = m[1].trim();
    if (isAllowedImageUrl(url)) {
      blocks.push({ type: "image", url });
    } else {
      blocks.push(...parseTextBlocks(m[0]));
    }
    lastIndex = re.lastIndex;
  }
  if (lastIndex < body.length) {
    blocks.push(...parseTextBlocks(body.slice(lastIndex)));
  }
  return blocks;
}

type BlogBodyProps = {
  body: string;
  className?: string;
  /** 본문 [IMG:...] 블록 alt (없으면 빈 문자열) */
  imageAlt?: string;
};

export default function BlogBody({ body, className = "", imageAlt = "" }: BlogBodyProps) {
  const blocks = parseBlogBody(body);

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
          case "image":
            return (
              <figure key={i} className="my-6 rounded-minbak overflow-hidden bg-minbak-light-gray">
                {/* next/image는 remotePatterns 밖 호스트에서 런타임 오류(500)가 날 수 있어 img 사용 */}
                <img
                  src={block.url}
                  alt={imageAlt}
                  className="w-full h-auto max-w-full object-contain"
                  loading="lazy"
                  decoding="async"
                />
              </figure>
            );
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
