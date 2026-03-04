/**
 * POST /api/cron/blog-daily
 *
 * Vercel Cron: 매일 지정 시각에 1회 실행.
 * 오늘 날짜에 해당하는 주제로 OpenAI가 블로그 글을 생성한 뒤,
 * /api/admin/blog/from-api 로 전달하여 자동 등록합니다.
 *
 * 필요 환경변수: CRON_SECRET, OPENAI_API_KEY, BLOG_AUTO_PUBLISH_API_KEY
 */
import { NextResponse } from "next/server";
import OpenAI from "openai";
import { getTopicForDate } from "@/lib/blog-daily-topics";
import { BLOG_DAILY_SYSTEM_PROMPT } from "@/lib/blog-daily-prompt";
import { BASE_URL } from "@/lib/site-url";

function getOpenAI() {
  const key = process.env.OPENAI_API_KEY;
  if (!key) return null;
  return new OpenAI({ apiKey: key });
}

function extractJson(text: string): string {
  let s = text.trim();
  const codeBlock = /^```(?:json)?\s*\n?([\s\S]*?)\n?```$/;
  const m = s.match(codeBlock);
  if (m) return m[1].trim();
  const start = s.indexOf("{");
  const end = s.lastIndexOf("}");
  if (start !== -1 && end !== -1 && end > start) return s.slice(start, end + 1);
  return s;
}

export async function POST(request: Request) {
  const authHeader = request.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;
  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const apiKey = process.env.BLOG_AUTO_PUBLISH_API_KEY;
  if (!apiKey || apiKey.length < 16) {
    return NextResponse.json(
      { error: "BLOG_AUTO_PUBLISH_API_KEY가 설정되지 않았거나 너무 짧습니다." },
      { status: 500 }
    );
  }

  const openai = getOpenAI();
  if (!openai) {
    return NextResponse.json(
      { error: "OPENAI_API_KEY가 설정되지 않았습니다." },
      { status: 500 }
    );
  }

  const now = new Date();
  const topic = getTopicForDate(now);
  const year = now.getFullYear();

  const userPrompt = `오늘 주제: ${topic}\n타깃 키워드: 주제에 맞는 검색 키워드 1~2개 포함.\n연도: ${year}년 기준으로 작성.\n\n위 규칙에 따라 블로그 글을 작성한 뒤, **다른 설명 없이 JSON만** 출력해 주세요.`;

  let rawContent: string;
  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: BLOG_DAILY_SYSTEM_PROMPT },
        { role: "user", content: userPrompt },
      ],
      temperature: 0.6,
    });
    rawContent = completion.choices[0]?.message?.content?.trim() ?? "";
  } catch (e) {
    console.error("blog-daily OpenAI error:", e);
    return NextResponse.json(
      { error: "OpenAI 호출 실패", detail: String(e) },
      { status: 500 }
    );
  }

  if (!rawContent) {
    return NextResponse.json(
      { error: "OpenAI가 응답을 생성하지 않았습니다." },
      { status: 500 }
    );
  }

  let payload: { title?: string; slug?: string; excerpt?: string; coverImage?: string; body?: string; published?: boolean };
  try {
    const jsonStr = extractJson(rawContent);
    payload = JSON.parse(jsonStr) as typeof payload;
  } catch (e) {
    console.error("blog-daily JSON parse error:", e);
    return NextResponse.json(
      { error: "AI 응답을 JSON으로 파싱할 수 없습니다.", raw: rawContent.slice(0, 500) },
      { status: 500 }
    );
  }

  if (typeof payload.title !== "string" || !payload.title.trim() || typeof payload.body !== "string" || !payload.body.trim()) {
    return NextResponse.json(
      { error: "AI 응답에 title 또는 body가 없습니다." },
      { status: 500 }
    );
  }

  const body = {
    title: payload.title.trim(),
    slug: typeof payload.slug === "string" ? payload.slug.trim() : undefined,
    excerpt: typeof payload.excerpt === "string" ? payload.excerpt.trim() : undefined,
    coverImage: typeof payload.coverImage === "string" ? payload.coverImage.trim() : undefined,
    body: payload.body.trim(),
    published: payload.published !== false,
  };

  const fromApiUrl = `${BASE_URL}/api/admin/blog/from-api`;
  let res: Response;
  try {
    res = await fetch(fromApiUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
      },
      body: JSON.stringify(body),
    });
  } catch (e) {
    console.error("blog-daily fetch from-api error:", e);
    return NextResponse.json(
      { error: "블로그 등록 API 호출 실패", detail: String(e) },
      { status: 500 }
    );
  }

  const result = await res.json().catch(() => ({}));
  if (!res.ok) {
    return NextResponse.json(
      { error: "블로그 등록 API 오류", status: res.status, body: result },
      { status: 502 }
    );
  }

  return NextResponse.json({
    ok: true,
    topic,
    date: now.toISOString().slice(0, 10),
    post: result,
  });
}
