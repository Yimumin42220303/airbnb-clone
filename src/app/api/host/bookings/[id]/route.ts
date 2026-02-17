import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getOfficialUserId } from "@/lib/official-account";
import { cancelPayment } from "@/lib/portone";
import { sendEmailAsync, BASE_URL } from "@/lib/email";
import {
  paymentRequestGuest,
  paymentRequestHost,
  bookingRejectedGuest,
  bookingRejectedHost,
} from "@/lib/email-templates";

/**
 * PATCH /api/host/bookings/[id]
 * 호스트가 예약 승인(accept) / 거절(reject) / 취소(cancel)
 * 본인 숙소의 예약만 가능
 *
 * 결제 완료된 예약을 호스트가 취소/거절할 경우 100% 전액 환불 처리
 */
export async function PATCH(
  request: Request,
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

  const { id } = await params;
  const body = await request.json();
  const action = body.action; // "accept" | "reject" | "cancel"

  const booking = await prisma.booking.findUnique({
    where: { id },
    include: {
      listing: { select: { userId: true, title: true, location: true } },
      user: { select: { name: true, email: true } },
      transactions: {
        where: { status: "paid" },
        orderBy: { createdAt: "desc" },
        take: 1,
      },
    },
  });
  if (!booking) {
    return NextResponse.json(
      { error: "예약을 찾을 수 없습니다." },
      { status: 404 }
    );
  }
  if (booking.listing.userId !== userId) {
    return NextResponse.json(
      { error: "권한이 없습니다." },
      { status: 403 }
    );
  }

  if (action === "accept") {
    if (booking.status !== "pending") {
      return NextResponse.json(
        { error: "대기 중인 예약만 수락할 수 있습니다." },
        { status: 400 }
      );
    }
    await prisma.booking.update({
      where: { id },
      data: { status: "confirmed" },
    });

    // 호스트 승인 → 대화방에 결제 안내 메시지 1건 (게스트가 메시지창에서 결제 유도)
    const officialUserId = await getOfficialUserId();
    if (!officialUserId) {
      console.warn(
        "[Host Accept] Official account not found. Run db:seed to create official@tokyominbak.com"
      );
    }
    if (officialUserId) {
      try {
        const conversation = await prisma.conversation.upsert({
          where: { bookingId: id },
          create: { bookingId: id },
          update: {},
        });
        await prisma.message.create({
          data: {
            conversationId: conversation.id,
            senderId: officialUserId,
            body: "호스트승인이 완료되었어요. 결제 안내드릴게요.",
          },
        });
      } catch (err) {
        console.error("[Host Accept] Conversation/official message:", err);
      }
    }

    // 호스트 승인 → 게스트에게 결제 요청 이메일 발송
    {
      const nights = Math.floor(
        (booking.checkOut.getTime() - booking.checkIn.getTime()) / (24 * 60 * 60 * 1000)
      );
      const emailInfo = {
        listingTitle: booking.listing.title,
        listingLocation: booking.listing.location || "",
        checkIn: booking.checkIn.toISOString().slice(0, 10),
        checkOut: booking.checkOut.toISOString().slice(0, 10),
        guests: booking.guests,
        nights,
        totalPrice: booking.totalPrice,
        guestName: booking.user?.name || "Guest",
        guestEmail: booking.user?.email || "",
        bookingId: id,
        baseUrl: BASE_URL,
      };

      const host = await prisma.user.findUnique({
        where: { id: userId },
        select: { name: true, email: true },
      });
      const hostEmail = host?.email;
      const isSameEmail = hostEmail && booking.user?.email && hostEmail === booking.user.email;

      // 게스트에게 결제 요청 이메일
      if (booking.user?.email && !isSameEmail) {
        const guestMail = paymentRequestGuest(emailInfo);
        sendEmailAsync({ to: booking.user.email, ...guestMail });
      }

      // 호스트 확인 이메일 (일본어 - 결제 대기 안내)
      if (hostEmail) {
        const hostMail = paymentRequestHost({
          ...emailInfo,
          hostName: host?.name || "Host",
        });
        sendEmailAsync({ to: hostEmail, ...hostMail });
      }
    }

    return NextResponse.json({ ok: true, status: "confirmed" });
  }

  if (action === "reject" || action === "cancel") {
    if (booking.status === "cancelled") {
      return NextResponse.json(
        { error: "이미 취소된 예약입니다." },
        { status: 400 }
      );
    }
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (booking.checkIn < today) {
      return NextResponse.json(
        { error: "이미 지난 예약은 취소할 수 없습니다." },
        { status: 400 }
      );
    }

    // 결제 완료된 예약이면 호스트 사유로 100% 전액 환불
    const paidTransaction = booking.transactions[0];
    let refundDone = false;
    if (paidTransaction && booking.paymentStatus === "paid") {
      try {
        const reason =
          action === "reject"
            ? "호스트 거절로 인한 전액 환불"
            : "호스트 취소로 인한 전액 환불";
        const refundResult = await cancelPayment(
          paidTransaction.paymentId,
          reason
        );
        await prisma.paymentTransaction.create({
          data: {
            bookingId: id,
            paymentId: paidTransaction.paymentId,
            transactionId: refundResult.cancellation?.id || null,
            amount: booking.totalPrice,
            status: "refunded",
            method: paidTransaction.method,
            pgProvider: paidTransaction.pgProvider,
            rawResponse: JSON.stringify(refundResult),
            verifiedAt: new Date(),
          },
        });
        refundDone = true;
      } catch (err) {
        console.error("호스트 취소 환불 오류:", err);
        return NextResponse.json(
          { error: "환불 처리 중 오류가 발생했습니다. 관리자에게 문의해 주세요." },
          { status: 500 }
        );
      }
    }

    await prisma.booking.update({
      where: { id },
      data: {
        status: "cancelled",
        rejectedByHost: action === "reject",
        ...(refundDone ? { paymentStatus: "refunded" } : {}),
      },
    });
    // Notify guest & host: booking rejected/cancelled by host
    {
      const nights = Math.floor(
        (booking.checkOut.getTime() - booking.checkIn.getTime()) / (24 * 60 * 60 * 1000)
      );
      const emailInfo = {
        listingTitle: booking.listing.title,
        listingLocation: booking.listing.location || "",
        checkIn: booking.checkIn.toISOString().slice(0, 10),
        checkOut: booking.checkOut.toISOString().slice(0, 10),
        guests: booking.guests,
        nights,
        totalPrice: booking.totalPrice,
        guestName: booking.user?.name || "Guest",
        guestEmail: booking.user?.email || "",
        bookingId: id,
        baseUrl: BASE_URL,
      };

      // 호스트 이메일 조회
      const host = await prisma.user.findUnique({
        where: { id: userId },
        select: { name: true, email: true },
      });
      const hostEmail = host?.email;
      const isSameEmail = hostEmail && booking.user?.email && hostEmail === booking.user.email;

      // 게스트 이메일 (호스트와 같은 이메일이면 생략)
      if (booking.user?.email && !isSameEmail) {
        const guestMail = bookingRejectedGuest(emailInfo);
        sendEmailAsync({ to: booking.user.email, ...guestMail });
      }

      // 호스트 확인 이메일 (일본어)
      if (hostEmail) {
        const hostMail = bookingRejectedHost({
          ...emailInfo,
          hostName: host?.name || "Host",
        });
        sendEmailAsync({ to: hostEmail, ...hostMail });
      }
    }

    return NextResponse.json({
      ok: true,
      status: "cancelled",
      refunded: refundDone,
      refundAmount: refundDone ? booking.totalPrice : 0,
    });
  }

  return NextResponse.json(
    { error: "지원하지 않는 요청입니다. (action: accept | reject | cancel)" },
    { status: 400 }
  );
}
