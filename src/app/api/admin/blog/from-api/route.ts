/**
 * ChatGPT Custom GPT 등 외부 도구에서 API 키로 블로그 글을 등록하는 엔드포인트.
 * 세션 기반 관리자 API(/api/admin/blog)와 별도로, x-api-key 헤더로만 인증합니다.
 */
import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { createPost } from "@/lib/blog";
import { isValidCategory } from "@/lib/blog-categories";
import { BASE_URL } from "@/lib/site-url";

const API_KEY = process.env.BLOG_AUTO_PUBLISH_API_KEY;
const AUTHOR_USER_ID = process.env.BLOG_AUTHOR_USER_ID;

function getApiKey(req: Request): string | null {
  const header = req.headers.get("x-api-key");
  if (header) return header.trim();
  const auth = req.headers.get("authorization");
  if (auth?.toLowerCase().startsWith("bearer ")) return auth.slice(7).trim();
  return null;
}

export async function POST(req: Request) {
  if (!API_KEY || API_KEY.length < 16) {
    return NextResponse.json(
      { error: "서버에 BLOG_AUTO_PUBLISH_API_KEY가 설정되지 않았습니다." },
      { status: 500 }
    );
  }

  const key = getApiKey(req);
  if (!key || key !== API_KEY) {
    return NextResponse.json(
      { error: "유효하지 않은 API 키입니다." },
      { status: 401 }
    );
  }

  let authorId: string;
  if (AUTHOR_USER_ID?.trim()) {
    const user = await prisma.user.findUnique({
      where: { id: AUTHOR_USER_ID.trim() },
      select: { id: true, role: true },
    });
    if (!user || user.role !== "admin") {
      return NextResponse.json(
        { error: "BLOG_AUTHOR_USER_ID에 해당하는 관리자 계정이 없습니다." },
        { status: 500 }
      );
    }
    authorId = user.id;
  } else {
    const admin = await prisma.user.findFirst({
      where: { role: "admin" },
      select: { id: true },
      orderBy: { createdAt: "asc" },
    });
    if (!admin) {
      return NextResponse.json(
        { error: "관리자 계정이 없어 글을 등록할 수 없습니다. BLOG_AUTHOR_USER_ID를 설정하세요." },
        { status: 500 }
      );
    }
    authorId = admin.id;
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json(
      { error: "잘못된 요청 본문입니다. JSON을 보내 주세요." },
      { status: 400 }
    );
  }

  const raw = body as Record<string, unknown>;
  const title = typeof raw.title === "string" ? raw.title.trim() : "";
  const content = typeof raw.body === "string" ? raw.body.trim() : "";
  if (!title || !content) {
    return NextResponse.json(
      { error: "title과 body(본문)는 필수입니다." },
      { status: 400 }
    );
  }

  const slug = typeof raw.slug === "string" ? raw.slug.trim() : undefined;
  const excerpt = typeof raw.excerpt === "string" ? raw.excerpt.trim() : null;
  const coverImage =
    typeof raw.coverImage === "string" && raw.coverImage.trim()
      ? raw.coverImage.trim()
      : null;
  const category =
    typeof raw.category === "string" && isValidCategory(raw.category.trim())
      ? raw.category.trim()
      : null;

  // published === true 이면 지금 시각으로 공개, false/미지정이면 초안
  const published = raw.published === true;
  const publishedAt = published ? new Date().toISOString() : null;

  try {
    const post = await createPost(authorId, {
      title,
      slug,
      excerpt: excerpt || null,
      body: content,
      coverImage: coverImage?.startsWith("http") || coverImage?.startsWith("/") ? coverImage : null,
      category,
      publishedAt,
    });
    revalidatePath("/blog");
    revalidatePath(`/blog/${encodeURIComponent(post.slug)}`);
    const url = `${BASE_URL}/blog/${encodeURIComponent(post.slug)}`;
    return NextResponse.json({
      ok: true,
      id: post.id,
      slug: post.slug,
      url,
      published: !!post.publishedAt,
    });
  } catch (e) {
    console.error("Blog from-api create error:", e);
    return NextResponse.json(
      { error: "글 저장에 실패했습니다." },
      { status: 500 }
    );
  }
}
