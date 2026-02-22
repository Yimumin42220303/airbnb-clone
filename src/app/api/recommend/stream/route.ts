import { NextRequest } from "next/server";
import OpenAI from "openai";
import { getListings } from "@/lib/listings";
import { prisma } from "@/lib/prisma";
import { getNights } from "@/lib/bookings";
import type { RecommendInput } from "../route";

const MAX_REVIEWS_PER_LISTING = 5;
const MAX_REVIEW_BODY_LENGTH = 200;
const MAX_DESCRIPTION_LENGTH = 400;

function getOpenAI() {
  const key = process.env.OPENAI_API_KEY;
  if (!key) return null;
  return new OpenAI({ apiKey: key });
}

/** 스트리밍: NDJSON 형식(한 줄에 하나씩)으로 추천 1,2,3,4,5를 순차 출력 */
const NDJSON_SYSTEM = `당신은 도쿄 숙소 추천 전문가입니다. 게스트의 선호사항에 맞게 숙소를 순위 매기고, 각 숙소를 추천하는 이유(reason)와 근거(highlights)를 한국어로 작성합니다.
추천의 근거: location, description, amenities, houseRules, reviews, totalEstimatedPrice, category, propertyType.
- reason: 1~2문장으로 간결하게.
- highlights: 구체적 근거 2~4개.
중요: JSON 배열이 아니라, 각 추천을 한 줄에 하나씩 출력. 5줄. 배열 기호 없음. 쉼표 없음.
형식 (줄바꿈으로 구분):
{"id":"숙소ID","rank":1,"reason":"이유","highlights":["a","b"]}
{"id":"숙소ID","rank":2,"reason":"이유","highlights":["a","b"]}
...`;

