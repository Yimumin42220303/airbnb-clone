import { NextResponse } from "next/server";
import { getAdminUser } from "@/lib/admin";
import { createPost } from "@/lib/blog";

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
    return NextResponse.json(
      { error: "잘못된 요청 본문입니다." },
      { status: 400 }
    );
  }

  const {
    title,
    slug,
    excerpt,
    body: content,
    coverImage,
    publishedAt,
  } = body as Record<string, unknown>;

  if (typeof title !== "string" || !title.trim()) {
    return NextResponse.json(
      { error: "제목을 입력해 주세요." },
      { status: 400 }
    );
  }
  if (typeof content !== "string" || !content.trim()) {
    return NextResponse.json(
      { error: "본문을 입력해 주세요." },
      { status: 400 }
    );
  }

  try {
    const post = await createPost(admin.id, {
      title: title.trim(),
      slug: typeof slug === "string" ? slug.trim() : undefined,
      excerpt: typeof excerpt === "string" ? excerpt.trim() : null,
      body: content.trim(),
      coverImage:
        typeof coverImage === "string" && coverImage.trim()
          ? coverImage.trim()
          : null,
      publishedAt:
        publishedAt === null || publishedAt === undefined
          ? null
          : typeof publishedAt === "string"
            ? publishedAt
            : undefined,
    });
    return NextResponse.json({ id: post.id, slug: post.slug });
  } catch (e) {
    console.error("Blog create error:", e);
    return NextResponse.json(
      { error: "글 저장에 실패했습니다." },
      { status: 500 }
    );
  }
}
