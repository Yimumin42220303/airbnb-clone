import { NextResponse } from "next/server";
import OpenAI from "openai";
import { prisma } from "@/lib/prisma";

const CACHE_TTL_MS = 24 * 60 * 60 * 1000; // 24시간
const MAX_REVIEWS = 30;
const MAX_BODY_LENGTH = 200;

function getOpenAI() {
  const key = process.env.OPENAI_API_KEY;
  if (!key) return null;
  return new OpenAI({ apiKey: key });
}

/**
 * GET /api/listings/[id]/reviews/summary
 * AI가 해당 숙소 리뷰를 읽고 좋은 점·아쉬운 점을 요약. 캐시 24시간.
 */
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: listingId } = await params;
    if (!listingId) {
      return NextResponse.json(
        { error: "숙소 ID가 필요합니다." },
        { status: 400 }
      );
    }

    const listing = await prisma.listing.findUnique({
      where: { id: listingId },
      select: { id: true },
    });
    if (!listing) {
      return NextResponse.json(
        { error: "숙소를 찾을 수 없습니다." },
        { status: 404 }
      );
    }

    const reviews = await prisma.review.findMany({
      where: { listingId },
      orderBy: { createdAt: "desc" },
      take: MAX_REVIEWS,
      select: { body: true, rating: true },
    });

    if (reviews.length === 0) {
      return NextResponse.json(
        { pros: [], cons: [], recommendedFor: [], message: "리뷰가 없어 요약할 수 없습니다." },
        { status: 200 }
      );
    }

    const now = Date.now();
    const cached = await prisma.listingReviewSummary.findUnique({
      where: { listingId },
    });
    if (
      cached &&
      cached.generatedAt &&
      now - new Date(cached.generatedAt).getTime() < CACHE_TTL_MS
    ) {
      let pros: string[] = [];
      let cons: string[] = [];
      let recommendedFor: string[] = [];
      try {
        pros = JSON.parse(cached.prosJson);
        cons = JSON.parse(cached.consJson);
        if (cached.recommendedForJson) {
          recommendedFor = JSON.parse(cached.recommendedForJson);
        }
      } catch {
        // invalid JSON: fall through to regenerate
      }
      if (Array.isArray(pros) && Array.isArray(cons)) {
        return NextResponse.json({ pros, cons, recommendedFor: Array.isArray(recommendedFor) ? recommendedFor : [] });
      }
    }

    const openai = getOpenAI();
    if (!openai) {
      return NextResponse.json(
        {
          error: "AI 요약 서비스가 설정되지 않았습니다. OPENAI_API_KEY를 확인해 주세요.",
        },
        { status: 503 }
      );
    }

    const reviewTexts = reviews
      .map((r, i) => {
        const body = (r.body ?? "").trim().slice(0, MAX_BODY_LENGTH);
        return `[${i + 1}] (★${r.rating}) ${body}`;
      })
      .join("\n\n");

    const systemPrompt = `당신은 숙소 리뷰를 분석하는 전문가입니다. 아래 리뷰들을 읽고 다음 세 가지를 JSON으로 요약하세요.
1. **좋은 점** 3가지 (짧은 문장)
2. **아쉬운 점(단점)** 3가지 (짧은 문장)
3. **이런 분에게 추천해요** 3~4가지: 리뷰 내용을 바탕으로 이 숙소가 특히 잘 맞는 게스트 유형을 짧게 나열 (예: "교통 편의를 중시하는 분", "장기 체류하는 분", "커플 여행객")
반드시 JSON만 반환하세요. 다른 텍스트는 포함하지 마세요.
형식: {"pros": ["좋은 점1", "좋은 점2", "좋은 점3"], "cons": ["아쉬운 점1", "아쉬운 점2", "아쉬운 점3"], "recommendedFor": ["추천 대상1", "추천 대상2", "추천 대상3"]}
리뷰에 거의 언급이 없는 항목은 1~2개만 작성해도 됩니다.`;

    const userPrompt = `## 이 숙소의 리뷰 (최근 ${reviews.length}개)\n\n${reviewTexts}\n\n위 리뷰를 바탕으로 좋은 점 3가지, 아쉬운 점 3가지, 이런 분에게 추천해요 3~4가지를 JSON으로 요약해 주세요.`;

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      temperature: 0.3,
    });

    const content = completion.choices[0]?.message?.content?.trim();
    if (!content) {
      return NextResponse.json(
        { error: "AI 요약을 생성하지 못했습니다." },
        { status: 500 }
      );
    }

    let pros: string[] = [];
    let cons: string[] = [];
    let recommendedFor: string[] = [];
    try {
      const parsed = JSON.parse(content.replace(/```json\n?|\n?```/g, "").trim());
      if (Array.isArray(parsed.pros)) pros = parsed.pros.slice(0, 5);
      if (Array.isArray(parsed.cons)) cons = parsed.cons.slice(0, 5);
      if (Array.isArray(parsed.recommendedFor)) recommendedFor = parsed.recommendedFor.slice(0, 5);
    } catch {
      return NextResponse.json(
        { error: "AI 응답 형식을 처리하지 못했습니다." },
        { status: 500 }
      );
    }

    await prisma.listingReviewSummary.upsert({
      where: { listingId },
      create: {
        listingId,
        prosJson: JSON.stringify(pros),
        consJson: JSON.stringify(cons),
        recommendedForJson: JSON.stringify(recommendedFor),
      },
      update: {
        prosJson: JSON.stringify(pros),
        consJson: JSON.stringify(cons),
        recommendedForJson: JSON.stringify(recommendedFor),
      },
    });

    return NextResponse.json({ pros, cons, recommendedFor });
  } catch (err) {
    console.error("GET /api/listings/[id]/reviews/summary", err);
    return NextResponse.json(
      { error: "요약을 불러오는 중 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}