export async function POST(req: NextRequest) {
  const encoder = new TextEncoder();
  const body = (await req.json()) as RecommendInput;
  const { checkIn, checkOut, adults, children, tripType, priority, priorities: prioritiesInput, preferences } = body;

  if (!checkIn || !checkOut) {
    return new Response(
      JSON.stringify({ error: "체크인·체크아웃 날짜를 입력해 주세요." }),
      { status: 400 }
    );
  }

  const guests = (adults ?? 1) + (children ?? 0);
  if (guests < 1) {
    return new Response(
      JSON.stringify({ error: "인원을 1명 이상 선택해 주세요." }),
      { status: 400 }
    );
  }

  const openai = getOpenAI();
  if (!openai) {
    return new Response(
      JSON.stringify({ error: "AI 추천 서비스가 설정되지 않았습니다." }),
      { status: 503 }
    );
  }

  const listings = await getListings({ checkIn, checkOut, guests });
  if (listings.length === 0) {
    return new Response(
      JSON.stringify({ listings: [], message: "해당 기간·인원에 예약 가능한 숙소가 없습니다." }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
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
  const checkInMonth = checkInDate.getMonth();
  const extraMap = new Map(listingExtras.map((e) => {
    const factor = (e[monthFactorKeys[checkInMonth]] ?? 1) as number;
    const baseGuests = e.baseGuests ?? 2;
    const extraGuests = Math.max(0, guests - baseGuests);
    const nightPrice = Math.round((e.pricePerNight ?? 0) * factor);
    const nightsTotal = stayNights * nightPrice;
    const extraTotal = stayNights * extraGuests * (e.extraGuestFee ?? 0);
    const totalEstimatedPrice = nightsTotal + (e.cleaningFee ?? 0) + extraTotal;
    return [e.id, {
      description: (e.description ?? "").trim().slice(0, MAX_DESCRIPTION_LENGTH),
      propertyType: e.propertyType ?? "apartment",
      totalEstimatedPrice,
    }] as const;
  }));

  const reviewsGrouped = new Map<string, { body: string; rating: number }[]>();
  for (const r of reviewsByListing) {
    if (!reviewsGrouped.has(r.listingId)) reviewsGrouped.set(r.listingId, []);
    const arr = reviewsGrouped.get(r.listingId)!;
    if (arr.length < MAX_REVIEWS_PER_LISTING) {
      const snippet = (r.body ?? "").trim().slice(0, MAX_REVIEW_BODY_LENGTH);
      if (snippet) arr.push({ body: snippet, rating: r.rating });
    }
  }

  const listingSummaries = listings.map((l) => {
    const reviewList = reviewsGrouped.get(l.id) ?? [];
    const extra = extraMap.get(l.id);
    const row = l as typeof l & { bedrooms?: number; maxGuests?: number; beds?: number; category?: { id: string; name: string } };
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

  const tripTypeLabel = tripType === "friends" ? "친구와" : tripType === "couple" ? "커플" : tripType === "family" ? "가족" : null;
  const priorityLabels: Record<string, string> = {
    value: "가성비", rating: "평점", location: "위치", space: "숙소넓이",
    environment: "건전한 주변환경", child_friendly: "어린이·유아친화 설비",
  };
  const priorityKeys = Array.isArray(prioritiesInput) && prioritiesInput.length > 0
    ? prioritiesInput.slice(0, 3).filter((p): p is string => typeof p === "string")
    : priority ? [priority] : [];
  const priorityLabel = priorityKeys.length > 0
    ? priorityKeys.map((k) => priorityLabels[k]).filter(Boolean).join(", ")
    : null;

  const userPrompt = `## 게스트 정보
- 체크인: ${checkIn}, 체크아웃: ${checkOut}
- 숙박 일수: ${stayNights}박
- 인원: 성인 ${adults ?? 1}명, 어린이 ${children ?? 0}명 (총 ${guests}명)
${tripTypeLabel ? `- 여행 유형: ${tripTypeLabel}` : ""}
${priorityLabel ? `- 우선순위: ${priorityLabel}` : ""}
- 선호사항: ${preferences?.trim() || "특별한 선호 없음"}

## 후보 숙소
${JSON.stringify(listingSummaries, null, 2)}

위 숙소 중 게스트 정보·선호에 맞게 1~5위를 정하고, 각각 한 줄씩 JSON으로 출력. 형식: {"id":"...","rank":1,"reason":"...","highlights":["..."]} (5줄)`;

  const stream = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [
      { role: "system", content: NDJSON_SYSTEM },
      { role: "user", content: userPrompt },
    ],
    temperature: 0.5,
    stream: true,
  });

  const listingMap = new Map(listings.map((l) => [l.id, l]));

  const readable = new ReadableStream({
    async start(controller) {
      let buffer = "";
      const sendEvent = (data: unknown) => {
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`));
      };

      try {
        for await (const chunk of stream) {
          const text = chunk.choices[0]?.delta?.content ?? "";
          if (!text) continue;
          buffer += text;
          const lines = buffer.split("\n");
          buffer = lines.pop() ?? "";
          for (const line of lines) {
            const trimmed = line.trim().replace(/^\[|\]$|^,\s*|,\s*$/g, "").trim();
            if (!trimmed) continue;
            const parseAndEmit = (obj: { id?: string; rank?: number; reason?: string; highlights?: string[] }) => {
              if (obj?.id && obj?.rank != null && obj?.reason) {
                const listing = listingMap.get(obj.id);
                if (listing) {
                  sendEvent({
                    ...listing,
                    rank: obj.rank,
                    reason: obj.reason,
                    highlights: Array.isArray(obj.highlights) ? obj.highlights.slice(0, 5).filter((h): h is string => typeof h === "string") : undefined,
                  });
                }
              }
            };
            try {
              const parsed = JSON.parse(trimmed);
              if (Array.isArray(parsed)) {
                parsed.forEach((r: unknown) => parseAndEmit(r as { id?: string; rank?: number; reason?: string; highlights?: string[] }));
              } else {
                parseAndEmit(parsed);
              }
            } catch {
              // skip invalid JSON line
            }
          }
        }
        if (buffer.trim()) {
          try {
            const parsed = JSON.parse(buffer.trim()) as { id?: string; rank?: number; reason?: string; highlights?: string[] };
            if (parsed?.id && parsed?.rank != null && parsed?.reason) {
              const listing = listingMap.get(parsed.id);
              if (listing) {
                const full = {
                  ...listing,
                  rank: parsed.rank,
                  reason: parsed.reason,
                  highlights: Array.isArray(parsed.highlights) ? parsed.highlights.slice(0, 5).filter((h): h is string => typeof h === "string") : undefined,
                };
                sendEvent(full);
              }
            }
          } catch {
            // skip
          }
        }
        sendEvent({ done: true });
      } catch (err) {
        console.error("Recommend stream error:", err);
        sendEvent({ error: "AI 추천 처리 중 오류가 발생했습니다." });
      } finally {
        controller.close();
      }
    },
  });

  return new Response(readable, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  });
}
