import { prisma } from "@/lib/prisma";
import { BASE_URL } from "@/lib/site-url";
import { slugify } from "@/lib/blog-post-fields";

const IMG_TOKEN_RE = /\[IMG:([^\]]+)\]/;

/** slug별 SEO 메타 override (DB excerpt와 별도) */
export type BlogSeoOverride = {
  /** document title (absolute) */
  title?: string;
  description?: string;
  ogTitle?: string;
  ogDescription?: string;
  coverAlt?: string;
};

const BLOG_SEO_OVERRIDES: Record<string, BlogSeoOverride> = {
  "shinjuku-family-accommodation-guide": {
    title: "신주쿠 숙소 추천｜가족여행 인원별 숙소 고르는 법 | 도쿄민박",
    description:
      "도쿄 가족여행에서 신주쿠 숙소를 고민 중이라면? 2~3인 소가족부터 4~8인 대가족까지 인원별 추천 숙소와 침대 구성, 역 접근성, 엘리베이터, 세탁기·주방 체크포인트를 정리했습니다.",
    ogTitle: "신주쿠 숙소 추천｜가족여행 인원별 숙소 고르는 법 | 도쿄민박",
    ogDescription:
      "도쿄 가족여행에서 신주쿠 숙소를 고민 중이라면 인원별 추천 숙소와 예약 전 체크포인트를 확인해보세요.",
    coverAlt: "신주쿠 가족여행 숙소 추천 대표 이미지",
  },
  "what-is-tokyominbak": {
    description:
      "도쿄민박은 한국인을 위한 도쿄 현지 숙소 예약 플랫폼입니다. 예약 전 문의, 체크인 안내, 숙박 중 문제 접수, 환불·민원 접수까지 한국어로 안내하며, 도쿄 여행자가 더 안심하고 숙소를 선택할 수 있도록 돕습니다.",
    ogTitle: "도쿄민박이란? 한국인을 위한 도쿄 현지 숙소 예약 플랫폼",
    ogDescription:
      "예약 전 문의부터 체크인 안내, 숙박 중 문제 접수, 환불·민원 접수까지 한국어로 안내하는 도쿄 숙소 예약 플랫폼을 소개합니다.",
  },
  "tokyo-minbak-vs-hotel": {
    title: "도쿄 민박 vs 호텔 비교｜가족·친구 여행 숙소 선택 가이드 | 도쿄민박",
    description:
      "도쿄 여행 숙소를 호텔로 할지 민박으로 할지 고민된다면? 인원·일정·예산·여행 스타일별로 민박과 호텔의 장단점을 비교하고 후회 없는 도쿄 숙소 선택 기준을 정리했습니다.",
    ogTitle: "도쿄 민박 vs 호텔 비교｜가족·친구 여행 숙소 선택 가이드",
    ogDescription:
      "인원·일정·예산·여행 스타일별로 도쿄 민박과 호텔의 장단점을 비교하고 숙소 선택 기준을 정리했습니다.",
  },
  "tokyo-travel-luggage-tips": {
    title: "도쿄 여행 짐 보관 꿀팁｜공항 택배·코인락커·빈손 여행 | 도쿄민박",
    description:
      "도쿄 여행 캐리어 고민 끝! 공항 택배(탁큐빈), 코인락커 실시간 확인, 숙소 짐 맡기기까지 도쿄 빈손 여행 실전 꿀팁과 짐 동선이 편한 숙소 선택법을 정리했습니다.",
    ogTitle: "도쿄 여행 짐 보관 꿀팁｜공항 택배·코인락커·빈손 여행",
    ogDescription:
      "공항 택배, 코인락커 실시간 확인, 숙소 짐 맡기기까지 도쿄 빈손 여행 실전 꿀팁을 정리했습니다.",
  },
  "shibuya-ku-area-guide": {
    title: "시부야구 숙소 가이드｜지역별 특징과 숙소 선택 기준 | 도쿄민박",
    ogTitle: "시부야구 숙소 가이드｜지역별 특징과 숙소 선택 기준",
  },
};

export function getBlogSeoOverride(slug: string): BlogSeoOverride | null {
  return BLOG_SEO_OVERRIDES[slug] ?? null;
}

