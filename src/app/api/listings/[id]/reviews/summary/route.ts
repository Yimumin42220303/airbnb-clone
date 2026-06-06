import { NextResponse } from "next/server";
import OpenAI from "openai";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { REVIEW_SUMMARY_ERROR_CODES } from "@/lib/review-summary-errors";

const CACHE_TTL_MS = 24 * 60 * 60 * 1000; // 24시간
const MAX_REVIEWS = 30;
const MAX_BODY_LENGTH = 200;

function getOpenAI() {
  const key = process.env.GROQ_API_KEY;
  if (!key) return null;
  return new OpenAI({ apiKey: key, baseURL: "https://api.groq.com/openai/v1" });
}

function isListingReviewSummaryTableMissing(err: unknown): boolean {
  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    if (err.code === "P2021") return true;
    const m = err.message ?? "";
    if (/ListingReviewSummary|does not exist/i.test(m)) return true;
  }
  if (err instanceof Error) {
    const m = err.message;
    if (/ListingReviewSummary|P2021|relation.*does not exist/i.test(m)) return true;
  }
  return false;
}

function openAIStatus(err: unknown): number | undefined {
  if (err && typeof err === "object" && "status" in err) {
    const s = (err as { status?: number }).status;
    return typeof s === "number" ? s : undefined;
  }
  return undefined;
}

function isOpenAIRateLimitError(err: unknown): boolean {
  if (openAIStatus(err) === 429) return true;
  const msg = err instanceof Error ? err.message : String(err);
  if (/429|rate_limit|rate limit|too many requests|限流/i.test(msg)) return true;
  if (
    err &&
    typeof err === "object" &&
    "code" in err &&
    (err as { code?: string }).code === "rate_limit_exceeded"
  ) {
    return true;
  }
  return false;
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/** 429 등 일시 한도에 대비해 짧게 재시도 (서버리스 타임아웃 고려해 횟수·간격 제한) */
async function createReviewSummaryCompletion(
  openai: OpenAI,
  systemPrompt: string,
  userPrompt: string
): Promise<OpenAI.Chat.Completions.ChatCompletion> {
  const params = {
    model: "llama-3.3-70b-versatile",
    messages: [
      { role: "system" as const, content: systemPrompt },
      { role: "user" as const, content: userPrompt },
    ],
    temperature: 0.3,
    response_format: { type: "json_object" as const },
  };

  const maxAttempts = 4;
  let lastErr: unknown;
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    try {
      return await openai.chat.completions.create(params);
    } catch (e) {
      lastErr = e;
      const retryable = isOpenAIRateLimitError(e);
      if (!retryable || attempt === maxAttempts - 1) {
        throw e;
      }
      const base = 900 * 2 ** attempt;
      const jitter = Math.floor(Math.random() * 350);
      console.warn(
        `[reviews/summary] OpenAI rate limited, retry ${attempt + 1}/${maxAttempts - 1} after ${base + jitter}ms`
      );
      await sleep(base + jitter);
    }
  }
  throw lastErr;
}

