/**
 * sitemap.xml 정적 페이지 lastmod.
 * 페이지 콘텐츠를 의미 있게 수정할 때만 날짜를 갱신한다 (매 요청 new Date() 사용 금지).
 */
export const SITEMAP_STATIC_LASTMOD: Record<
  | "/"
  | "/search"
  | "/about"
  | "/trust"
  | "/policy"
  | "/agreement"
  | "/recommend"
  | "/blog"
  | "/lp/host",
  string
> = {
  "/": "2026-05-30",
  "/search": "2026-05-30",
  "/about": "2026-05-30",
  "/trust": "2026-05-30",
  "/policy": "2026-05-30",
  "/agreement": "2026-05-30",
  "/recommend": "2026-05-30",
  "/blog": "2026-05-30",
  "/lp/host": "2026-05-30",
};

export function staticLastModified(path: keyof typeof SITEMAP_STATIC_LASTMOD): Date {
  return new Date(SITEMAP_STATIC_LASTMOD[path]);
}

/** 블로그·숙소 등 동적 URL의 lastmod (updatedAt 우선) */
export function resolveContentLastModified(dates: {
  updatedAt?: Date | null;
  publishedAt?: Date | null;
  createdAt?: Date | null;
}): Date {
  return dates.updatedAt ?? dates.publishedAt ?? dates.createdAt ?? new Date("2026-01-01");
}