/** 글 주제별 하단 CTA 문구 (article 밖, 전환 동선). 미정의 시 기본값 사용 */
export type BlogCtaConfig = {
  recommendTitle?: string;
  recommendBody?: string;
  recommendButton?: string;
  secondaryHeading?: string;
  secondaryBody?: string;
  searchLabel?: string;
  trustLabel?: string;
};

const BLOG_CTA_CONFIG: Record<string, BlogCtaConfig> = {
  "shibuya-ku-area-guide": {
    recommendButton: "시부야구 여행 동선에 맞는 숙소 추천받기",
    secondaryHeading: "시부야·하츠다이 근처 숙소를 찾고 있다면",
    searchLabel: "시부야·하츠다이 근처 숙소 보기",
  },
  "shinjuku-family-accommodation-guide": {
    recommendButton: "4인 이상 가족 숙소 추천받기",
    secondaryHeading: "신주쿠 근처 넓은 숙소를 찾고 있다면",
    searchLabel: "신주쿠 근처 넓은 숙소 보기",
  },
  "tokyo-minbak-vs-hotel": {
    recommendButton: "가족·친구 여행에 맞는 숙소 찾기",
    secondaryHeading: "호텔보다 넓은 도쿄 숙소가 궁금하다면",
    searchLabel: "호텔보다 넓은 도쿄 숙소 비교하기",
  },
  "what-is-tokyominbak": {
    recommendButton: "내 조건에 맞는 도쿄 숙소 추천받기",
    secondaryHeading: "처음 이용한다면 먼저 확인해보세요",
    searchLabel: "도쿄민박 등록 숙소 둘러보기",
    trustLabel: "처음 이용 전 안심예약센터 보기",
  },
  "tokyo-travel-luggage-tips": {
    recommendButton: "짐 옮기기 편한 숙소 추천받기",
    secondaryHeading: "역에서 가까운 도쿄 숙소를 찾고 있다면",
    searchLabel: "역에서 가까운 도쿄 숙소 보기",
  },
};

export function getBlogCtaConfig(slug: string): BlogCtaConfig {
  return BLOG_CTA_CONFIG[slug] ?? {};
}

/** ogImage → coverImage → 본문 첫 [IMG:…] → 기본 OG 순 */
export function resolveBlogOgImage(
  coverImage: string | null | undefined,
  body: string,
  ogImage?: string | null | undefined
): string {
  const og = ogImage?.trim();
  if (og && (og.startsWith("http://") || og.startsWith("https://") || og.startsWith("/")) && !og.includes("|") && !/\s/.test(og)) {
    return og.startsWith("/") ? `${BASE_URL}${og}` : og;
  }
  if (coverImage?.trim()) return coverImage.trim();
  const m = body.match(IMG_TOKEN_RE);
  const raw = m?.[1]?.trim();
  if (raw) {
    const urlPart = raw.split("|")[0]?.trim() ?? "";
    if (
      urlPart &&
      (urlPart.startsWith("https://") ||
        urlPart.startsWith("http://") ||
        urlPart.startsWith("/"))
    ) {
      return urlPart.startsWith("/") ? `${BASE_URL}${urlPart}` : urlPart;
    }
  }
  return `${BASE_URL}/og-image.png`;
}

/** URL용 slug 생성 (영문·숫자·하이픈) */
export function generateSlug(title: string): string {
  return slugify(title);
}

/** 고유 slug 확보 (기존과 겹치면 숫자 붙임) */
export async function ensureUniqueSlug(baseSlug: string, excludeId?: string): Promise<string> {
  let slug = baseSlug;
  let n = 0;
  while (true) {
    const existing = await prisma.post.findFirst({
      where: {
        slug,
        ...(excludeId ? { id: { not: excludeId } } : {}),
      },
    });
    if (!existing) return slug;
    n += 1;
    slug = `${baseSlug}-${n}`;
  }
}

export type PostListItem = {
  id: string;
  title: string;
  slug: string;
  excerpt: string | null;
  coverImage: string | null;
  category: string | null;
  publishedAt: Date | null;
  createdAt: Date;
  authorName: string | null;
};

