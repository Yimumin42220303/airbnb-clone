import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { sendEmailAsync, BASE_URL } from "@/lib/email";

/**
 * POST /api/bookings/[id]/payment-link
 *
 * 게스트에게 결제 페이지 링크를 이메일로 발송합니다.
 * 모바일에서 KG이니시스 결제가 불가할 때 PC 결제 폴백으로 사용.
 */
export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    const userId = (session as { userId?: string } | null)?.userId;
    if (!userId) {
      return NextResponse.json({ error: "로그인이 필요합니다." }, { status: 401 });
    }

    const { id } = await params;

    const booking = await prisma.booking.findUnique({
      where: { id },
      include: {
        listing: { select: { title: true } },
        user: { select: { email: true, name: true } },
      },
    });

    if (!booking) {
      return NextResponse.json({ error: "예약을 찾을 수 없습니다." }, { status: 404 });
    }
    if (booking.userId !== userId) {
      return NextResponse.json({ error: "권한이 없습니다." }, { status: 403 });
    }
    if (booking.paymentStatus === "paid") {
      return NextResponse.json({ error: "이미 결제가 완료된 예약입니다." }, { status: 400 });
    }
    if (booking.status === "cancelled") {
      return NextResponse.json({ error: "취소된 예약입니다." }, { status: 400 });
    }

    const email = booking.user?.email;
    if (!email) {
      return NextResponse.json(
        { error: "이메일 주소가 등록되어 있지 않습니다. 마이페이지에서 이메일을 확인해 주세요." },
        { status: 400 }
      );
    }

    const payUrl = `${BASE_URL}/booking/${id}/pay`;
    const listingTitle = booking.listing?.title || "숙소 예약";
    const guestName = booking.user?.name || "고객";
    const checkInStr = booking.checkIn.toISOString().slice(0, 10);

    const html = `
<div style="background-color:#f7f7f7;padding:40px 0;">
  <div style="max-width:560px;margin:0 auto;background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,0.08);">
    <div style="background:#E31C23;padding:24px 32px;">
      <h1 style="margin:0;font-size:20px;font-weight:700;color:#fff;font-family:-apple-system,BlinkMacSystemFont,Segoe UI,Roboto,sans-serif;">
        결제 링크 안내
      </h1>
    </div>
    <div style="padding:32px;font-family:-apple-system,BlinkMacSystemFont,Segoe UI,Roboto,sans-serif;color:#222;font-size:15px;line-height:1.6;">
      <p>${guestName}님, 안녕하세요.</p>
      <p><strong>${listingTitle}</strong> (체크인: ${checkInStr}) 예약의 결제를 완료해 주세요.</p>
      <p>모바일에서 결제가 어려운 경우, 아래 버튼을 <strong>PC 브라우저</strong>에서 클릭하여 결제를 진행하실 수 있습니다.</p>
      <div style="text-align:center;margin:24px 0;">
        <a href="${payUrl}" style="display:inline-block;padding:14px 32px;background:#E31C23;color:#fff;text-decoration:none;border-radius:8px;font-weight:600;font-size:16px;">
          결제하기
        </a>
      </div>
      <p style="font-size:13px;color:#717171;">
        위 버튼이 동작하지 않으면 아래 링크를 복사하여 PC 브라우저에 붙여넣기 해 주세요.<br/>
        <a href="${payUrl}" style="color:#E31C23;word-break:break-all;">${payUrl}</a>
      </p>
    </div>
    <div style="padding:16px 32px;border-top:1px solid #ebebeb;text-align:center;">
      <p style="margin:0;font-size:12px;color:#717171;">&copy; TokyoMinbak | tokyominbak.net</p>
    </div>
  </div>
</div>`;

    sendEmailAsync({
      to: email,
      subject: `[도쿄민박] 결제 링크 안내 - ${listingTitle}`,
      html,
    });

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[payment-link] Error:", err);
    return NextResponse.json(
      { error: "이메일 발송 중 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}
