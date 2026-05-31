import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { getAdminUser } from "@/lib/admin";
import { updatePost, deletePost, getPostById } from "@/lib/blog";
import { isValidCategory } from "@/lib/blog-categories";
import { checkBlogPost } from "@/lib/blog-validation";
import { extractBlogMetaInput, type BlogPayload } from "@/lib/blog-api-helpers";

type RouteParams = { params: Promise<{ id: string }> };

export async function PATCH(req: Request, { params }: RouteParams) {
  const admin = await getAdminUser();
  if (!admin) {
    return NextResponse.json(
      { error: "관리자만 수정할 수 있습니다." },
      { status: 403 }
    );
  }

  const resolved = await params;
  const id = resolved?.id ?? "";
  if (!id) {
    return NextResponse.json({ error: "id가 필요합니다." }, { status: 400 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json(
      { error: "잘못된 요청 본문입니다." },
      { status: 400 }
    );
  }

  const payload = body as BlogPayload;
  const { title, slug, excerpt, body: content, coverImage, category, publishedAt } = payload;

  const input: Record<string, unknown> = {};
  if (title !== undefined) input.title = typeof title === "string" ? title : "";
  if (slug !== undefined) input.slug = typeof slug === "string" ? slug : "";
  if (excerpt !== undefined)
    input.excerpt = typeof excerpt === "string" ? excerpt : null;
  if (content !== undefined) input.body = typeof content === "string" ? content : "";
  if (coverImage !== undefined)
    input.coverImage =
      typeof coverImage === "string" && coverImage.trim() ? coverImage : null;
  if (category !== undefined)
    input.category =
      typeof category === "string" && isValidCategory(category.trim())
        ? category.trim()
        : null;
  if (publishedAt !== undefined)
    input.publishedAt =
      publishedAt === null || publishedAt === undefined
        ? null
        : typeof publishedAt === "string"
          ? publishedAt
          : null;

  const meta = extractBlogMetaInput(payload);
  Object.assign(input, meta);

  const willPublish = publishedAt !== null && publishedAt !== undefined;
  if (willPublish) {
    const check = checkBlogPost({
      title: typeof title === "string" ? title : "",
      slug: typeof slug === "string" ? slug : "",
      category: typeof category === "string" ? category : null,
      body: typeof content === "string" ? content : "",
      excerpt: typeof excerpt === "string" ? excerpt : null,
      seoTitle: meta.seoTitle ?? null,
      metaDescription: meta.metaDescription ?? null,
      coverImage: typeof coverImage === "string" ? coverImage : null,
      coverImageAlt: meta.coverImageAlt ?? null,
      ogImage: meta.ogImage ?? null,
      primaryCtaUrl: meta.primaryCtaUrl ?? null,
      secondaryCtaUrl: meta.secondaryCtaUrl ?? null,
      relatedPostSlugs: meta.relatedPostSlugs ?? null,
      noindex: meta.noindex ?? false,
      published: true,
    });
    if (!check.canPublish) {
      return NextResponse.json(
        { error: `게시할 수 없습니다: ${check.errors[0]?.label ?? "검사 실패"}`, errors: check.errors },
        { status: 422 }
      );
    }
  }

  try {
    const updated = await updatePost(id, input as Parameters<typeof updatePost>[1], {
      authorId: admin.id,
    });
    if (!updated) {
      return NextResponse.json({ error: "글을 찾을 수 없습니다." }, { status: 404 });
    }
    revalidatePath(`/blog/${updated.slug}`);
    revalidatePath("/blog");
    revalidatePath("/sitemap.xml");
    revalidatePath("/rss.xml");
    return NextResponse.json({ id: updated.id, slug: updated.slug });
  } catch (e) {
    console.error("Blog update error:", e);
    return NextResponse.json(
      { error: "수정에 실패했습니다." },
      { status: 500 }
    );
  }
}

export async function DELETE(_req: Request, { params }: RouteParams) {
  const admin = await getAdminUser();
  if (!admin) {
    return NextResponse.json(
      { error: "관리자만 삭제할 수 있습니다." },
      { status: 403 }
    );
  }

  const resolved = await params;
  const id = resolved?.id ?? "";
  if (!id) {
    return NextResponse.json({ error: "id가 필요합니다." }, { status: 400 });
  }

  const ok = await deletePost(id, { authorId: admin.id });
  if (!ok) {
    return NextResponse.json({ error: "글을 찾을 수 없습니다." }, { status: 404 });
  }
  revalidatePath("/blog");
  return NextResponse.json({ ok: true });
}

export async function GET(_req: Request, { params }: RouteParams) {
  const admin = await getAdminUser();
  if (!admin) {
    return NextResponse.json({ error: "권한이 없습니다." }, { status: 403 });
  }

  const resolved = await params;
  const id = resolved?.id ?? "";
  const post = await getPostById(id);
  if (!post) {
    return NextResponse.json({ error: "글을 찾을 수 없습니다." }, { status: 404 });
  }
  return NextResponse.json({
    id: post.id,
    title: post.title,
    slug: post.slug,
    excerpt: post.excerpt,
    body: post.body,
    coverImage: post.coverImage,
    category: post.category,
    publishedAt: post.publishedAt?.toISOString() ?? null,
    createdAt: post.createdAt.toISOString(),
    updatedAt: post.updatedAt.toISOString(),
    authorName: post.author?.name ?? null,
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
  });
}
