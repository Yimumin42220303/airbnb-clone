import { NextResponse } from "next/server";
import { getAdminUser } from "@/lib/admin";
import { createReviewsBulk } from "@/lib/reviews";

type RouteParams = { params: Promise<{ id: string }> };

/**
 * POST /api/admin/listings/[id]/reviews/import
 * 관리자 전용: 리뷰 일괄 등록 (Airbnb 등에서 복사한 리뷰 CSV/목록 입력)
 * body: { reviews: [{ authorDisplayName?, rating, body?, createdAt? }] }
 */
export async function POST(req: Request, { params }: RouteParams) {
  const admin = await getAdminUser();
  if (!admin) {
    return NextResponse.json(
      { error: "관리자만 일괄 가져오기를 할 수 있습니다." },
      { status: 403 }
    );
  }

  const resolved = await params;
  const listingId = resolved?.id ?? "";
  if (!listingId) {
    return NextResponse.json(
      { error: "숙소 ID가 필요합니다." },
      { status: 400 }
    );
  }

  let body: { reviews?: unknown[] };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json(
      { error: "잘못된 요청 본문입니다." },
      { status: 400 }
    );
  }

  const raw = Array.isArray(body.reviews) ? body.reviews : [];
  const reviews = raw.map((r) => {
    if (r == null || typeof r !== "object") return null;
    const o = r as Record<string, unknown>;
    const rating =
      typeof o.rating === "number"
        ? o.rating
        : typeof o.rating === "string"
          ? parseInt(o.rating, 10)
          : 0;
    return {
      authorDisplayName:
        typeof o.authorDisplayName === "string"
          ? o.authorDisplayName
          : undefined,
      rating: Number.isInteger(rating) && rating >= 1 && rating <= 5 ? rating : 5,
      body: typeof o.body === "string" ? o.body : undefined,
      createdAt:
        typeof o.createdAt === "string" && o.createdAt.trim()
          ? o.createdAt.trim()
          : undefined,
    };
  }).filter(Boolean) as { authorDisplayName?: string; rating: number; body?: string; createdAt?: string }[];

  const result = await createReviewsBulk(listingId, admin.id, reviews);

  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: 400 });
  }

  return NextResponse.json({
    ok: true,
    count: result.count,
    ids: result.ids,
  });
}
