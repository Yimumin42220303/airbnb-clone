import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import OpenAI from "openai";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { formatForHost } from "@/lib/currency";

function getOpenAI() {
  const key = process.env.OPENAI_API_KEY;
  if (!key) return null;
  return new OpenAI({ apiKey: key });
}

/** 호스트 전용: 대화 맥락을 바탕으로 답장 초안 한 건 생성 */
const MAX_MESSAGES_FOR_CONTEXT = 20;

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  const userId = (session as { userId?: string } | null)?.userId;
  if (!userId) {
    return NextResponse.json(
      { error: "로그인 후 이용할 수 있습니다." },
      { status: 401 }
    );
  }

  const { id: conversationId } = await params;

  const conversation = await prisma.conversation.findUnique({
    where: { id: conversationId },
    include: {
      booking: {
        include: {
          listing: {
            select: {
              id: true,
              title: true,
              userId: true,
              user: { select: { name: true } },
            },
          },
          user: { select: { id: true, name: true, email: true } },
        },
      },
    },
  });

  if (!conversation?.booking) {
    return NextResponse.json(
      { error: "대화를 찾을 수 없습니다." },
      { status: 404 }
    );
  }

  const hostId = conversation.booking.listing.userId;
  if (userId !== hostId) {
    return NextResponse.json(
      { error: "호스트만 답안 제안을 사용할 수 있습니다." },
      { status: 403 }
    );
  }

  const openai = getOpenAI();
  if (!openai) {
    return NextResponse.json(
      { error: "AI 답안 제안 기능이 설정되지 않았습니다." },
      { status: 503 }
    );
  }

  const messages = await prisma.message.findMany({
    where: { conversationId },
    orderBy: { createdAt: "desc" },
    take: MAX_MESSAGES_FOR_CONTEXT,
    include: {
      sender: { select: { id: true, name: true } },
    },
  });
  const ordered = [...messages].reverse();

  const listing = conversation.booking.listing;
  const guest = conversation.booking.user;
  const booking = conversation.booking;
  const guestName = guest.name || guest.email || "게스트";
  const checkIn = booking.checkIn.toISOString().slice(0, 10);
  const checkOut = booking.checkOut.toISOString().slice(0, 10);
  const totalPrice = formatForHost(booking.totalPrice);
  const statusLabel =
    booking.status === "pending"
      ? "승인대기중"
      : booking.status === "confirmed"
        ? "확정"
        : booking.status === "cancelled"
          ? "취소완료"
          : booking.status;

  const conversationLines = ordered.map((m) => {
    const role = m.senderId === userId ? "호스트" : "게스트";
    return `[${role}] ${m.body}`;
  });

  const systemPrompt = `당신은 도쿄민박(숙소 예약 서비스)의 호스트입니다.
게스트와의 대화와 예약 요약이 주어지면, 호스트 입장에서 친절하고 간단한 답장 초안을 **한국어**로 작성하세요.
- 한 문단 이내로 짧게 작성하세요.
- 예약 번호·금액·날짜는 아래 [예약 요약]에 있는 정보만 사용하세요. 없는 정보는 만들지 마세요.
- 격식보다는 친근하고 정중한 말투를 유지하세요.`;

  const userPrompt = `[예약 요약]
숙소: ${listing.title}
게스트: ${guestName}
체크인: ${checkIn} / 체크아웃: ${checkOut}
상태: ${statusLabel}
총 요금: ${totalPrice}

[최근 대화]
${conversationLines.join("\n")}

위 대화를 바탕으로 호스트가 보낼 답장 초안을 한 문단으로 작성해 주세요. 다른 설명 없이 초안 텍스트만 출력하세요.`;

  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      max_tokens: 400,
      temperature: 0.6,
    });

    const draft =
      completion.choices[0]?.message?.content?.trim() ||
      "답안을 생성하지 못했습니다. 직접 입력해 주세요.";

    return NextResponse.json({ draft });
  } catch (e) {
    console.error("[suggest-reply] OpenAI error:", e);
    return NextResponse.json(
      { error: "답안 생성 중 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}