/** 목록 조회 (공개용: publishedAt이 있는 것만, 관리자: 전체) */
export async function getPosts(options?: { publishedOnly?: boolean }): Promise<PostListItem[]> {
  const publishedOnly = options?.publishedOnly !== false;
  const list = await prisma.post.findMany({
    where: publishedOnly ? { publishedAt: { not: null } } : undefined,
    orderBy: { publishedAt: "desc" },
    include: { author: { select: { name: true } } },
  });
  return list.map(toPostListItem);
}

/** Prisma Post → PostListItem 매핑 */
function toPostListItem(p: {
  id: string;
  title: string;
  slug: string;
  excerpt: string | null;
  coverImage: string | null;
  category: string | null;
  publishedAt: Date | null;
  createdAt: Date;
  author: { name: string | null };
}): PostListItem {
  return {
    id: p.id,
    title: p.title,
    slug: p.slug,
    excerpt: p.excerpt,
    coverImage: p.coverImage,
    category: p.category,
    publishedAt: p.publishedAt,
    createdAt: p.createdAt,
    authorName: p.author.name,
  };
}

/** 페이지네이션 목록 조회 (공개 글). page는 1부터, category로 필터 가능 */
export async function getPostsPaginated(options?: {
  page?: number;
  pageSize?: number;
  category?: string | null;
}): Promise<{ posts: PostListItem[]; total: number; page: number; pageSize: number; totalPages: number }> {
  const pageSize = Math.max(1, options?.pageSize ?? 10);
  const page = Math.max(1, options?.page ?? 1);

  const where = {
    publishedAt: { not: null },
    ...(options?.category ? { category: options.category } : {}),
  };

  const [total, list] = await Promise.all([
    prisma.post.count({ where }),
    prisma.post.findMany({
      where,
      orderBy: { publishedAt: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
      include: { author: { select: { name: true } } },
    }),
  ]);

  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  return { posts: list.map(toPostListItem), total, page, pageSize, totalPages };
}

export type PostDetail = PostListItem & {
  body: string;
  updatedAt: Date;
  seoTitle: string | null;
  metaDescription: string | null;
  focusKeyword: string | null;
  secondaryKeywords: string | null;
  coverImageAlt: string | null;
  coverImageCaption: string | null;
  ogImage: string | null;
  postType: string | null;
  primaryCtaLabel: string | null;
  primaryCtaUrl: string | null;
  secondaryCtaLabel: string | null;
  secondaryCtaUrl: string | null;
  relatedPostSlugs: string | null;
  relatedListingIds: string | null;
  noindex: boolean;
};

/** sitemap.xml용 공개 글 slug·날짜 (읽기 전용, draft 제외) */
export async function getPostsForSitemap(): Promise<
  { slug: string; publishedAt: Date | null; createdAt: Date; updatedAt: Date }[]
> {
  return prisma.post.findMany({
    where: { publishedAt: { not: null }, noindex: false },
    orderBy: { publishedAt: "desc" },
    select: { slug: true, publishedAt: true, createdAt: true, updatedAt: true },
  });
}

/** RSS 피드용 공개 글 조회 (본문 포함, 최신순, 읽기 전용) */
export async function getPostsForFeed(limit = 30): Promise<
  {
    title: string;
    slug: string;
    excerpt: string | null;
    metaDescription: string | null;
    body: string;
    category: string | null;
    publishedAt: Date | null;
    createdAt: Date;
    updatedAt: Date;
  }[]
> {
  const take = Math.min(Math.max(1, limit), 30);
  const rows = await prisma.post.findMany({
    where: { publishedAt: { not: null }, noindex: false },
    orderBy: { publishedAt: "desc" },
    take,
    select: {
      title: true,
      slug: true,
      excerpt: true,
      metaDescription: true,
      body: true,
      category: true,
      publishedAt: true,
      createdAt: true,
      updatedAt: true,
    },
  });
  return rows;
}

/** slug로 단일 글 조회 (공개: publishedAt 필수) */
export async function getPostBySlug(
  slug: string,
  options?: { allowDraft?: boolean }
): Promise<PostDetail | null> {
  const post = await prisma.post.findUnique({
    where: { slug },
    include: { author: { select: { name: true } } },
  });
  if (!post) return null;
  if (!options?.allowDraft && !post.publishedAt) return null;
  return {
    id: post.id,
    title: post.title,
    slug: post.slug,
    excerpt: post.excerpt,
    coverImage: post.coverImage,
    category: post.category,
    publishedAt: post.publishedAt,
    createdAt: post.createdAt,
    updatedAt: post.updatedAt,
    authorName: post.author.name,
    body: post.body,
    seoTitle: post.seoTitle ?? null,
    metaDescription: post.metaDescription ?? null,
    focusKeyword: post.focusKeyword ?? null,
    secondaryKeywords: post.secondaryKeywords ?? null,
    coverImageAlt: post.coverImageAlt ?? null,
    coverImageCaption: post.coverImageCaption ?? null,
    ogImage: post.ogImage ?? null,
    postType: post.postType ?? null,
    primaryCtaLabel: post.primaryCtaLabel ?? null,
    primaryCtaUrl: post.primaryCtaUrl ?? null,
    secondaryCtaLabel: post.secondaryCtaLabel ?? null,
    secondaryCtaUrl: post.secondaryCtaUrl ?? null,
    relatedPostSlugs: post.relatedPostSlugs ?? null,
    relatedListingIds: post.relatedListingIds ?? null,
    noindex: post.noindex ?? false,
  };
}

/** slug 목록으로 공개 글 조회 (관리자가 지정한 관련글 우선 노출용, 순서 보존) */
export async function getPostsBySlugs(
  slugs: string[],
  excludeId?: string
): Promise<PostListItem[]> {
  const cleaned = Array.from(new Set(slugs.map((s) => s.trim()).filter(Boolean)));
  if (cleaned.length === 0) return [];
  const rows = await prisma.post.findMany({
    where: {
      slug: { in: cleaned },
      publishedAt: { not: null },
      ...(excludeId ? { id: { not: excludeId } } : {}),
    },
    include: { author: { select: { name: true } } },
  });
  const bySlug = new Map(rows.map((p) => [p.slug, toPostListItem(p)]));
  return cleaned.map((s) => bySlug.get(s)).filter((p): p is PostListItem => !!p);
}

/**
 * 관련 글 조회 (현재 글 제외, 최신 공개 글 중 limit개).
 * 같은 category 글을 우선 채우고, 부족하면 최신 글로 보충.
 */
export async function getRelatedPosts(
  currentId: string,
  limit = 3,
  category?: string | null
): Promise<PostListItem[]> {
  const collected: PostListItem[] = [];
  const seen = new Set<string>([currentId]);

  if (category) {
    const sameCat = await prisma.post.findMany({
      where: { publishedAt: { not: null }, id: { not: currentId }, category },
      orderBy: { publishedAt: "desc" },
      take: limit,
      include: { author: { select: { name: true } } },
    });
    for (const p of sameCat) {
      collected.push(toPostListItem(p));
      seen.add(p.id);
    }
  }

  if (collected.length < limit) {
    const fill = await prisma.post.findMany({
      where: { publishedAt: { not: null }, id: { notIn: Array.from(seen) } },
      orderBy: { publishedAt: "desc" },
      take: limit - collected.length,
      include: { author: { select: { name: true } } },
    });
    for (const p of fill) collected.push(toPostListItem(p));
  }

  return collected.slice(0, limit);
}

/** 동일 제목(공백·대소문자 무시) 공개/초안 글이 이미 있는지 */
export async function postTitleExists(title: string): Promise<boolean> {
  const trimmed = title.trim();
  if (!trimmed) return false;
  const found = await prisma.post.findFirst({
    where: { title: { equals: trimmed, mode: "insensitive" } },
    select: { id: true },
  });
  return !!found;
}

/** 최근 글 제목 목록 (자동 생성 시 중복 회피용 컨텍스트) */
export async function getRecentPostTitles(limit = 30): Promise<string[]> {
  const list = await prisma.post.findMany({
    orderBy: { createdAt: "desc" },
    take: limit,
    select: { title: true },
  });
  return list.map((p) => p.title);
}

/** ID로 단일 글 조회 (관리자 수정용) */
export async function getPostById(id: string) {
  return prisma.post.findUnique({
    where: { id },
    include: { author: { select: { name: true } } },
  });
}

/** 신규 SEO/전환 필드 (create·update 공용). 모두 optional. */
export type BlogMetaInput = Partial<{
  seoTitle: string | null;
  metaDescription: string | null;
  focusKeyword: string | null;
  secondaryKeywords: string | null;
  coverImageAlt: string | null;
  coverImageCaption: string | null;
  ogImage: string | null;
  postType: string | null;
  primaryCtaLabel: string | null;
  primaryCtaUrl: string | null;
  secondaryCtaLabel: string | null;
  secondaryCtaUrl: string | null;
  relatedPostSlugs: string | null;
  relatedListingIds: string | null;
  noindex: boolean;
}>;

const META_STRING_FIELDS = [
  "seoTitle",
  "metaDescription",
  "focusKeyword",
  "secondaryKeywords",
  "coverImageAlt",
  "coverImageCaption",
  "ogImage",
  "postType",
  "primaryCtaLabel",
  "primaryCtaUrl",
  "secondaryCtaLabel",
  "secondaryCtaUrl",
  "relatedPostSlugs",
  "relatedListingIds",
] as const;

/** create 용: 입력된 메타 필드를 정리해 prisma data 로 변환 */
function buildMetaCreateData(input: BlogMetaInput): Record<string, unknown> {
  const data: Record<string, unknown> = {};
  for (const key of META_STRING_FIELDS) {
    const v = input[key];
    if (v !== undefined) data[key] = typeof v === "string" ? v.trim() || null : null;
  }
  if (input.noindex !== undefined) data.noindex = !!input.noindex;
  return data;
}

export type CreatePostInput = BlogMetaInput & {
  title: string;
  slug?: string;
  excerpt?: string | null;
  body: string;
  coverImage?: string | null;
  category?: string | null;
  publishedAt?: string | null; // ISO date string or null = draft
};

export async function createPost(authorId: string, input: CreatePostInput) {
  const slug = await ensureUniqueSlug(
    input.slug?.trim() || generateSlug(input.title)
  );
  const publishedAt = input.publishedAt
    ? new Date(input.publishedAt)
    : null;
  return prisma.post.create({
    data: {
      authorId,
      title: input.title.trim(),
      slug,
      excerpt: input.excerpt?.trim() || null,
      body: input.body,
      coverImage: input.coverImage?.trim() || null,
      category: input.category?.trim() || null,
      publishedAt,
      ...buildMetaCreateData(input),
    },
  });
}

export type UpdatePostInput = BlogMetaInput & Partial<{
  title: string;
  slug: string;
  excerpt: string | null;
  body: string;
  coverImage: string | null;
  category: string | null;
  publishedAt: string | null;
}>;

export async function updatePost(
  id: string,
  input: UpdatePostInput,
  options?: { authorId?: string }
) {
  const existing = await prisma.post.findUnique({ where: { id } });
  if (!existing) return null;
  if (options?.authorId && existing.authorId !== options.authorId) return null;

  let slug = existing.slug;
  if (input.slug !== undefined && input.slug.trim() !== existing.slug) {
    slug = await ensureUniqueSlug(input.slug.trim(), id);
  } else if (input.title !== undefined && input.title.trim() !== existing.title) {
    slug = await ensureUniqueSlug(generateSlug(input.title), id);
  }

  const publishedAt =
    input.publishedAt !== undefined
      ? input.publishedAt ? new Date(input.publishedAt) : null
      : existing.publishedAt;

  const metaData: Record<string, unknown> = {};
  for (const key of META_STRING_FIELDS) {
    const v = input[key];
    if (v !== undefined) metaData[key] = typeof v === "string" ? v.trim() || null : null;
  }
  if (input.noindex !== undefined) metaData.noindex = !!input.noindex;

  return prisma.post.update({
    where: { id },
    data: {
      ...(input.title !== undefined && { title: input.title.trim() }),
      slug,
      ...(input.excerpt !== undefined && { excerpt: input.excerpt?.trim() || null }),
      ...(input.body !== undefined && { body: input.body }),
      ...(input.coverImage !== undefined && { coverImage: input.coverImage?.trim() || null }),
      ...(input.category !== undefined && { category: input.category?.trim() || null }),
      publishedAt,
      ...metaData,
    },
  });
}

export async function deletePost(id: string, options?: { authorId?: string }) {
  const existing = await prisma.post.findUnique({ where: { id } });
  if (!existing) return false;
  if (options?.authorId && existing.authorId !== options.authorId) return false;
  await prisma.post.delete({ where: { id } });
  return true;
}