/**
 * GET /api/listings/[id]/reviews/summary
 * AI가 해당 숙소 리뷰를 읽고 좋은 점·아쉬운 점을 요약. 캐시 24시간.
 * ListingReviewSummary 테이블이 없으면 캐시 없이 OpenAI만 호출해 응답합니다(기존 Listing/Booking 데이터는 변경하지 않음).
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
        {
          pros: [],
          cons: [],
          recommendedFor: [],
          message: "리뷰가 없어 요약할 수 없습니다.",
        },
        { status: 200 }
      );
    }

    const now = Date.now();
    let cacheTableAvailable = true;

    try {
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
          return NextResponse.json({
            pros,
            cons,
            recommendedFor: Array.isArray(recommendedFor) ? recommendedFor : [],
          });
        }
      }
    } catch (cacheErr) {
      if (isListingReviewSummaryTableMissing(cacheErr)) {
        cacheTableAvailable = false;
        console.warn(
          "[reviews/summary] ListingReviewSummary unavailable, continuing without cache:",
          cacheErr instanceof Error ? cacheErr.message : cacheErr
        );
      } else {
        throw cacheErr;
      }
    }

    const openai = getOpenAI();
    if (!openai) {
      return NextResponse.json(
        {
          error:
            "AI 요약 서비스가 설정되지 않았습니다. GROQ_API_KEY를 확인해 주세요.",
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

    const systemPrompt = `당신은 숙소 리뷰를 분석하는 전문가입니다. 아래 리뷰들을 읽고 다음 세 가지를 하나의 JSON 객체로만 답하세요.
1. **좋은 점** pros: 짧은 문장 문자열 배열 (3개 내외, 리뷰에 거의 없으면 1~2개만).
2. **아쉬운 점** cons: 리뷰에서 실제로 언급된 단점만. 없으면 빈 배열 []. 억지로 채우지 마세요.
3. **이런 분에게 추천해요** recommendedFor: 게스트 유형을 짧게 나열한 문자열 배열 (3~4개).
반드시 유효한 JSON 객체 한 개만 출력하세요. 키 이름은 정확히 pros, cons, recommendedFor 입니다.`;

    const userPrompt = `## 이 숙소의 리뷰 (최근 ${reviews.length}개)\n\n${reviewTexts}\n\n위 리뷰를 바탕으로 pros, cons, recommendedFor 를 담은 JSON 객체만 반환하세요.`;

    let content: string;
    try {
      const completion = await createReviewSummaryCompletion(
        openai,
        systemPrompt,
        userPrompt
      );
      content = completion.choices[0]?.message?.content?.trim() ?? "";
    } catch (aiErr) {
      console.error("GET /api/listings/[id]/reviews/summary OpenAI:", aiErr);
      const st = openAIStatus(aiErr);
      if (st === 429) {
        return NextResponse.json(
          {
            error: "요청이 많아 잠시 후 다시 시도해 주세요.",
            code: REVIEW_SUMMARY_ERROR_CODES.RATE_LIMIT,
          },
          { status: 429 }
        );
      }
      return NextResponse.json(
        { error: "AI 요약 요청에 실패했습니다. 잠시 후 다시 시도해 주세요." },
        { status: 502 }
      );
    }

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
      const parsed = JSON.parse(
        content.replace(/```json\n?|\n?```/g, "").trim()
      ) as Record<string, unknown>;
      const asStrings = (v: unknown, max: number): string[] =>
        Array.isArray(v)
          ? v.filter((x): x is string => typeof x === "string").slice(0, max)
          : [];
      pros = asStrings(parsed.pros, 5);
      cons = asStrings(parsed.cons, 5);
      recommendedFor = asStrings(parsed.recommendedFor, 5);
    } catch {
      return NextResponse.json(
        { error: "AI 응답 형식을 처리하지 못했습니다." },
        { status: 500 }
      );
    }

    if (cacheTableAvailable) {
      try {
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
      } catch (upsertErr) {
        if (isListingReviewSummaryTableMissing(upsertErr)) {
          console.warn(
            "[reviews/summary] upsert skipped (table missing), returning summary only"
          );
        } else {
          throw upsertErr;
        }
      }
    }

    return NextResponse.json({ pros, cons, recommendedFor });
  } catch (err) {
    console.error("GET /api/listings/[id]/reviews/summary", err);
    if (isListingReviewSummaryTableMissing(err)) {
      return NextResponse.json(
        {
          error:
            "요약 캐시 DB가 준비되지 않았습니다. `prisma migrate deploy` 적용 후 다시 시도해 주세요.",
          code: REVIEW_SUMMARY_ERROR_CODES.DB_UNAVAILABLE,
        },
        { status: 503 }
      );
    }
    return NextResponse.json(
      { error: "요약을 불러오는 중 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}
