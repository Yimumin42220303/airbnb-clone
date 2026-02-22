import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";
import { getListings } from "@/lib/listings";
import { prisma } from "@/lib/prisma";
import { getNights } from "@/lib/bookings";

/** 숙소당 최근 리뷰 개수, 리뷰 본문 최대 글자 수 (토큰 절약) */
const MAX_REVIEWS_PER_LISTING = 5;
const MAX_REVIEW_BODY_LENGTH = 200;
/** 숙소 설명문 최대 글자 수 (AI 프롬프트 토큰 절약) */
const MAX_DESCRIPTION_LENGTH = 400;

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
  /** 우선순위 단일 (하위 호환) */
  priority?: string;
  /** 우선순위 최대 3개 */
  priorities?: string[];
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
    const { checkIn, checkOut, adults, children, tripType, priority, priorities: prioritiesInput, preferences } = body;

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

    const checkInDate = new Date(checkIn);
    const checkOutDate = new Date(checkOut);
    const stayNights = getNights(checkInDate, checkOutDate);

    const listingIds = listings.map((l) => l.id);
    const [reviewsByListing, listingExtras] = await Promise.all([
      prisma.review.findMany({
        where: { listingId: { in: listingIds } },
        select: { listingId: true, body: true, rating: true },
        orderBy: { createdAt: "desc" },
      }),
      prisma.listing.findMany({
        where: { id: { in: listingIds } },
        select: {
          id: true,
          description: true,
          propertyType: true,
          cleaningFee: true,
          baseGuests: true,
          extraGuestFee: true,
          pricePerNight: true,
          januaryFactor: true,
          februaryFactor: true,
          marchFactor: true,
          aprilFactor: true,
          mayFactor: true,
          juneFactor: true,
          julyFactor: true,
          augustFactor: true,
          septemberFactor: true,
          octoberFactor: true,
          novemberFactor: true,
          decemberFactor: true,
        },
      }),
    ]);

    const monthFactorKeys = [
      "januaryFactor", "februaryFactor", "marchFactor", "aprilFactor",
      "mayFactor", "juneFactor", "julyFactor", "augustFactor",
      "septemberFactor", "octoberFactor", "novemberFactor", "decemberFactor",
    ] as const;
    const checkInMonth = checkInDate.getMonth(); // 0-11

    const extraMap = new Map(listingExtras.map((e) => {
      const factor = (e[monthFactorKeys[checkInMonth]] ?? 1) as number;
      const baseGuests = e.baseGuests ?? 2;
      const extraGuests = Math.max(0, guests - baseGuests);
      const nightPrice = Math.round((e.pricePerNight ?? 0) * factor);
      const nightsTotal = stayNights * nightPrice;
      const extraTotal = stayNights * extraGuests * (e.extraGuestFee ?? 0);
      const totalEstimatedPrice = nightsTotal + (e.cleaningFee ?? 0) + extraTotal;
      return [
        e.id,
        {
          description: (e.description ?? "").trim().slice(0, MAX_DESCRIPTION_LENGTH),
          propertyType: e.propertyType ?? "apartment",
          totalEstimatedPrice,
        },
      ] as const;
    }));

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
      const extra = extraMap.get(l.id);
      const row = l as typeof l & {
        bedrooms?: number;
        maxGuests?: number;
        beds?: number;
        category?: { id: string; name: string };
      };
      return {
        id: l.id,
        title: l.title,
        location: l.location,
        description: extra?.description ?? "",
        price: l.price,
        totalEstimatedPrice: extra?.totalEstimatedPrice,
        rating: l.rating,
        reviewCount: l.reviewCount,
        category: row.category?.name,
        propertyType: extra?.propertyType ?? "apartment",
        amenities: l.amenities ?? [],
        houseRules: (l.houseRules ?? "").slice(0, 300),
        reviews: reviewList.map((r) => `[${r.rating}점] ${r.body}`),
        bedrooms: row.bedrooms,
        maxGuests: row.maxGuests,
        beds: row.beds,
      };
    });

    const systemPrompt = `당신은 도쿄 숙소 추천 전문가입니다. 게스트의 선호사항에 맞게 숙소를 순위 매기고, 각 숙소를 추천하는 이유(reason)와 근거(highlights)를 한국어로 작성합니다.

추천의 근거가 되는 5가지 요소를 반드시 활용하세요:
1. location (立地): 숙소 위치·역 거리·주변 환경
2. description (宿の説明文): 호스트가 작성한 숙소 설명
3. amenities (設備及びサービス): WiFi, 주방, 세탁기 등 편의시설 목록
4. houseRules (注意事項): 엘리베이터 유무, 흡연 규칙, 소음 주의, 반려동물·파티 등
5. reviews (レビューデータ): 실제 게스트 리뷰(평점+본문)

추가 고려 요소:
- stayNights (숙박 일수): 1~2박 단기→위치·편의성, 7박 이상 장기→주방·세탁기·넓이·totalEstimatedPrice 가성비
- totalEstimatedPrice (총 예상 금액 KRW): 숙박일수·인원·청소비 적용 후 총액. 가성비 우선 시 이 값을 비교하세요.
- category (카테고리): 도미토리/개인실/아파트 등. 선호에 "개인실만", "아파트" 등 있으면 반영
- propertyType (숙소 타입): apartment(아파트) | detached_house(단독주택). 프라이버시·넓이 선호와 연관

우선순위별 반영: 가성비→totalEstimatedPrice·리뷰, 평점→평점·리뷰 수, 위치→location·description·리뷰, 숙소넓이→bedrooms·maxGuests·beds·amenities·propertyType, 건전한 주변환경→location·houseRules·리뷰(조용함·안전함 언급), 어린이·유아친화→amenities·houseRules.
- reason: 추천 이유를 1~2문장으로 간결하게.
- highlights: 위 5가지 요소 중 해당하는 구체적 근거 2~4개. 게스트가 '왜 이 숙소인지' 알 수 있도록 짧은 문장으로.
반드시 JSON 배열만 반환하세요. 다른 텍스트는 포함하지 마세요.
형식: [{"id": "숙소ID", "rank": 1, "reason": "추천 이유", "highlights": ["근거1", "근거2", ...]}]`;

    const tripTypeLabel =
      tripType === "friends" ? "친구와" : tripType === "couple" ? "커플" : tripType === "family" ? "가족" : null;
    const priorityLabels: Record<string, string> = {
      value: "가성비",
      rating: "평점",
      location: "위치",
      space: "숙소넓이",
      environment: "건전한 주변환경",
      child_friendly: "어린이·유아친화 설비",
    };
    const priorityKeys = Array.isArray(prioritiesInput) && prioritiesInput.length > 0
      ? prioritiesInput.slice(0, 3).filter((p): p is string => typeof p === "string")
      : priority ? [priority] : [];
    const priorityLabel = priorityKeys.length > 0
      ? priorityKeys.map((k) => priorityLabels[k]).filter(Boolean).join(", ")
      : null;

    const userPrompt = `## 게스트 정보
- 체크인: ${checkIn}
- 체크아웃: ${checkOut}
- 숙박 일수: ${stayNights}박
- 인원: 성인 ${adults ?? 1}명, 어린이 ${children ?? 0}명 (총 ${guests}명)
${tripTypeLabel ? `- 여행 유형: ${tripTypeLabel}` : ""}
${priorityLabel ? `- 우선순위: ${priorityLabel} (이에 맞게 순위와 추천 이유를 반영할 것)` : ""}
- 그 외 선호사항: ${preferences?.trim() || "특별한 선호 없음"}

## 후보 숙소 (각 숙소에 location·description·totalEstimatedPrice·category·propertyType·amenities·houseRules·reviews 포함. 최대 5개만 추천, 순위대로)
${JSON.stringify(listingSummaries, null, 2)}

위 숙소 중 게스트 정보·선호와 立地·宿の説明文·設備·注意事項·レビューデータ를 종합해 가장 잘 맞는 순서로 1~5위를 정하고, 각각 reason과 highlights를 포함해 JSON 배열로 반환하세요.`;

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
