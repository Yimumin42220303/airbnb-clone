import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAdminUser } from "@/lib/admin";

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

  const { rating, text } = body as {
    rating?: number;
    text?: string;
  };

  const data: { rating?: number; body?: string | null } = {};

  if (rating !== undefined) {
    if (typeof rating !== "number" || rating < 1 || rating > 5) {
      return NextResponse.json(
        { error: "평점은 1~5 사이의 숫자여야 합니다." },
        { status: 400 }
      );
    }
    data.rating = rating;
  }

  if (text !== undefined) {
    if (typeof text !== "string") {
      return NextResponse.json(
        { error: "리뷰 내용은 문자열이어야 합니다." },
        { status: 400 }
      );
    }
    data.body = text.trim() || null;
  }

  if (!Object.keys(data).length) {
    return NextResponse.json(
      { error: "수정할 값이 없습니다." },
      { status: 400 }
    );
  }

  try {
    await prisma.review.update({
      where: { id },
      data,
    });
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("Admin review update error:", e);
    return NextResponse.json(
      { error: "리뷰 수정에 실패했습니다." },
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

  try {
    await prisma.review.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("Admin review delete error:", e);
    return NextResponse.json(
      { error: "리뷰 삭제에 실패했습니다." },
      { status: 500 }
    );
  }
}

