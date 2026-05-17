/**
 * 블로그 본문 렌더링. [IMG:url] 형식은 이미지로 치환.
 * url은 https://, http://, / 로 시작하는 것만 허용 (XSS 방지).
 */
function isAllowedImageUrl(url: string): boolean {
  const t = url.trim();
  return (
    t.startsWith("https://") || t.startsWith("http://") || t.startsWith("/")
  );
}

type Segment = { type: "text"; html: string } | { type: "image"; url: string };

export function parseBlogBody(body: string): Segment[] {
  const segments: Segment[] = [];
  const re = /\[IMG:([^\]]+)\]/g;
  let lastIndex = 0;
  let m: RegExpExecArray | null;
  while ((m = re.exec(body)) !== null) {
    if (m.index > lastIndex) {
      const text = body.slice(lastIndex, m.index);
      segments.push({
        type: "text",
        html: text.replace(/\n/g, "<br />"),
      });
    }
    const url = m[1].trim();
    if (isAllowedImageUrl(url)) {
      segments.push({ type: "image", url });
    } else {
      segments.push({ type: "text", html: m[0] });
    }
    lastIndex = re.lastIndex;
  }
  if (lastIndex < body.length) {
    segments.push({
      type: "text",
      html: body.slice(lastIndex).replace(/\n/g, "<br />"),
    });
  }
  return segments;
}

type BlogBodyProps = {
  body: string;
  className?: string;
};

export default function BlogBody({ body, className = "" }: BlogBodyProps) {
  const segments = parseBlogBody(body);

  return (
    <div
      className={`prose prose-neutral max-w-none text-minbak-body text-minbak-black ${className}`}
    >
      {segments.map((seg, i) =>
        seg.type === "text" ? (
          <span
            key={i}
            dangerouslySetInnerHTML={{ __html: seg.html }}
            className="block [&:not(:last-child)]:mb-4"
          />
        ) : (
          <figure
            key={i}
            className="my-6 rounded-minbak overflow-hidden bg-minbak-light-gray"
          >
            {/* next/image는 remotePatterns 밖 호스트에서 런타임 오류(500)가 날 수 있어 img 사용 */}
            <img
              src={seg.url}
              alt=""
              className="w-full h-auto max-w-full object-contain"
              loading="lazy"
              decoding="async"
            />
          </figure>
        )
      )}
    </div>
  );
}
