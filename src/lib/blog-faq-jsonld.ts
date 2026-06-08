/**
 * 블로그 본문의 FAQ 섹션(### Q. ...)을 파싱해 FAQPage JSON-LD용 Q/A 추출.
 * 화면(BlogBody)과 동일한 본문 소스에서 읽어 내용 불일치를 줄입니다.
 */

export type BlogFaqItem = { q: string; a: string };

/** JSON-LD용: 마크다운·이미지 토큰을 평문으로 단순화 */
function faqAnswerToPlainText(raw: string): string {
  return raw
    .replace(/\[IMG:[^\]]+\]/g, "")
    .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
    .replace(/\*\*([^*]+)\*\*/g, "$1")
    .replace(/\*([^*]+)\*/g, "$1")
    .replace(/\r\n/g, "\n")
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean)
    .join(" ")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * "## 자주 묻는 질문" 이후 ### Q. 질문? 블록을 추출합니다.
 */
export function extractBlogFaqFromBody(body: string): BlogFaqItem[] {
  const normalized = body.replace(/\r\n/g, "\n");
  const faqStart = normalized.search(/##\s*자주\s*묻는\s*질문/i);
  if (faqStart < 0) return [];

  const section = normalized.slice(faqStart);
  const afterTitle = section.indexOf("\n");
  const rest = afterTitle >= 0 ? section.slice(afterTitle + 1) : "";
  const nextH2 = rest.search(/\n##\s+[^#\s]/);
  const faqBlock =
    nextH2 >= 0 ? section.slice(0, afterTitle + 1 + nextH2) : section;

  const items: BlogFaqItem[] = [];
  const re = /###\s*Q\.\s*(.+?)\n([\s\S]*?)(?=\n###\s*Q\.|\n##\s|$)/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(faqBlock)) !== null) {
    const q = m[1].trim();
    const a = faqAnswerToPlainText(m[2]);
    if (q && a) items.push({ q, a });
  }
  return items;
}

export function buildBlogFaqJsonLd(
  faq: BlogFaqItem[],
  pageUrl: string
): Record<string, unknown> | null {
  if (faq.length === 0) return null;
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntityOfPage: { "@type": "WebPage", "@id": pageUrl },
    mainEntity: faq.map((item) => ({
      "@type": "Question",
      name: item.q,
      acceptedAnswer: {
        "@type": "Answer",
        text: item.a,
      },
    })),
  };
}
