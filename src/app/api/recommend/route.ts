import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";
import { getListings } from "@/lib/listings";

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
  preferences: string;
};

export type RecommendResult = {
  id: string;
  rank: number;
  reason: string;
};

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as RecommendInput;
    const { checkIn, checkOut, adults, children, preferences } = body;

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

    const listingSummaries = listings.map((l) => ({
      id: l.id,
      title: l.title,
      location: l.location,
      price: l.price,
      rating: l.rating,
      reviewCount: l.reviewCount,
      amenities: l.amenities ?? [],
      houseRules: (l.houseRules ?? "").slice(0, 300),
    }));

    const systemPrompt = `당신은 도쿄 숙소 추천 전문가입니다. 게스트의 선호사항에 맞게 숙소를 순위 매기고, 각 숙소를 추천하는 이유를 1~2문장으로 간결하게 한국어로 작성합니다.
반드시 JSON 배열만 반환하세요. 다른 텍스트는 포함하지 마세요.
형식: [{"id": "숙소ID", "rank": 1, "reason": "추천 이유"}]`;

    const userPrompt = `## 게스트 정보
- 체크인: ${checkIn}
- 체크아웃: ${checkOut}
- 인원: 성인 ${adults ?? 1}명, 어린이 ${children ?? 0}명
- 선호사항: ${preferences?.trim() || "특별한 선호 없음"}

## 후보 숙소 (최대 5개만 추천, 순위대로)
${JSON.stringify(listingSummaries, null, 2)}

위 숙소 중 게스트 선호에 가장 잘 맞는 순서로 1~5위를 정하고, 각각에 대한 추천 이유를 작성해 JSON 배열로 반환하세요.`;

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
            .map((r: { id: string; rank: number; reason: string }) => ({
              id: r.id,
              rank: r.rank,
              reason: r.reason,
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
          ? { ...listing, rank: r.rank, reason: r.reason }
          : null;
      })
      .filter(Boolean);

    const fallback = ordered.length === 0
      ? listings.slice(0, 5).map((l, i) => ({ ...l, rank: i + 1, reason: "선호사항에 맞는 숙소로 추천합니다." }))
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
