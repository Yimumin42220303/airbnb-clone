import { prisma } from "@/lib/prisma";

/** URL용 slug 생성 (영문·숫자·하이픈) */
export function generateSlug(title: string): string {
  return title
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9가-힣-]/g, "")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "") || "post";
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
};

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
  };
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

export type CreatePostInput = {
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
    },
  });
}

export type UpdatePostInput = Partial<{
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
