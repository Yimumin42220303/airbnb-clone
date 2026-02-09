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
  return list.map((p) => ({
    id: p.id,
    title: p.title,
    slug: p.slug,
    excerpt: p.excerpt,
    coverImage: p.coverImage,
    publishedAt: p.publishedAt,
    createdAt: p.createdAt,
    authorName: p.author.name,
  }));
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
    publishedAt: post.publishedAt,
    createdAt: post.createdAt,
    updatedAt: post.updatedAt,
    authorName: post.author.name,
    body: post.body,
  };
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
