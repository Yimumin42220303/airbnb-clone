import { NextResponse } from "next/server";
import { getAdminUser } from "@/lib/admin";
import { prisma } from "@/lib/prisma";

/**
 * GET /api/admin/categories
 * 카테고리 목록 (관리자만, 숙소 등록 폼 등에서 사용)
 */
export async function GET() {
  const admin = await getAdminUser();
  if (!admin) {
    return NextResponse.json(
      { error: "관리자만 카테고리 목록을 조회할 수 있습니다." },
      { status: 403 }
    );
  }
  const list = await prisma.listingCategory.findMany({
    orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
    select: { id: true, name: true, sortOrder: true },
  });
  return NextResponse.json(list);
}

/**
 * POST /api/admin/categories
 * 카테고리 새로 만들기 (Framer CMS처럼 등록 화면에서 바로 추가)
 */
export async function POST(req: Request) {
  const admin = await getAdminUser();
  if (!admin) {
    return NextResponse.json(
      { error: "관리자만 카테고리를 추가할 수 있습니다." },
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
  const { name } = body as Record<string, unknown>;
  if (typeof name !== "string" || !name.trim()) {
    return NextResponse.json(
      { error: "카테고리 이름을 입력해 주세요." },
      { status: 400 }
    );
  }
  try {
    const nextOrder = await prisma.listingCategory
      .aggregate({ _max: { sortOrder: true } })
      .then((r) => (r._max.sortOrder ?? -1) + 1);
    const category = await prisma.listingCategory.create({
      data: {
        name: name.trim(),
        sortOrder: nextOrder,
      },
    });
    return NextResponse.json(
      { id: category.id, name: category.name, sortOrder: category.sortOrder },
      { status: 201 }
    );
  } catch (e: unknown) {
    const isUniqueViolation =
      e && typeof e === "object" && "code" in e && (e as { code: string }).code === "P2002";
    if (isUniqueViolation) {
      return NextResponse.json(
        { error: "이미 같은 이름의 카테고리가 있습니다." },
        { status: 400 }
      );
    }
    console.error("Category create error:", e);
    return NextResponse.json(
      { error: "카테고리 저장에 실패했습니다." },
      { status: 500 }
    );
  }
}
