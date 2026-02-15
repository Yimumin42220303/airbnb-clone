import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { createReview } from "@/lib/reviews";

/**
 * POST /api/listings/[id]/reviews
 * body: { rating: number (1-5), body?: string }
 * 로그인 사용자만 가능, 숙소당 1인 1리뷰
 */
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    const userId = (session as { userId?: string } | null)?.userId;
    if (!userId) {
      return NextResponse.json(
        { error: "로그인 후 이용할 수 있습니다." },
        { status: 401 }
      );
    }

    const { id: listingId } = await params;
    const body = await request.json();
    const rating = body.rating;
    const reviewBody = body.body;

    if (rating == null || typeof rating !== "number") {
      return NextResponse.json(
        { error: "평점(1~5)을 선택해 주세요." },
        { status: 400 }
      );
    }

    const result = await createReview(
      listingId,
      userId,
      rating,
      typeof reviewBody === "string" ? reviewBody : undefined
    );

    if (!result.ok) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    return NextResponse.json(result.review, { status: 201 });
  } catch (error) {
    console.error("POST /api/listings/[id]/reviews", error);
    return NextResponse.json(
      { error: "리뷰 저장 중 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}
