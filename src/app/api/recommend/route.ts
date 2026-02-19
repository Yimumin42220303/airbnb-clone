import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";
import { getListings } from "@/lib/listings";
import { prisma } from "@/lib/prisma";

/** 숙소당 최근 리뷰 개수, 리뷰 본문 최대 글자 수 (토큰 절약) */
const MAX_REVIEWS_PER_LISTING = 5;
const MAX_REVIEW_BODY_LENGTH = 200;

function getOpenAI() {
  const key = process.env.OPENAI_API_KEY;
  if (!key) return null;
  return new OpenAI({ apiKey: key });
}

export type RecommendInput = {
  checkIn: string;
  checkOut: string;
  adults: number;
  children: number;
  infants?: number;
  /** 여행 유형: friends | couple | family */
  tripType?: string;
  /** 우선순위: value(가성비) | rating(평점) | location(위치) */
  priority?: string;
  preferences: string;
};

export type RecommendResult = {
  id: string;
  rank: number;
  reason: string;
  /** AI가 추천한 근거(리뷰·위치·가격 등) 2~4개. 게스트에게 "왜 이 숙소인지" 보여줄 때 사용 */
  highlights?: string[];
};

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as RecommendInput;
    const { checkIn, checkOut, adults, children, tripType, priority, preferences } = body;

    if (!checkIn || !checkOut) {
      return NextResponse.json(
        { error: "체크인·체크아웃 날짜를 입력해 주세요." },
        { status: 400 }
      );
    }

    const guests = (adults ?? 1) + (children ?? 0);
    if (guests < 1) {
      return NextResponse.json(
        { error: "인원을 1명 이상 선택해 주세요." },
        { status: 400 }
      );
    }

    const openai = getOpenAI();
    if (!openai) {
      return NextResponse.json(
        { error: "AI 추천 서비스가 설정되지 않았습니다. OPENAI_API_KEY를 확인해 주세요." },
        { status: 503 }
      );
    }

    const listings = await getListings({
      checkIn,
      checkOut,
      guests,
    });

    if (listings.length === 0) {
      return NextResponse.json({
        listings: [],
        recommendations: [],
        message: "해당 기간·인원에 예약 가능한 숙소가 없습니다.",
      });
    }

    const listingIds = listings.map((l) => l.id);
    const reviewsByListing = await prisma.review.findMany({
      where: { listingId: { in: listingIds } },
      select: { listingId: true, body: true, rating: true },
      orderBy: { createdAt: "desc" },
    });

    const reviewsGrouped = new Map<string, { body: string; rating: number }[]>();
    for (const r of reviewsByListing) {
      if (!reviewsGrouped.has(r.listingId)) {
        reviewsGrouped.set(r.listingId, []);
      }
      const arr = reviewsGrouped.get(r.listingId)!;
      if (arr.length < MAX_REVIEWS_PER_LISTING) {
        const snippet = (r.body ?? "").trim().slice(0, MAX_REVIEW_BODY_LENGTH);
        if (snippet) arr.push({ body: snippet, rating: r.rating });
      }
    }

    const listingSummaries = listings.map((l) => {
      const reviewList = reviewsGrouped.get(l.id) ?? [];
      return {
        id: l.id,
        title: l.title,
        location: l.location,
        price: l.price,
        rating: l.rating,
        reviewCount: l.reviewCount,
        amenities: l.amenities ?? [],
        houseRules: (l.houseRules ?? "").slice(0, 300),
        reviews: reviewList.map((r) => `[${r.rating}점] ${r.body}`),
      };
    });

    const systemPrompt = `당신은 도쿄 숙소 추천 전문가입니다. 게스트의 선호사항에 맞게 숙소를 순위 매기고, 각 숙소를 추천하는 이유(reason)와 근거(highlights)를 한국어로 작성합니다.
각 숙소에는 "reviews" 배열(실제 게스트 리뷰 내용)이 포함되어 있습니다. 리뷰 수·평점·리뷰 내용(청결도·위치·가성비 등)을 반영해 순위와 추천 이유를 작성하세요.
- reason: 추천 이유를 1~2문장으로 간결하게.
- highlights: 이 숙소를 추천한 구체적 근거 2~4개(예: "리뷰에서 청결도·위치가 자주 언급됨", "가성비 우선에 맞는 가격대"). 게스트가 '왜 이 숙소인지' 알 수 있도록 짧은 문장으로.
반드시 JSON 배열만 반환하세요. 다른 텍스트는 포함하지 마세요.
형식: [{"id": "숙소ID", "rank": 1, "reason": "추천 이유", "highlights": ["근거1", "근거2", ...]}]`;

    const tripTypeLabel =
      tripType === "friends" ? "친구와" : tripType === "couple" ? "커플" : tripType === "family" ? "가족" : null;
    const priorityLabel =
      priority === "value" ? "가성비 중시" : priority === "rating" ? "평점 중시" : priority === "location" ? "위치 중시" : null;

    const userPrompt = `## 게스트 정보
- 체크인: ${checkIn}
- 체크아웃: ${checkOut}
- 인원: 성인 ${adults ?? 1}명, 어린이 ${children ?? 0}명
${tripTypeLabel ? `- 여행 유형: ${tripTypeLabel}` : ""}
${priorityLabel ? `- 우선순위: ${priorityLabel} (이에 맞게 순위와 추천 이유를 반영할 것)` : ""}
- 그 외 선호사항: ${preferences?.trim() || "특별한 선호 없음"}

## 후보 숙소 (각 숙소에 리뷰 내용이 포함됨. 최대 5개만 추천, 순위대로)
${JSON.stringify(listingSummaries, null, 2)}

위 숙소 중 게스트 정보·선호와 리뷰 내용(실제 이용 후기)을 종합해 가장 잘 맞는 순서로 1~5위를 정하고, 각각 reason과 highlights를 포함해 JSON 배열로 반환하세요.`;

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      temperature: 0.5,
    });

    const content = completion.choices[0]?.message?.content?.trim();
    if (!content) {
      return NextResponse.json(
        { error: "AI 응답을 생성하지 못했습니다." },
        { status: 500 }
      );
    }

    let recommendations: RecommendResult[];
    try {
      const parsed = JSON.parse(content.replace(/```json\n?|\n?```/g, "").trim());
      recommendations = Array.isArray(parsed)
        ? parsed
            .filter((r: { id?: string; rank?: number; reason?: string }) => r?.id && r?.rank && r?.reason)
            .slice(0, 5)
            .map((r: { id: string; rank: number; reason: string; highlights?: string[] }) => ({
              id: r.id,
              rank: r.rank,
              reason: r.reason,
              highlights: Array.isArray(r.highlights) ? r.highlights.slice(0, 5).filter((h): h is string => typeof h === "string") : undefined,
            }))
        : [];
    } catch {
      recommendations = [];
    }

    const ordered = recommendations
      .sort((a, b) => a.rank - b.rank)
      .map((r) => {
        const listing = listings.find((l) => l.id === r.id);
        return listing
          ? { ...listing, rank: r.rank, reason: r.reason, highlights: r.highlights }
          : null;
      })
      .filter(Boolean);

    const fallback = ordered.length === 0
      ? listings.slice(0, 5).map((l, i) => ({ ...l, rank: i + 1, reason: "선호사항에 맞는 숙소로 추천합니다.", highlights: undefined as string[] | undefined }))
      : ordered;

    return NextResponse.json({
      listings: fallback,
      message: ordered.length > 0 ? undefined : "AI가 순위를 생성하지 못해 기본 순서로 표시합니다.",
    });
  } catch (err) {
    console.error("Recommend API error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "추천 처리 중 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}
