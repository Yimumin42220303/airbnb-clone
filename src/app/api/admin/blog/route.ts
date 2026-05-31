import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { getAdminUser } from "@/lib/admin";
import { createPost } from "@/lib/blog";
import { isValidCategory } from "@/lib/blog-categories";
import { checkBlogPost } from "@/lib/blog-validation";
import { extractBlogMetaInput, type BlogPayload } from "@/lib/blog-api-helpers";

export async function POST(req: Request) {
  const admin = await getAdminUser();
  if (!admin) {
    return NextResponse.json(
      { error: "관리자만 블로그 글을 작성할 수 있습니다." },
      { status: 403 }
    );
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "잘못된 요청 본문입니다." }, { status: 400 });
  }

  const payload = body as BlogPayload;
  const { title, slug, excerpt, body: content, coverImage, category, publishedAt } = payload;

  if (typeof title !== "string" || !title.trim()) {
    return NextResponse.json({ error: "제목을 입력해 주세요." }, { status: 400 });
  }
  if (typeof content !== "string" || !content.trim()) {
    return NextResponse.json({ error: "본문을 입력해 주세요." }, { status: 400 });
  }

  const meta = extractBlogMetaInput(payload);
  const published = publishedAt !== null && publishedAt !== undefined;

  // 게시 상태로 전환 시 엄격 검증 (초안은 통과)
  if (published) {
    const check = checkBlogPost({
      title,
      slug: typeof slug === "string" ? slug : "",
      category: typeof category === "string" ? category : null,
      body: content,
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
    const post = await createPost(admin.id, {
      title: title.trim(),
      slug: typeof slug === "string" ? slug.trim() : undefined,
      excerpt: typeof excerpt === "string" ? excerpt.trim() : null,
      body: content.trim(),
      coverImage:
        typeof coverImage === "string" && coverImage.trim() ? coverImage.trim() : null,
      category:
        typeof category === "string" && isValidCategory(category.trim())
          ? category.trim()
          : null,
      publishedAt: published ? (publishedAt as string) : null,
      ...meta,
    });
    revalidatePath("/blog");
    revalidatePath("/sitemap.xml");
    revalidatePath("/rss.xml");
    return NextResponse.json({ id: post.id, slug: post.slug });
  } catch (e) {
    console.error("Blog create error:", e);
    return NextResponse.json({ error: "글 저장에 실패했습니다." }, { status: 500 });
  }
}
