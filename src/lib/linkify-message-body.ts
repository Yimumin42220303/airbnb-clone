/**
 * 메시지 본문에서 http(s) URL을 찾아 텍스트/링크 세그먼트로 분리 (표시용, DB 변경 없음).
 */

export type MessageBodySegment =
  | { type: "text"; value: string }
  | { type: "link"; value: string; href: string };

/** URL 끝에 붙은 문장부호는 링크에서 제외 */
const TRAILING_PUNCT = /[.,;:!?)\]}＞」』】、。，；：！？]+$/;

const URL_REGEX =
  /https?:\/\/[^\s<>"']+/gi;

function trimTrailingPunctuation(url: string): { href: string; trailing: string } {
  let href = url;
  let trailing = "";
  const match = href.match(TRAILING_PUNCT);
  if (match) {
    trailing = match[0];
    href = href.slice(0, -trailing.length);
  }
  return { href, trailing };
}

function isSafeHttpUrl(href: string): boolean {
  try {
    const u = new URL(href);
    return u.protocol === "http:" || u.protocol === "https:";
  } catch {
    return false;
  }
}

/**
 * @param text 메시지 본문 (body 또는 bodyDisplay)
 */
export function linkifyMessageBody(text: string): MessageBodySegment[] {
  if (!text) return [];

  const segments: MessageBodySegment[] = [];
  let lastIndex = 0;
  const re = new RegExp(URL_REGEX.source, URL_REGEX.flags);
  let match: RegExpExecArray | null;

  while ((match = re.exec(text)) !== null) {
    const raw = match[0];
    const start = match.index;
    if (start > lastIndex) {
      segments.push({ type: "text", value: text.slice(lastIndex, start) });
    }
    const { href, trailing } = trimTrailingPunctuation(raw);
    if (href && isSafeHttpUrl(href)) {
      segments.push({ type: "link", value: href, href });
      if (trailing) {
        segments.push({ type: "text", value: trailing });
      }
    } else {
      segments.push({ type: "text", value: raw });
    }
    lastIndex = start + raw.length;
    if (raw.length === 0) break;
  }

  if (lastIndex < text.length) {
    segments.push({ type: "text", value: text.slice(lastIndex) });
  }

  if (segments.length === 0) {
    return [{ type: "text", value: text }];
  }

  return segments;
}
