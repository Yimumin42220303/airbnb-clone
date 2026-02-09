import { NextResponse } from "next/server";
import { getAdminUser } from "@/lib/admin";
import { updatePost, deletePost, getPostById } from "@/lib/blog";

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

  const {
    title,
    slug,
    excerpt,
    body: content,
    coverImage,
    publishedAt,
  } = body as Record<string, unknown>;

  const input: Record<string, unknown> = {};
  if (title !== undefined) input.title = typeof title === "string" ? title : "";
  if (slug !== undefined) input.slug = typeof slug === "string" ? slug : "";
  if (excerpt !== undefined)
    input.excerpt = typeof excerpt === "string" ? excerpt : null;
  if (content !== undefined) input.body = typeof content === "string" ? content : "";
  if (coverImage !== undefined)
    input.coverImage =
      typeof coverImage === "string" && coverImage.trim() ? coverImage : null;
  if (publishedAt !== undefined)
    input.publishedAt =
      publishedAt === null || publishedAt === undefined
        ? null
        : typeof publishedAt === "string"
          ? publishedAt
          : null;

  try {
    const updated = await updatePost(id, input as Parameters<typeof updatePost>[1], {
      authorId: admin.id,
    });
    if (!updated) {
      return NextResponse.json({ error: "글을 찾을 수 없습니다." }, { status: 404 });
    }
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
    publishedAt: post.publishedAt?.toISOString() ?? null,
    createdAt: post.createdAt.toISOString(),
    updatedAt: post.updatedAt.toISOString(),
    authorName: post.author?.name ?? null,
  });
}
